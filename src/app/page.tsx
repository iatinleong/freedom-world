'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Globe, Mail, Phone, ChevronDown, Check, Sparkles } from 'lucide-react';

// ── 粒子背景 ──────────────────────────────────────────────
function Particles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let raf: number;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);
    const pts = Array.from({ length: 60 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.2 + 0.3,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      o: Math.random() * 0.5 + 0.1,
    }));
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pts.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(212,175,55,${p.o})`;
        ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />;
}

// ── 訂閱卡片 ──────────────────────────────────────────────
interface PlanCardProps {
  name: string;
  usdPrice: number;
  period: string;
  usdOriginal?: number;
  badge?: string;
  features: string[];
  highlight?: boolean;
  note?: string;
  rate: number | null;
}

function toTwd(usd: number, rate: number | null) {
  if (!rate) return '---';
  return `NT$${Math.round(usd * rate)}`;
}

function PlanCard({ name, usdPrice, period, usdOriginal, badge, features, highlight, note, rate }: PlanCardProps) {
  const loading = rate === null;
  return (
    <div className={`relative flex flex-col rounded-xl border p-7 transition-all duration-300
      ${highlight
        ? 'border-fw-gold bg-gradient-to-b from-fw-gold/10 to-transparent shadow-[0_0_40px_rgba(212,175,55,0.15)]'
        : 'border-white/15 bg-white/5 hover:border-white/30'}`}>
      {badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-fw-gold text-black text-xs font-bold rounded-full tracking-wider">
          {badge}
        </div>
      )}
      <div className="mb-6">
        <p className="text-sm text-white/50 tracking-widest uppercase font-mono mb-2">{name}</p>
        <div className="flex items-end gap-2">
          <span className={`text-4xl font-bold transition-all ${highlight ? 'text-fw-gold' : 'text-white'} ${loading ? 'opacity-40' : ''}`}>
            {loading ? '---' : toTwd(usdPrice, rate)}
          </span>
          <span className="text-white/50 text-sm pb-1">{period}</span>
        </div>
        {usdOriginal && rate && (
          <p className="text-xs text-white/30 line-through mt-1">{toTwd(usdOriginal, rate)} / 年</p>
        )}
        {note && <p className="text-xs text-fw-gold/70 mt-2">{note}</p>}
      </div>
      <ul className="space-y-3 flex-1 mb-7">
        {features.map((f, i) => (
          <li key={i} className="flex items-start gap-3 text-sm text-white/70">
            <Check className={`w-4 h-4 shrink-0 mt-0.5 ${highlight ? 'text-fw-gold' : 'text-white/40'}`} />
            {f}
          </li>
        ))}
      </ul>
      <button className={`w-full py-3 rounded-lg font-serif tracking-wider text-sm transition-all
        ${highlight
          ? 'bg-fw-gold text-black hover:bg-fw-gold/90 font-bold'
          : 'border border-white/20 text-white/70 hover:border-white/50 hover:text-white'}`}>
        選擇方案
      </button>
    </div>
  );
}

// ── 主頁面 ────────────────────────────────────────────────
export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [rate, setRate] = useState<number | null>(null);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => {
    fetch('/api/exchange-rate')
      .then(r => r.json())
      .then(d => setRate(d.rate))
      .catch(() => setRate(32)); // fallback
  }, []);

  return (
    <div className="min-h-screen bg-[#08090d] text-white overflow-x-hidden">

      {/* ── Navbar ── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300
        ${scrolled ? 'bg-[#08090d]/90 backdrop-blur-md border-b border-white/10' : ''}`}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded border border-fw-gold/60 flex items-center justify-center">
              <Globe className="w-4 h-4 text-fw-gold" />
            </div>
            <span className="font-serif text-fw-gold tracking-widest text-sm">自由世界</span>
            <span className="text-white/20 text-xs font-mono tracking-[0.3em] uppercase hidden sm:block">Freedom World</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#pricing" className="text-xs text-white/50 hover:text-white transition-colors tracking-widest hidden md:block">方案</a>
            <Link href="/game" className="px-5 py-2 bg-fw-gold/90 hover:bg-fw-gold text-black text-xs font-bold rounded tracking-wider transition-all">
              進入遊戲
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <Particles />
        <div className="relative z-10 max-w-3xl mx-auto">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-fw-gold/60" />
            <span className="text-xs text-fw-gold/60 tracking-[0.5em] uppercase font-mono">Freedom World</span>
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-fw-gold/60" />
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-serif leading-tight mb-8">
            <span className="text-white">自由</span>
            <span className="text-fw-gold">世界</span>
          </h1>

          <p className="text-xl sm:text-2xl text-white/90 font-serif leading-relaxed mb-4">
            別人的武俠，讀完就結束了。
          </p>
          <p className="text-xl sm:text-2xl text-fw-gold font-serif leading-relaxed mb-10">
            這個武俠，只有你能完成。
          </p>
          <p className="text-sm text-white/35 mb-10">
            目前小說的題材有：<span className="text-fw-gold/70">武俠</span>　<span className="text-white/25">（待擴充中）</span>
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/game"
              className="px-10 py-4 bg-fw-gold text-black font-bold text-sm tracking-widest rounded hover:bg-fw-gold/90 transition-all shadow-[0_0_30px_rgba(212,175,55,0.3)] hover:shadow-[0_0_50px_rgba(212,175,55,0.5)]">
              立即體驗
            </Link>
            <a href="#features"
              className="px-10 py-4 border border-white/20 text-white/70 text-sm tracking-widest rounded hover:border-fw-gold/50 hover:text-white transition-all">
              了解更多
            </a>
          </div>
        </div>

        <a href="#features" className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/30 hover:text-white/60 transition-colors">
          <span className="text-[10px] tracking-widest">SCROLL</span>
          <ChevronDown className="w-4 h-4 animate-bounce" />
        </a>
      </section>

      {/* ── 文案區塊 ── */}
      <section id="features" className="py-32 px-6 border-t border-white/5">
        <div className="max-w-2xl mx-auto space-y-32">

          {/* 自由輸入 */}
          <div className="text-center space-y-6">
            <p className="text-xs text-fw-gold/50 tracking-[0.5em] uppercase font-mono">Freedom of Action</p>
            <p className="text-2xl sm:text-3xl font-serif text-white leading-relaxed">
              有人遇到了江湖第一殺手。<br />
              AI 給了四個選項，<br />
              他一個都沒選。
            </p>
            <p className="text-white/50 font-mono text-sm border border-white/10 rounded-lg px-6 py-4 inline-block bg-white/3">
              我裝作沒看見，繼續喝茶
            </p>
            <p className="text-lg text-white/70 font-serif leading-relaxed">
              殺手在他對面坐下，說：「有意思。」<br />
              三章後，那個殺手成了他師父。
            </p>
            <p className="text-white/40 text-sm leading-relaxed">
              你可以選 AI 給的路，也可以走自己的。<br />世界都會回應。
            </p>
          </div>

          {/* 不可逆 */}
          <div className="text-center space-y-6">
            <p className="text-xs text-fw-gold/50 tracking-[0.5em] uppercase font-mono">No Undo</p>
            <p className="text-2xl sm:text-3xl font-serif text-white leading-relaxed">
              她選擇出賣了那個人。
            </p>
            <p className="text-lg text-white/70 font-serif leading-relaxed">
              以為只是一個選項，以為可以回頭。<br />
              但那個人的師兄弟，六章後，<br />認出了她的臉。
            </p>
            <p className="text-white/40 text-sm">
              這個世界沒有讀檔。你做過的事，永遠留在這裡。
            </p>
          </div>

          {/* 每局新世界 */}
          <div className="text-center space-y-6">
            <p className="text-xs text-fw-gold/50 tracking-[0.5em] uppercase font-mono">Infinite Worlds</p>
            <p className="text-2xl sm:text-3xl font-serif text-white leading-relaxed">
              你不知道今天開局的江湖，<br />是什麼樣的底色。
            </p>
            <p className="text-lg text-white/70 font-serif leading-relaxed">
              可能是武林秘典重現、各方爭奪的亂世。<br />
              可能是一樁滅門血案，昨晚才剛發生。<br />
              可能是盛世之下某個你還不知道的裂縫。
            </p>
            <p className="text-white/40 text-sm">
              AI 在你進入之前，已經把這個世界建好了。<br />
              沒有兩個人活在同一個江湖裡。
            </p>
          </div>

          {/* 無審查 — 明顯暗示 */}
          <div className="text-center space-y-6">
            <p className="text-xs text-fw-gold/50 tracking-[0.5em] uppercase font-mono">Uncensored</p>
            <p className="text-2xl sm:text-3xl font-serif text-white leading-relaxed">
              有些故事，<br />在別的地方不能寫完。
            </p>
            <p className="text-lg text-white/70 font-serif leading-relaxed">
              主角與仇人之間的張力，可以去任何地方。<br />
              師徒之間，可以比武功更複雜。<br />
              酒後的江湖夜晚，不需要在清醒前剪掉。
            </p>
            <p className="text-white/40 text-sm">
              這裡沒有審查員。你的故事，你決定它走到哪裡。
            </p>
          </div>

          {/* 屬性 */}
          <div className="text-center space-y-6">
            <p className="text-xs text-fw-gold/50 tracking-[0.5em] uppercase font-mono">Your Character Matters</p>
            <p className="text-2xl sm:text-3xl font-serif text-white leading-relaxed">
              你的天賦，<br />決定世界如何看你。
            </p>
            <p className="text-lg text-white/70 font-serif leading-relaxed">
              魅力夠高——追你的殺手，忍不住留你一命。<br />
              福緣夠深——隨手翻過一塊石頭，底下是秘笈。<br />
              悟性夠強——旁觀別人打架，就能把招式學走。
            </p>
            <p className="text-white/40 text-sm">
              AI 讀得懂你的數值，而且它真的照著用。
            </p>
          </div>

          {/* CTA */}
          <div className="text-center space-y-8">
            <p className="text-2xl sm:text-3xl font-serif text-white/90 leading-relaxed">
              不是選項遊戲。不是劇情遊戲。<br />
              是你帶著一個角色，走進一個活著的世界。
            </p>
            <Link href="/game"
              className="inline-block px-12 py-5 bg-fw-gold text-black font-bold text-sm tracking-widest rounded hover:bg-fw-gold/90 transition-all shadow-[0_0_40px_rgba(212,175,55,0.3)] hover:shadow-[0_0_60px_rgba(212,175,55,0.5)]">
              從這裡開始
            </Link>
          </div>

        </div>
      </section>

      {/* ── 訂閱方案 ── */}
      <section id="pricing" className="py-24 px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs text-fw-gold/60 tracking-[0.5em] uppercase font-mono mb-3">Pricing</p>
            <h2 className="text-3xl font-serif text-white mb-4">選擇你的方案</h2>
            <div className="flex items-center justify-center gap-2">
              <p className="text-sm text-white/40">所有方案可跨世界使用・回合不限使用哪個世界</p>
              {rate && (
                <span className="text-xs text-white/25 font-mono">
                  （匯率 1 USD = {rate.toFixed(1)} TWD）
                </span>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <PlanCard
              name="月費"
              usdPrice={8}
              period="/ 月"
              rate={rate}
              features={[
                '每日 60 回合',
                '跨所有開放世界',
                '雲端存檔同步',
                '可隨時取消',
              ]}
            />
            <PlanCard
              name="年費"
              usdPrice={72}
              period="/ 年"
              usdOriginal={96}
              badge="省 25%"
              note="相當於每月 US$6，節省 2 個月費用"
              rate={rate}
              features={[
                '每日 60 回合',
                '跨所有開放世界',
                '雲端存檔同步',
                '年費專屬頭銜',
              ]}
              highlight={true}
            />
            <PlanCard
              name="即時補充"
              usdPrice={4.99}
              period="/ 次"
              rate={rate}
              features={[
                '補充 300 回合',
                '永久有效，不過期',
                '適合非定期玩家',
                '無需訂閱',
              ]}
            />
          </div>

          <div className="mt-8 p-5 rounded-lg border border-white/10 bg-white/3 text-center">
            <p className="text-sm text-white/50">
              <Sparkles className="w-3 h-3 inline mr-2 text-fw-gold/60" />
              目前正式上線前為免費體驗期，訂閱系統即將開放
            </p>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/10 py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-10">
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-3">
                <Globe className="w-5 h-5 text-fw-gold" />
                <span className="font-serif text-fw-gold tracking-widest">自由世界</span>
                <span className="text-white/30 text-xs font-mono">Freedom World</span>
              </div>
              <p className="text-xs text-white/30 leading-relaxed max-w-xs">
                你的每一個抉擇，都將永久改變世界的走向。
              </p>
            </div>

            <div className="flex flex-col gap-4 text-center md:text-right">
              <p className="text-xs text-white/30 tracking-widest uppercase font-mono mb-1">Contact</p>
              <a href="mailto:iatinleong@gmail.com"
                className="flex items-center justify-center md:justify-end gap-3 text-sm text-white/60 hover:text-fw-gold transition-colors group">
                <Mail className="w-4 h-4 text-fw-gold/50 group-hover:text-fw-gold" />
                iatinleong@gmail.com
              </a>
              <a href="tel:0921637738"
                className="flex items-center justify-center md:justify-end gap-3 text-sm text-white/60 hover:text-fw-gold transition-colors group">
                <Phone className="w-4 h-4 text-fw-gold/50 group-hover:text-fw-gold" />
                0921-637-738
              </a>
            </div>
          </div>

          <div className="mt-12 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-white/20">© 2026 自由世界 Freedom World. All rights reserved.</p>
            <Link href="/game" className="text-xs text-fw-gold/50 hover:text-fw-gold transition-colors tracking-widest">
              進入遊戲 →
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
