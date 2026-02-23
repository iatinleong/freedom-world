import { NextResponse } from 'next/server';

// In-memory cache — resets on cold start, acceptable for exchange rate
let cached: { rate: number; timestamp: number } | null = null;
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

export async function GET() {
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return NextResponse.json({ rate: cached.rate });
    }
    try {
        const res = await fetch('https://api.frankfurter.app/latest?from=USD&to=TWD', {
            next: { revalidate: 86400 }, // Next.js fetch cache 24h
        });
        const data = await res.json();
        const rate: number = data.rates?.TWD;
        if (!rate) throw new Error('no rate');
        cached = { rate, timestamp: Date.now() };
        return NextResponse.json({ rate });
    } catch {
        const fallback = 32;
        return NextResponse.json({ rate: fallback });
    }
}
