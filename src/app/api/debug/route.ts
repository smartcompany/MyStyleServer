import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  console.log('========== API 라우트에서 요청 정보 확인 ==========');
  
  // URL 정보
  console.log('🔍 [API] URL:', request.url);
  console.log('🔍 [API] pathname:', request.nextUrl.pathname);
  console.log('🔍 [API] searchParams:', Object.fromEntries(request.nextUrl.searchParams.entries()));
  
  // 헤더 정보
  console.log('🔍 [API] User-Agent:', request.headers.get('user-agent'));
  console.log('🔍 [API] Referer:', request.headers.get('referer'));
  console.log('🔍 [API] 모든 헤더:');
  request.headers.forEach((value, key) => {
    console.log(`  - ${key}: ${value}`);
  });
  
  // 쿼리 파라미터
  const data = request.nextUrl.searchParams.get('data');
  const compressed = request.nextUrl.searchParams.get('compressed');
  console.log('🔍 [API] data 파라미터 길이:', data?.length);
  console.log('🔍 [API] compressed 파라미터:', compressed);
  
  console.log('========================================');
  
  return NextResponse.json({
    message: 'API 라우트 요청 정보 확인 완료',
    url: request.url,
    searchParams: Object.fromEntries(request.nextUrl.searchParams.entries()),
    headers: Object.fromEntries(request.headers.entries()),
    dataLength: data?.length,
    compressed: compressed,
  });
}

export async function POST(request: NextRequest) {
  console.log('========== POST 요청 정보 확인 ==========');
  
  // URL 정보
  console.log('🔍 [POST] URL:', request.url);
  console.log('🔍 [POST] pathname:', request.nextUrl.pathname);
  
  // 헤더 정보
  console.log('🔍 [POST] Content-Type:', request.headers.get('content-type'));
  console.log('🔍 [POST] User-Agent:', request.headers.get('user-agent'));
  console.log('🔍 [POST] Referer:', request.headers.get('referer'));
  
  // Body 데이터
  try {
    const body = await request.text();
    console.log('🔍 [POST] Body 길이:', body.length);
    console.log('🔍 [POST] Body 내용 (처음 200자):', body.substring(0, 200));
    
    // JSON 파싱 시도
    try {
      const jsonData = JSON.parse(body);
      console.log('🔍 [POST] JSON 데이터:', jsonData);
    } catch (e) {
      console.log('🔍 [POST] JSON 파싱 실패:', e);
    }
  } catch (e) {
    console.log('🔍 [POST] Body 읽기 실패:', e);
  }
  
  console.log('========================================');
  
  return NextResponse.json({
    message: 'POST 요청 정보 확인 완료',
    url: request.url,
    headers: Object.fromEntries(request.headers.entries()),
  });
}
