import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  console.log('========== /share 페이지 GET 요청 확인 ==========');
  
  // URL 정보
  console.log('🔍 [GET] URL:', request.url);
  console.log('🔍 [GET] pathname:', request.nextUrl.pathname);
  console.log('🔍 [GET] searchParams:', Object.fromEntries(request.nextUrl.searchParams.entries()));
  
  // 헤더 정보
  console.log('🔍 [GET] User-Agent:', request.headers.get('user-agent'));
  console.log('🔍 [GET] Referer:', request.headers.get('referer'));
  
  // HTML 응답
  const html = `
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>AI 스타일 분석 결과</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
        .container { max-width: 800px; margin: 0 auto; background: white; border-radius: 10px; padding: 30px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); }
        .error { color: #e74c3c; text-align: center; }
        .debug { background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 5px; padding: 15px; margin: 20px 0; }
        .debug h3 { margin-top: 0; color: #495057; }
        .debug pre { background: #e9ecef; padding: 10px; border-radius: 3px; overflow-x: auto; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🔍 카카오톡 공유 디버깅 페이지</h1>
        <div class="debug">
          <h3>📊 요청 정보</h3>
          <p><strong>URL:</strong> ${request.url}</p>
          <p><strong>Method:</strong> GET</p>
          <p><strong>User-Agent:</strong> ${request.headers.get('user-agent') || 'N/A'}</p>
          <p><strong>Referer:</strong> ${request.headers.get('referer') || 'N/A'}</p>
          <p><strong>Search Params:</strong></p>
          <pre>${JSON.stringify(Object.fromEntries(request.nextUrl.searchParams.entries()), null, 2)}</pre>
        </div>
        
        <div class="error">
          <h2>⚠️ 결과를 찾을 수 없습니다</h2>
          <p>공유 데이터를 찾을 수 없습니다.</p>
          <p>카카오톡에서 전달된 데이터가 없거나 올바르지 않습니다.</p>
        </div>
        
        <div class="debug">
          <h3>🔧 디버깅 정보</h3>
          <p>개발자 도구 (F12) → Console 탭에서 더 자세한 로그를 확인하세요.</p>
          <p>서버 콘솔에서도 요청 정보를 확인할 수 있습니다.</p>
        </div>
      </div>
      
      <script>
        console.log('========== 클라이언트 사이드 디버깅 ==========');
        console.log('🔍 [클라이언트] URL:', window.location.href);
        console.log('🔍 [클라이언트] Search:', window.location.search);
        console.log('🔍 [클라이언트] User-Agent:', navigator.userAgent);
        console.log('🔍 [클라이언트] Referer:', document.referrer);
        console.log('========================================');
      </script>
    </body>
    </html>
  `;
  
  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
    },
  });
}

export async function POST(request: NextRequest) {
  console.log('========== /share 페이지 POST 요청 확인 ==========');
  
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
    console.log('🔍 [POST] Body 내용 (처음 500자):', body.substring(0, 500));
    
    // JSON 파싱 시도
    try {
      const jsonData = JSON.parse(body);
      console.log('🔍 [POST] JSON 데이터:', jsonData);
      
      // 카카오톡 데이터가 있는지 확인
      if (jsonData.data || jsonData.kakaoData) {
        console.log('✅ [POST] 카카오톡 데이터 발견!');
        
        // POST 요청에도 HTML 응답
        const html = `
          <!DOCTYPE html>
          <html lang="ko">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>AI 스타일 분석 결과</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
              .container { max-width: 800px; margin: 0 auto; background: white; border-radius: 10px; padding: 30px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); }
              .success { color: #27ae60; text-align: center; }
              .debug { background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 5px; padding: 15px; margin: 20px 0; }
              .debug h3 { margin-top: 0; color: #495057; }
              .debug pre { background: #e9ecef; padding: 10px; border-radius: 3px; overflow-x: auto; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>✅ 카카오톡 POST 데이터 수신 완료!</h1>
              <div class="success">
                <h2>🎉 데이터를 성공적으로 받았습니다</h2>
                <p>카카오톡에서 POST 방식으로 데이터를 전달했습니다.</p>
              </div>
              
              <div class="debug">
                <h3>📊 수신된 데이터</h3>
                <pre>${JSON.stringify(jsonData, null, 2)}</pre>
              </div>
            </div>
          </body>
          </html>
        `;
        
        return new NextResponse(html, {
          headers: {
            'Content-Type': 'text/html',
          },
        });
      }
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
