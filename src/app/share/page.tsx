'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';

// 동적 렌더링 강제 (prerendering 비활성화)
export const dynamic = 'force-dynamic';

interface AnalysisResult {
  id: string;
  originalImage: string;
  analysisResult: {
    styleAnalysis: {
      colorEvaluation: string;
      silhouette: string;
    };
    bodyAnalysis: {
      height: string;
      bodyType: string;
    };
    recommendations: Array<{
      item: string;
      reason: string;
      imageUrl?: string;
    }>;
  };
  createdAt: string;
  language: string;
}

export default function SharePage() {
  const searchParams = useSearchParams();
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadResult = async () => {
      try {
        // URL 파라미터에서 데이터 확인
        const dataParam = searchParams.get('data');
        console.log('🔍 [웹 페이지] dataParam:', dataParam);
        
        if (dataParam) {
          // URL 파라미터에서 데이터 디코딩
          const decodedData = decodeURIComponent(dataParam);
          console.log('🔍 [웹 페이지] decodedData:', decodedData);
          
          const resultData = JSON.parse(decodedData);
          console.log('🔍 [웹 페이지] resultData:', resultData);
          
          // AnalysisResult 형태로 변환
          const analysisResult: AnalysisResult = {
            id: 'shared',
            originalImage: '', // 이미지는 URL 파라미터에 포함하지 않음
            analysisResult: resultData,
            createdAt: new Date().toISOString(),
            language: resultData.language || 'ko',
          };
          
          console.log('🔍 [웹 페이지] analysisResult:', analysisResult);
          setResult(analysisResult);
        } else {
          console.log('❌ [웹 페이지] dataParam이 없습니다');
          setError('공유 데이터를 찾을 수 없습니다.');
        }
      } catch (err) {
        console.error('❌ [웹 페이지] 오류:', err);
        setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    // 클라이언트에서만 실행되도록 확인
    if (typeof window !== 'undefined') {
      loadResult();
    } else {
      setLoading(false);
      setError('서버 사이드에서는 렌더링할 수 없습니다.');
    }
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">결과를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">결과를 찾을 수 없습니다</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  const getHeightDisplayName = (height: string) => {
    switch (height.toLowerCase()) {
      case 'tall': return '키 큰';
      case 'medium': return '보통';
      case 'short': return '키 작은';
      default: return height;
    }
  };

  const getBodyTypeDisplayName = (bodyType: string) => {
    switch (bodyType.toLowerCase()) {
      case 'hourglass': return '모래시계형';
      case 'rectangle': return '직사각형';
      case 'pear': return '배형';
      case 'apple': return '사과형';
      case 'inverted_triangle': return '역삼각형';
      default: return bodyType;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">AI 스타일 분석 결과</h1>
              <p className="text-gray-600 mt-1">나만의 맞춤형 스타일 분석 결과</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">
                {new Date(result.createdAt).toLocaleDateString('ko-KR')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Original Image */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">원본 사진</h2>
              <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center">
                {result.originalImage ? (
                  <img 
                    src={result.originalImage} 
                    alt="원본 사진"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center text-gray-500">
                    <div className="text-6xl mb-4">📸</div>
                    <p>원본 사진은 앱에서 확인하세요</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Analysis Results */}
          <div className="space-y-6">
            {/* Style Analysis */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">스타일 분석</h2>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 text-lg">🎨</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">색상 평가</p>
                    <p className="text-gray-600">{result.analysisResult.styleAnalysis.colorEvaluation}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 text-lg">👤</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">실루엣 분석</p>
                    <p className="text-gray-600">{result.analysisResult.styleAnalysis.silhouette}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Body Analysis */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">체형 분석</h2>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-purple-600 text-lg">📏</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">키</p>
                    <p className="text-gray-600">{getHeightDisplayName(result.analysisResult.bodyAnalysis.height)}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                    <span className="text-orange-600 text-lg">🔍</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">체형</p>
                    <p className="text-gray-600">{getBodyTypeDisplayName(result.analysisResult.bodyAnalysis.bodyType)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="mt-8 bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">추천 스타일</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {result.analysisResult.recommendations.map((rec, index) => (
              <div key={index} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-gray-800 mb-2">{rec.item}</h3>
                <p className="text-gray-600 text-sm">{rec.reason}</p>
                {rec.imageUrl && (
                  <div className="mt-3">
                    <img 
                      src={rec.imageUrl} 
                      alt={rec.item}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Download App CTA */}
        <div className="mt-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-lg p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-4">나만의 스타일을 분석해보세요!</h2>
          <p className="text-lg mb-6 opacity-90">
            AI가 당신의 체형과 스타일을 분석하여 최적의 패션 아이템을 추천해드립니다.
          </p>
          <div className="flex justify-center space-x-4">
            <a 
              href="https://play.google.com/store/apps/details?id=com.smartCompany.styleMe"
              className="bg-white text-blue-600 px-6 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-colors"
            >
              Google Play에서 다운로드
            </a>
            <a 
              href="https://apps.apple.com/app/stylme"
              className="bg-white text-blue-600 px-6 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-colors"
            >
              App Store에서 다운로드
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
