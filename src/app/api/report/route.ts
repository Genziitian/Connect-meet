// ============================================================
// API: Report User
// ============================================================
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { sessionId, reportedUserId, reason, description } =
      await request.json();

    // Validation
    if (!sessionId || !reportedUserId || !reason) {
      return NextResponse.json(
        { error: 'Session ID, reported user, and reason are required' },
        { status: 400 }
      );
    }

    const validReasons = [
      'harassment',
      'nudity',
      'spam',
      'hate_speech',
      'impersonation',
      'underage',
      'other',
    ];

    if (!validReasons.includes(reason)) {
      return NextResponse.json(
        { error: 'Invalid report reason' },
        { status: 400 }
      );
    }

    // Compliance logging (IT Rules 2021)
    const report = {
      reportId: `rpt_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      sessionId,
      reportedUserId,
      // reporterUserId: extracted from JWT
      reason,
      description: description?.slice(0, 500) || '',
      timestamp: new Date().toISOString(),
      status: 'pending',
      // ipHash: await hashIP(request.ip),
    };

    // In production: save to database
    // await db.reports.create(report);

    // In production: check if user has multiple reports -> auto-ban
    // const reportCount = await db.reports.count({ where: { reportedUserId } });
    // if (reportCount >= 3) {
    //   await db.users.update({ where: { id: reportedUserId }, data: { isBanned: true } });
    // }

    // Mark session as reported
    // await db.sessions.update({ where: { sessionId }, data: { reportedFlag: true } });

    console.log('[REPORT] New report:', report);

    return NextResponse.json({
      success: true,
      reportId: report.reportId,
      message: 'Report submitted successfully. We will review within 48 hours.',
    });
  } catch (error) {
    console.error('[REPORT] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
