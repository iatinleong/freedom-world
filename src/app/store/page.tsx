import { StoreSection } from '@/components/StoreSection';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export default function StorePage() {
    return (
        <div className="min-h-screen bg-[#08090d] text-white">
            <div className="p-6">
                <Link href="/game" className="inline-flex items-center text-wuxia-gold/70 hover:text-wuxia-gold transition-colors">
                    <ChevronLeft className="w-5 h-5 mr-1" />
                    返回遊戲
                </Link>
            </div>
            <StoreSection />
        </div>
    );
}
