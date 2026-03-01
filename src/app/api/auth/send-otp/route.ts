// ============================================================
// API: Auth — Send OTP
// ============================================================
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Rate limiting check (in production: check Redis)
    // const rateLimited = await checkRateLimit(email);
    // if (rateLimited) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

    // Generate OTP (in production: use crypto.randomInt)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP (in production: store in Redis with TTL)
    // await redis.set(`otp:${email}`, otp, 'EX', 300);

    // Send OTP via email (in production: use email service)
    // await sendEmail(email, 'Your GenZ IITian OTP', `Your OTP is: ${otp}`);

    console.log(`[AUTH] OTP generated for ${email}: ${otp}`);

    return NextResponse.json({
      success: true,
      message: 'OTP sent successfully',
      // In production, never send OTP in response
      debug_otp: process.env.NODE_ENV === 'development' ? otp : undefined,
    });
  } catch (error) {
    console.error('[AUTH] Send OTP error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
