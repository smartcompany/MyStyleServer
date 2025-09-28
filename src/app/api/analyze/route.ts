import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import faceAnalysisPrompt from './face_analysis_prompt.txt';
import dummyAnalysis from './dummy-analysis.json';
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
    console.log('분석 API 호출 시작');
    
    // 언어 정보 추출
    const language = getLanguageFromHeaders(request);
    console.log('요청 언어:', language);
    
    // Check if dummy mode is enabled from dummy-analysis.json
    const useDummy = dummyAnalysis.useDummy === true;
    
    if (useDummy) {
      console.log('더미 분석 결과 반환');
      
      // 언어별 더미 데이터 로드
      let dummyData;
      try {
        switch (language) {
          case 'en':
            dummyData = await import('./dummy-analysis-en.json');
            break;
          case 'ja':
            dummyData = await import('./dummy-analysis-ja.json');
            break;
          case 'zh':
            dummyData = await import('./dummy-analysis-zh.json');
            break;
          default:
            dummyData = dummyAnalysis; // 한국어 기본값
        }
      } catch (error) {
        console.error('언어별 더미 데이터 로드 실패:', error);
        dummyData = dummyAnalysis; // 기본값으로 폴백
      }
      
      // useDummy 필드를 제거하고 클라이언트에 전달
      const { useDummy: _, ...analysisResult } = dummyData;
      console.log('서버에서 보내는 분석 결과:', JSON.stringify(analysisResult, null, 2));
      return NextResponse.json(analysisResult);
    }
    
    const formData = await request.formData();
    const imageFile = formData.get('image') as File;
    
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
    const fileName = `user-photos/analysis_${Date.now()}_${imageFile.name}`;
    
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

    // 언어별 프롬프트 생성
    const prompt = getLanguageSpecificPrompt(faceAnalysisPrompt, language);
    console.log('언어별 프롬프트 사용:', language);

    // OpenAI Vision API 호출
    console.log('OpenAI API 호출 시작');
    
    const response = await openai.chat.completions.create({
      ...openAIConfig,
      messages: [
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

    console.log('OpenAI API 응답 받음');

    const analysisResult = response.choices[0]?.message?.content;
    console.log('분석 결과 길이:', analysisResult?.length || 0);
    console.log('finish_reason:', response.choices[0]?.finish_reason);
    console.log('message 객체:', response.choices[0]?.message);
    console.log('분석 결과 원본:', analysisResult);
    console.log('전체 응답:', JSON.stringify(response, null, 2));
    
    if (!analysisResult) {
      console.log('분석 결과가 없음');
      return NextResponse.json(
        { error: '분석 결과를 받을 수 없습니다.' },
        { status: 500 }
      );
    }

    // JSON 파싱 시도
    try {
      console.log('JSON 파싱 시작');
      const parsedResult = JSON.parse(analysisResult);
      console.log('JSON 파싱 성공, 결과 키들:', Object.keys(parsedResult));
      
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
      console.error('JSON 파싱 오류:', parseError);
      console.log('원본 분석 결과:', analysisResult.substring(0, 500) + '...');
      return NextResponse.json(
        { error: '분석 결과 파싱에 실패했습니다.' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('분석 API 오류:', error);
    return NextResponse.json(
      { error: '분석 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
