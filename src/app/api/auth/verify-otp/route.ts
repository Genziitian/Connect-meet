// ============================================================
// API: Auth — Verify OTP & Login
// ============================================================
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, otp, ageConfirmed, consentGiven, rulesAccepted } =
      await request.json();

    // Validation
    if (!email || !otp) {
      return NextResponse.json(
        { error: 'Email and OTP are required' },
        { status: 400 }
      );
    }

    // DPDP Act compliance checks
    if (!ageConfirmed) {
      return NextResponse.json(
        { error: 'Age verification is required' },
        { status: 400 }
      );
    }

    if (!consentGiven) {
      return NextResponse.json(
        { error: 'Data processing consent is required under DPDP Act 2023' },
        { status: 400 }
      );
    }

    if (!rulesAccepted) {
      return NextResponse.json(
        { error: 'Community rules acceptance is required' },
        { status: 400 }
      );
    }

    // Verify OTP (in production: check Redis)
    // const storedOtp = await redis.get(`otp:${email}`);
    // if (storedOtp !== otp) {
    //   return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 401 });
    // }

    // Create or find user (in production: database query)
    // const user = await db.users.upsert({
    //   where: { email },
    //   update: { lastActiveAt: new Date() },
    //   create: {
    //     email,
    //     isVerified: true,
    //     ageVerified: true,
    //     consentGiven: true,
    //     planType: 'free',
    //   },
    // });

    // Log consent (DPDP Act compliance)
    // await db.consentLog.create({
    //   userId: user.id,
    //   consentType: 'data_processing',
    //   consentVersion: '1.0',
    //   ipHash: await hashIP(request.ip),
    //   timestamp: new Date(),
    // });

    // Generate JWT (in production: use proper JWT signing)
    const mockToken = `jwt_${Date.now()}_${Math.random().toString(36)}`;

    // Clean up OTP
    // await redis.del(`otp:${email}`);

    return NextResponse.json({
      success: true,
      token: mockToken,
      user: {
        id: `usr_${Math.random().toString(36).substr(2, 9)}`,
        email,
        planType: 'free',
        isVerified: true,
        isBanned: false,
        ageVerified: true,
        consentGiven: true,
      },
    });
  } catch (error) {
    console.error('[AUTH] Verify OTP error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
