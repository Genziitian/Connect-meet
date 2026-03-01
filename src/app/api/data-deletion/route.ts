// ============================================================
// API: Data Deletion Request (DPDP Act 2023 Compliance)
// ============================================================
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, reason } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Verify the user exists
    // const user = await db.users.findUnique({ where: { email } });
    // if (!user) {
    //   return NextResponse.json({ error: 'No account found with this email' }, { status: 404 });
    // }

    // Create deletion request
    const deletionRequest = {
      requestId: `del_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      email,
      reason: reason?.slice(0, 500) || '',
      requestedAt: new Date().toISOString(),
      scheduledDeletionDate: new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000
      ).toISOString(), // 30 days as per DPDP Act
      status: 'pending',
    };

    // In production:
    // 1. Save deletion request to database
    // await db.deletionRequests.create(deletionRequest);
    //
    // 2. Schedule data deletion job
    // await queue.add('data-deletion', { userId: user.id }, { delay: 30 * 24 * 60 * 60 * 1000 });
    //
    // 3. Send confirmation email
    // await sendEmail(email, 'Data Deletion Confirmation', `Your data will be deleted by ${deletionRequest.scheduledDeletionDate}`);
    //
    // 4. Immediately deactivate account
    // await db.users.update({ where: { email }, data: { isActive: false } });
    //
    // 5. Revoke all active sessions
    // await redis.del(`sessions:${user.id}`);

    console.log('[DPDP] Data deletion request:', deletionRequest);

    return NextResponse.json({
      success: true,
      requestId: deletionRequest.requestId,
      scheduledDeletionDate: deletionRequest.scheduledDeletionDate,
      message:
        'Data deletion request received. Your data will be permanently deleted within 30 days as per DPDP Act 2023.',
    });
  } catch (error) {
    console.error('[DPDP] Deletion request error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
