import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import admin from 'firebase-admin';

function getAdminDb() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Firebase Admin is not configured');
  }

  if (admin.apps.length === 0) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
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
    const adminDb = getAdminDb();

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
