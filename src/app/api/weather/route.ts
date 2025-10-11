import { NextRequest, NextResponse } from 'next/server';
import { WeatherService } from '@/lib/weather-service';
import { Weather, WeatherForecast } from '@/types/weather';

// 캐시 저장소
const weatherCache = new Map<string, { data: WeatherResponse; timestamp: number }>();
const CACHE_DURATION = 2 * 60 * 1000; // 2분으로 단축

interface WeatherResponse {
  current: Weather;
  forecast: WeatherForecast;
}

function getCacheKey(lat: number, lon: number, language: string): string {
  return `${lat.toFixed(2)},${lon.toFixed(2)},${language}`;
}

function getCachedWeather(key: string) {
  const cached = weatherCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
}

function setCachedWeather(key: string, data: WeatherResponse) {
  weatherCache.set(key, {
    data,
    timestamp: Date.now(),
  });
}

export async function GET(request: NextRequest) {
  console.log('=== Weather API GET 요청 시작 ===');
  console.log('요청 URL:', request.url);
  console.log('요청 메서드:', request.method);
  console.log('요청 헤더:', Object.fromEntries(request.headers.entries()));
  
  try {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat');
    const lon = searchParams.get('lon');
    const city = searchParams.get('city');
    
    console.log('쿼리 파라미터 - lat:', lat, 'lon:', lon, 'city:', city);
    
    // 언어 정보 추출 (클라이언트에서 전달)
    const language = request.headers.get('X-Language') || 'en';
    console.log('언어 설정:', language);

    if (!lat || !lon) {
      console.log('❌ lat 또는 lon 파라미터 누락');
      return NextResponse.json(
        { error: 'Latitude and longitude are required' },
        { status: 400 }
      );
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);
    const cacheKey = getCacheKey(latitude, longitude, language);
    
    console.log('좌표 변환 완료 - latitude:', latitude, 'longitude:', longitude);
    console.log('캐시 키:', cacheKey);

    // 캐시된 데이터 확인
    const cachedWeather = getCachedWeather(cacheKey);
    if (cachedWeather) {
      console.log('✅ 캐시된 데이터 반환:', cacheKey);
      return NextResponse.json(cachedWeather);
    }

    console.log('🔄 새로운 날씨 데이터 가져오기 시작');
    
    // 새로운 데이터 가져오기
    console.log('WeatherService 인스턴스 생성 중...');
    const weatherService = new WeatherService();
    console.log('WeatherService 인스턴스 생성 완료');
    
    console.log('현재 날씨와 예보 동시 요청 시작...');
    // 현재 날씨와 예보를 함께 가져오기
    const [weather, forecast] = await Promise.all([
      weatherService.getCurrentWeather(latitude, longitude, language),
      weatherService.getWeatherForecast(latitude, longitude, language)
    ]);
    
    console.log('✅ 날씨 데이터 요청 완료');
    console.log('현재 날씨:', JSON.stringify(weather, null, 2));
    console.log('예보:', JSON.stringify(forecast, null, 2));

    const result = {
      current: weather,
      forecast: forecast
    };

    // 캐시에 저장
    setCachedWeather(cacheKey, result);
    console.log('💾 캐시에 데이터 저장 완료:', cacheKey);

    console.log('=== Weather API 응답 반환 ===');
    return NextResponse.json(result);
  } catch (error) {
    console.error('❌ Weather API 에러 발생:');
    console.error('에러 타입:', typeof error);
    console.error('에러 메시지:', error instanceof Error ? error.message : String(error));
    console.error('에러 스택:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('전체 에러 객체:', error);
    
    return NextResponse.json(
      { error: 'Failed to fetch weather data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { city } = body;

    if (!city) {
      return NextResponse.json(
        { error: 'City name is required' },
        { status: 400 }
      );
    }

    const weatherService = new WeatherService();
    const weather = await weatherService.getWeatherByCity(city);

    return NextResponse.json(weather);
  } catch (error) {
    console.error('Weather API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch weather data' },
      { status: 500 }
    );
  }
}
