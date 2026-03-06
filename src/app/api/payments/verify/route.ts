import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import admin from 'firebase-admin';

export const dynamic = 'force-dynamic';

function getFirebaseAdmin() {
  if (admin.apps.length === 0) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  }
  return admin.firestore();
}

const PLAN_LIMITS: Record<string, number> = {
  pro: 50,
  premium: -1, // unlimited
};

export async function POST(req: NextRequest) {
  try {
    const adminDb = getFirebaseAdmin();

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
    await adminDb.doc(`users/${userId}`).set({
      planType: planId,
      maxMatchesPerDay: maxMatches,
      lastPaymentId: razorpay_payment_id,
      lastPaymentAt: new Date(),
      subscriptionStatus: 'active',
    }, { merge: true });

    return NextResponse.json({ success: true, planId });
  } catch (error: unknown) {
    console.error('Payment verification error:', error);
    const message = error instanceof Error ? error.message : 'Payment verification failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
