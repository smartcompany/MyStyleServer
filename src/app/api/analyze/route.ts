import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import faceAnalysisPrompt from './face_analysis_prompt.txt';
import fullBodyAnalysisPrompt from './fullbody_analysis_prompt.txt';
import dummyAnalysis from './dummy-analysis.json';
import dummyAnalysisBody from './dummy-analysis-body.json';
import { getLanguageFromHeaders, getLanguageSpecificPrompt, openAIConfig } from '../_helpers';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    console.log('통합 분석 API 호출 시작');
    
    // 언어 정보 추출
    const language = getLanguageFromHeaders(request);
    console.log('요청 언어:', language);
    
    const formData = await request.formData();
    const imageFile = formData.get('image') as File;
    const analysisType = formData.get('type') as string || 'face'; // 기본값은 얼굴 분석
    const useDummy = formData.get('useDummy') as string || 'false';
    
    console.log('분석 타입:', analysisType);

    if (useDummy === 'true') {
      console.log('더미 분석 사용');
      if (analysisType === 'fullbody') {
        return NextResponse.json(dummyAnalysisBody);
      } else {
        return NextResponse.json(dummyAnalysis);
      }
    }
    
    if (!imageFile) {
      console.log('이미지 파일이 없음');
      return NextResponse.json(
        { error: '이미지 파일이 필요합니다.' },
        { status: 400 }
      );
    }

    console.log('이미지 파일 받음:', imageFile.name, imageFile.size, 'bytes');

    // Supabase에 이미지 업로드
    const imageBuffer = await imageFile.arrayBuffer();
    const fileName = `user-photos/${analysisType}_analysis_${Date.now()}_${imageFile.name}`;
    
    console.log('Supabase에 이미지 업로드 시작:', fileName);
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(process.env.STORAGE_BUCKET!)
      .upload(fileName, imageBuffer, {
        contentType: imageFile.type,
      });

    if (uploadError) {
      console.error('Supabase 업로드 실패:', uploadError);
      return NextResponse.json(
        { error: `이미지 업로드에 실패했습니다: ${uploadError.message}` },
        { status: 500 }
      );
    }

    console.log('Supabase 업로드 성공:', uploadData.path);

    // 업로드된 이미지의 서명된 URL 생성 (1시간 유효)
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from(process.env.STORAGE_BUCKET!)
      .createSignedUrl(uploadData.path, 3600); // 1시간 유효

    if (signedUrlError) {
      console.error('서명된 URL 생성 실패:', signedUrlError);
      return NextResponse.json(
        { error: '이미지 URL 생성에 실패했습니다.' },
        { status: 500 }
      );
    }

    const imageUrl = signedUrlData.signedUrl;
    console.log('서명된 이미지 URL 생성:', imageUrl);

    // 분석 타입에 따라 다른 프롬프트 사용
    let prompt;
    let systemMessage;
    
    if (analysisType === 'fullbody') {
      // 전신 분석
      prompt = getLanguageSpecificPrompt(fullBodyAnalysisPrompt, language);
      systemMessage = '너는 전문적인 스타일리스트입니다. 사용자의 전신 사진을 분석하여 체형과 현재 스타일을 고려한 맞춤형 패션 조언을 제공합니다.';
    } else {
      // 얼굴 분석 (기본값)
      prompt = getLanguageSpecificPrompt(faceAnalysisPrompt, language);
      systemMessage = '너는 전문적인 얼굴 분석가입니다. 사용자의 얼굴 사진을 분석하여 얼굴형, 피부톤, 헤어스타일 등을 종합적으로 평가하고 개인화된 스타일 조언을 제공합니다.';
    }

    console.log('언어별 프롬프트 사용:', language, '분석 타입:', analysisType);

    // OpenAI Vision API 호출
    console.log('OpenAI API 호출 시작 (분석 타입:', analysisType, ')');
    
    const response = await openai.chat.completions.create({
      ...openAIConfig,
      messages: [
        {
          role: 'system',
          content: systemMessage,
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt,
            },
            {
              type: 'image_url',
              image_url: {
                url: imageUrl,
              },
            },
          ],
        },
      ],
      response_format: {
        type: "json_object"
      }
    });

    console.log('OpenAI API 응답 받음 (분석 타입:', analysisType, ')');

    const analysisResult = response.choices[0]?.message?.content;
    console.log('분석 결과 길이:', analysisResult?.length || 0);
    console.log('finish_reason:', response.choices[0]?.finish_reason);
    console.log('분석 결과 원본:', analysisResult);
    
    if (!analysisResult) {
      console.log('분석 결과가 없음');
      return NextResponse.json(
        { error: '분석 결과를 받을 수 없습니다.' },
        { status: 500 }
      );
    }

    // JSON 파싱 시도
    try {
      console.log('분석 JSON 파싱 시작');
      const parsedResult = JSON.parse(analysisResult);
      console.log('분석 JSON 파싱 성공, 결과 키들:', Object.keys(parsedResult));
      
      // 분석 완료 후 이미지 삭제 (보안)
      try {
        await supabase.storage
          .from(process.env.STORAGE_BUCKET!)
          .remove([uploadData.path]);
        console.log('분석 완료 후 이미지 삭제 성공');
      } catch (deleteError) {
        console.error('이미지 삭제 실패:', deleteError);
        // 삭제 실패해도 분석 결과는 반환
      }
      
      return NextResponse.json(parsedResult);
      } catch (parseError) {
        console.error('분석 JSON 파싱 오류:', parseError);
        console.log('원본 분석 결과:', analysisResult.substring(0, 500) + '...');
        return NextResponse.json(
          { error: '분석 결과 파싱에 실패했습니다.' },
          { status: 500 }
        );
      }

    } catch (error) {
      console.error('통합 분석 API 오류:', error);
      return NextResponse.json(
        { error: '분석 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }
}
