import { NextRequest, NextResponse } from 'next/server';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

// 결과 데이터 타입 정의
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

// 데이터 저장 디렉토리
const DATA_DIR = path.join(process.cwd(), 'data', 'share-results');

// 디렉토리 생성 함수
async function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    await mkdir(DATA_DIR, { recursive: true });
  }
}

// 결과 저장 API
export async function POST(request: NextRequest) {
  try {
    await ensureDataDir();
    
    const body = await request.json();
    const result: AnalysisResult = {
      id: body.id || generateId(),
      originalImage: body.originalImage,
      analysisResult: body.analysisResult,
      createdAt: new Date().toISOString(),
      language: body.language || 'ko',
    };

    // 파일로 저장
    const filePath = path.join(DATA_DIR, `${result.id}.json`);
    await writeFile(filePath, JSON.stringify(result, null, 2));

    return NextResponse.json({ 
      success: true, 
      id: result.id,
      shareUrl: `${request.nextUrl.origin}/share/${result.id}`
    });
  } catch (error) {
    console.error('결과 저장 실패:', error);
    return NextResponse.json(
      { success: false, error: '결과 저장에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// 결과 조회 API
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await ensureDataDir();
    
    const filePath = path.join(DATA_DIR, `${params.id}.json`);
    
    if (!existsSync(filePath)) {
      return NextResponse.json(
        { error: '결과를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const fileContent = await readFile(filePath, 'utf-8');
    const result = JSON.parse(fileContent);

    return NextResponse.json(result);
  } catch (error) {
    console.error('결과 조회 실패:', error);
    return NextResponse.json(
      { error: '결과 조회에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// 고유 ID 생성 함수
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
