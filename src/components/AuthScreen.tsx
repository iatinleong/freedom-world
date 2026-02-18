'use client';

import { useState } from 'react';
import { useAuthStore } from '@/lib/supabase/authStore';
import { Eye, EyeOff, LogIn, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AuthScreen() {
    const { signIn, signUp } = useAuthStore();
    const [tab, setTab] = useState<'login' | 'register'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [info, setInfo] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setInfo('');
        setIsLoading(true);

        if (tab === 'login') {
            const { error } = await signIn(email, password);
            if (error) setError(error);
        } else {
            const { error } = await signUp(email, password);
            if (error) {
                setError(error);
            } else {
                setInfo('註冊成功！請查收驗證電郵，確認後即可登入。');
                setTab('login');
            }
        }
        setIsLoading(false);
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-wuxia-gold/3 blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-wuxia-crimson/3 blur-3xl" />
            </div>

            <div className="relative w-full max-w-sm">
                {/* Title */}
                <div className="text-center mb-8">
                    <h1 className="ancient-title text-4xl tracking-[0.5em] text-wuxia-gold drop-shadow-lg mb-2">
                        自由江湖
                    </h1>
                    <p className="text-wuxia-gold/40 text-xs tracking-[0.8em] uppercase font-serif">
                        Freedom Jianghu
                    </p>
                    <div className="mt-4 flex items-center gap-3 justify-center opacity-30">
                        <div className="h-px w-16 bg-wuxia-gold/50" />
                        <span className="text-wuxia-gold text-xs">闖蕩江湖，留名千古</span>
                        <div className="h-px w-16 bg-wuxia-gold/50" />
                    </div>
                </div>

                {/* Card */}
                <div className="bg-black/80 border border-wuxia-gold/30 rounded-sm shadow-2xl shadow-black overflow-hidden">
                    {/* Top gold line */}
                    <div className="h-0.5 bg-gradient-to-r from-transparent via-wuxia-gold/60 to-transparent" />

                    {/* Tabs */}
                    <div className="flex border-b border-wuxia-gold/20">
                        <button
                            onClick={() => { setTab('login'); setError(''); setInfo(''); }}
                            className={cn(
                                "flex-1 py-3 text-sm font-serif tracking-widest transition-all",
                                tab === 'login'
                                    ? "text-wuxia-gold bg-wuxia-gold/5 border-b-2 border-wuxia-gold"
                                    : "text-white/40 hover:text-white/60"
                            )}
                        >
                            登入
                        </button>
                        <button
                            onClick={() => { setTab('register'); setError(''); setInfo(''); }}
                            className={cn(
                                "flex-1 py-3 text-sm font-serif tracking-widest transition-all",
                                tab === 'register'
                                    ? "text-wuxia-gold bg-wuxia-gold/5 border-b-2 border-wuxia-gold"
                                    : "text-white/40 hover:text-white/60"
                            )}
                        >
                            註冊
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-6 space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs text-wuxia-gold/60 font-serif tracking-widest">
                                電郵
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                                placeholder="your@email.com"
                                className="w-full bg-white/5 border border-white/10 rounded-sm px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-wuxia-gold/50 focus:bg-wuxia-gold/5 transition-all font-mono"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs text-wuxia-gold/60 font-serif tracking-widest">
                                密碼
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    required
                                    minLength={6}
                                    placeholder="••••••"
                                    className="w-full bg-white/5 border border-white/10 rounded-sm px-3 py-2.5 pr-10 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-wuxia-gold/50 focus:bg-wuxia-gold/5 transition-all font-mono"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(v => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            {tab === 'register' && (
                                <p className="text-[11px] text-white/30">至少 6 個字元</p>
                            )}
                        </div>

                        {error && (
                            <div className="px-3 py-2 bg-wuxia-crimson/10 border border-wuxia-crimson/30 rounded-sm text-xs text-wuxia-crimson font-serif">
                                {error}
                            </div>
                        )}

                        {info && (
                            <div className="px-3 py-2 bg-emerald-900/20 border border-emerald-500/30 rounded-sm text-xs text-emerald-400 font-serif">
                                {info}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex items-center justify-center gap-2 py-3 bg-wuxia-gold/10 border border-wuxia-gold/40 rounded-sm text-wuxia-gold font-serif tracking-widest text-sm hover:bg-wuxia-gold/20 hover:border-wuxia-gold/70 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <span className="animate-pulse">處理中...</span>
                            ) : tab === 'login' ? (
                                <>
                                    <LogIn className="w-4 h-4" />
                                    <span>踏入江湖</span>
                                </>
                            ) : (
                                <>
                                    <UserPlus className="w-4 h-4" />
                                    <span>立下門戶</span>
                                </>
                            )}
                        </button>
                    </form>

                    <div className="px-6 pb-4 text-center text-[11px] text-white/20 font-serif">
                        {tab === 'login' ? '尚未立戶？點「註冊」創建帳號' : '已有門戶？點「登入」繼續征途'}
                    </div>

                    {/* Bottom gold line */}
                    <div className="h-0.5 bg-gradient-to-r from-transparent via-wuxia-gold/30 to-transparent" />
                </div>
            </div>
        </div>
    );
}
