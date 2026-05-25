import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getServiceRoleSupabase } from '@/lib/supabase';

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

    // Payment verified — update user plan in Supabase
    const supabase = getServiceRoleSupabase();
    const maxMatches = PLAN_LIMITS[planId] ?? 20;

    const { error } = await supabase
      .from('users')
      .update({
        plan_type: planId,
        max_matches_per_day: maxMatches,
        last_payment_id: razorpay_payment_id,
        last_payment_at: new Date().toISOString(),
        subscription_status: 'active',
      })
      .eq('id', userId);

    if (error) {
      console.error('Supabase update error:', error);
      return NextResponse.json({ error: 'Failed to update user plan' }, { status: 500 });
    }

    return NextResponse.json({ success: true, planId });
  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json({ error: 'Payment verification failed' }, { status: 500 });
  }
}
