// ============================================================
// API: Health Check — GenZ IITian Connect
// ============================================================
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'operational',
    service: 'GenZ IITian Connect',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    compliance: {
      dpdpAct2023: true,
      itAct2000: true,
      itRules2021: true,
    },
  });
}
