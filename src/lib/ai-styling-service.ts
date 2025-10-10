import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

// 타입 정의
interface WeatherData {
  temp_c: number;
  feels_like_c: number;
  condition: string;
  precipitation_mm: number;
  wind_mps: number;
  humidity_pct: number;
}

interface StylingResponse {
  imageUrl: string;
  style: string;
  outfitSummary: string;
  careTips: string[];
}

const storageBucket = process.env.STORAGE_BUCKET; 
const PROMPTS_FOLDER = 'prompts';
const USER_PHOTOS_FOLDER = 'user-photos';

// OpenAI 클라이언트 초기화
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

// Supabase 클라이언트 초기화 (환경 변수 체크)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY;

const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null;


export interface StylingRequest {
  imageUrl: string;
  weatherSummary?: string;
  stylePreset: 'casual' | 'smart_casual' | 'date' | 'outdoor' | 'business';
  recommendedItems?: string[];
  preferredLanguage?: string;
  location?: string;
}

export interface OutfitItem {
  category: string;
  name: string;
  color: string;
  fit: string;
  notes: string;
}

export interface Alternative {
  swap: string;
  when: string;
}

export class AIStylingService {
  private async getPrompts(): Promise<{ systemPrompt: string; userPrompt: string }> {
    // Supabase가 설정되지 않은 경우 에러 반환
    if (!supabase) {
      throw new Error('Supabase 설정이 필요합니다. NEXT_PUBLIC_SUPABASE_URL과 NEXT_PUBLIC_SUPABASE_KEY를 설정해주세요.');
    }
    if (!storageBucket) {
      throw new Error('STORAGE_BUCKET 환경 변수가 필요합니다. Supabase Storage 버킷 이름을 설정해주세요.');
    }

    try {
      // Supabase Storage에서 프롬프트 파일들 다운로드
      const { data: systemPromptData } = await supabase.storage
        .from(storageBucket)
        .download(`${PROMPTS_FOLDER}/cody-system-prompt.txt`);

      const { data: userPromptData } = await supabase.storage
        .from(storageBucket)
        .download(`${PROMPTS_FOLDER}/cody-user-prompt.txt`);

      if (!systemPromptData || !userPromptData) {
        throw new Error('프롬프트 파일을 찾을 수 없습니다.');
      }

      const systemPrompt = await systemPromptData.text();
      const userPrompt = await userPromptData.text();

      return { systemPrompt, userPrompt };
    } catch (error) {
      console.error('프롬프트 로드 실패:', error);
      throw new Error(`프롬프트 로드 실패: ${error}`);
    }
  }

  async generateStyleRecommendation(request: StylingRequest): Promise<StylingResponse> {
    try {
      // 1. 원본 이미지 다운로드
      console.log('이미지 다운로드 시작:', request.imageUrl);
      const imageResponse = await fetch(request.imageUrl);
      if (!imageResponse.ok) {
        throw new Error(`이미지 다운로드 실패: ${imageResponse.status}`);
      }
      
      const imageBuffer = await imageResponse.arrayBuffer();
      const image = Buffer.from(imageBuffer);
      console.log('이미지 다운로드 완료, 크기:', image.length);

      const { systemPrompt, userPrompt } = await this.getPrompts();
      const populatedUserPrompt = this.populatePromptTemplate(userPrompt, request);

        console.log('이미지 편집 시작...');
        const completion = await openai.images.edit({
          model: "gpt-image-1",
          image: new File([image], 'image.jpg', { type: 'image/jpeg' }),
          prompt: populatedUserPrompt,
        });

        console.log('이미지 편집 응답:', completion);

       const url = completion.data?.[0]?.url ?? null;
       if (!url) {
         throw new Error("no image url from API");
       }

       return {
         imageUrl: url,
         style: request.stylePreset,
         outfitSummary: `Weather-appropriate ${request.stylePreset} outfit`,
         careTips: [
           "Follow care instructions on clothing labels",
           "Store items properly to maintain shape"
         ]
       };
    } catch (error) {
      console.error('AI 스타일링 오류:', error);
      throw new Error(`AI 스타일링 실패: ${error}`);
    }
  }

  private populatePromptTemplate(template: string, request: StylingRequest): string {
    const now = new Date();
    const datetime = now.toISOString().slice(0, 16);
    
    // weatherSummary를 파싱해서 개별 필드로 분리
    const weatherData = this.parseWeatherSummary(request.weatherSummary || '');
    
    return template
      .replace('{IMAGE_URL}', request.imageUrl)
      .replace('{CITY_COUNTRY}', request.location || '')
      .replace('{DATE_TIME}', datetime)
      .replace('{WEATHER_CONDITION}', request.weatherSummary || '')
      .replace('{STYLE_PRESET}', `"${request.stylePreset}"`)
      .replace('{WEATHER_TEMP_C}', weatherData.temp_c.toString())
      .replace('{WEATHER_FEELS_LIKE_C}', weatherData.feels_like_c.toString())
      .replace('{WEATHER_CONDITION_NAME}', weatherData.condition)
      .replace('{WEATHER_PRECIPITATION_MM}', weatherData.precipitation_mm.toString())
      .replace('{WEATHER_WIND_MPS}', weatherData.wind_mps.toString())
      .replace('{WEATHER_HUMIDITY_PCT}', weatherData.humidity_pct.toString())
  }

  private parseWeatherSummary(weatherSummary: string): WeatherData {
    // 기본값 설정
    const defaultWeather = {
      temp_c: 22,
      feels_like_c: 24,
      condition: 'Clear',
      precipitation_mm: 0,
      wind_mps: 3.5,
      humidity_pct: 65
    };

    if (!weatherSummary) return defaultWeather;

    try {
      // "temperature : 22 C, feelsLike : 24 C, humidity : 65%, windSpeed : 3.5 m/s, main : Clear, desc : 맑음, location : 서울"
      const parts = weatherSummary.split(',');
      const weather: WeatherData = {
        temp_c: 22,
        feels_like_c: 24,
        condition: 'Clear',
        precipitation_mm: 0,
        wind_mps: 3.5,
        humidity_pct: 65
      };

      parts.forEach(part => {
        const [key, value] = part.split(':').map(s => s.trim());
        if (key && value) {
          switch (key) {
            case 'temperature':
              weather.temp_c = parseFloat(value.replace('C', '').trim());
              break;
            case 'feelsLike':
              weather.feels_like_c = parseFloat(value.replace('C', '').trim());
              break;
            case 'humidity':
              weather.humidity_pct = parseFloat(value.replace('%', '').trim());
              break;
            case 'windSpeed':
              weather.wind_mps = parseFloat(value.replace('m/s', '').trim());
              break;
            case 'main':
              weather.condition = value.trim();
              break;
          }
        }
      });

      return {
        temp_c: weather.temp_c || defaultWeather.temp_c,
        feels_like_c: weather.feels_like_c || defaultWeather.feels_like_c,
        condition: weather.condition || defaultWeather.condition,
        precipitation_mm: weather.precipitation_mm || defaultWeather.precipitation_mm,
        wind_mps: weather.wind_mps || defaultWeather.wind_mps,
        humidity_pct: weather.humidity_pct || defaultWeather.humidity_pct
      };
    } catch (error) {
      console.error('날씨 데이터 파싱 오류:', error);
      return defaultWeather;
    }
  }

  async uploadImageToSupabase(imageBase64: string, fileName: string): Promise<string> {
    // Supabase가 설정되지 않은 경우 에러 반환
    if (!supabase) {
      throw new Error('Supabase 설정이 필요합니다. 이미지 업로드를 위해 Supabase Storage를 설정해주세요.');
    }
    if (!storageBucket) {
      throw new Error('STORAGE_BUCKET 환경 변수가 필요합니다. Supabase Storage 버킷 이름을 설정해주세요.');
    }

    try {
      // Base64를 Buffer로 변환
      const buffer = Buffer.from(imageBase64, 'base64');
      
      // 서비스 키로 인증된 업로드 (관리자 권한)
      const serviceSupabase = createClient(
        supabaseUrl!,
        supabaseKey! // 서비스 키 사용
      );
      
      // Supabase Storage에 업로드 (서비스 키로 인증)
      const { data, error } = await serviceSupabase.storage
        .from(storageBucket)
        .upload(`${USER_PHOTOS_FOLDER}/${fileName}`, buffer, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (error) {
        console.error('Supabase 업로드 에러:', error);
        throw new Error(`이미지 업로드 실패: ${error.message}`);
      }

      console.log('업로드 성공:', data);

      // 서명된 URL 생성 (보안 강화)
      const { data: signedUrlData, error: signedUrlError } = await serviceSupabase.storage
        .from(storageBucket)
        .createSignedUrl(`${USER_PHOTOS_FOLDER}/${fileName}`, 3600); // 1시간 유효

      if (signedUrlError) {
        console.error('서명된 URL 생성 실패:', signedUrlError);
        throw new Error(`서명된 URL 생성 실패: ${signedUrlError.message}`);
      }

      console.log('서명된 URL 생성 성공:', signedUrlData.signedUrl);

      return signedUrlData.signedUrl;
    } catch (error) {
      console.error('Supabase 업로드 오류:', error);
      throw new Error(`이미지 업로드 실패: ${error}`);
    }
  }

  private async saveGeneratedImage(imageUrl: string): Promise<void> {
    try {
      // 생성된 이미지를 Supabase에 저장하는 로직 (선택사항)
      console.log('생성된 이미지 저장:', imageUrl);
    } catch (error) {
      console.error('생성된 이미지 저장 실패:', error);
    }
  }
}
