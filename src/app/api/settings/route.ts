import { NextRequest, NextResponse } from 'next/server';
import adConfig from './ad-config.json';

// 광고 설정 데이터를 가져오는 함수
function getAdConfig() {
  return adConfig;
}

 

// GET /api/settings - 광고 설정 조회
export async function GET() {
  try {
    const adConfig = getAdConfig();
    return NextResponse.json(adConfig, { status: 200 });
  } catch (error) {
    console.error('Error fetching ad settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ad settings' },
      { status: 500 }
    );
  }
}

 