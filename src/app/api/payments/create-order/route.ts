import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';

const PLAN_PRICES: Record<string, number> = {
  pro: 14900,     // ₹149 in paise
  premium: 29900, // ₹299 in paise
};

export async function POST(req: NextRequest) {
  try {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return NextResponse.json({ error: 'Razorpay is not configured' }, { status: 500 });
    }

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    const { planId, userId } = await req.json();

    if (!planId || !userId) {
      return NextResponse.json({ error: 'Missing planId or userId' }, { status: 400 });
    }

    const amount = PLAN_PRICES[planId];
    if (!amount) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    const receipt = `${userId.slice(0, 20)}_${planId}_${Date.now().toString(36)}`.slice(0, 40);
    const order = await razorpay.orders.create({
      amount,
      currency: 'INR',
      receipt,
      notes: { planId, userId },
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error) {
    console.error('Razorpay create order error:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}
