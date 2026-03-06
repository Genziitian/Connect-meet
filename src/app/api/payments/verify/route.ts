import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import admin from 'firebase-admin';
import path from 'path';

// Initialize Firebase Admin (server-side) using service account JSON
if (admin.apps.length === 0) {
  const serviceAccount = require(path.join(process.cwd(), 'config', 'firebase-admin.json'));
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const adminDb = admin.firestore();

const PLAN_LIMITS: Record<string, number> = {
  pro: 50,
  premium: -1, // unlimited
};

export async function POST(req: NextRequest) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId, userId } =
      await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !planId || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
    }

    // Payment verified — update user plan in Firestore
    const maxMatches = PLAN_LIMITS[planId] ?? 20;
    await adminDb.doc(`users/${userId}`).update({
      planType: planId,
      maxMatchesPerDay: maxMatches,
      lastPaymentId: razorpay_payment_id,
      lastPaymentAt: new Date(),
      subscriptionStatus: 'active',
    });

    return NextResponse.json({ success: true, planId });
  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json({ error: 'Payment verification failed' }, { status: 500 });
  }
}
