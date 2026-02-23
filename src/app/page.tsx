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
            <a href="#pricing"
              className="px-10 py-4 border border-white/20 text-white/70 text-sm tracking-widest rounded hover:border-fw-gold/50 hover:text-white transition-all">
              查看方案
            </a>
          </div>
        </div>

        <a href="#features" className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/30 hover:text-white/60 transition-colors">
          <span className="text-[10px] tracking-widest">SCROLL</span>
          <ChevronDown className="w-4 h-4 animate-bounce" />
        </a>
      </section>

      {/* ── 核心亮點 ── */}
      <section id="features" className="border-t border-white/5">

        {/* 亮點一：輸入玩法 */}
        <div className="py-24 px-6 border-b border-white/5">
          <div className="max-w-3xl mx-auto">
            <p className="text-xs text-fw-gold/50 tracking-[0.5em] uppercase font-mono mb-4">核心亮點一</p>
            <h2 className="text-2xl sm:text-3xl font-serif text-white mb-2">⌨️ 一個輸入框，就是你的全世界</h2>
            <p className="text-white/50 mb-8 leading-relaxed">
              還在玩「選項 A、B、C」的傳統遊戲嗎？在《自由江湖》中，對話框是你唯一的武器。
            </p>
            <div className="mb-8">
              <p className="text-fw-gold/80 font-serif mb-4">你寫得出，它就演得活：</p>
              <ul className="space-y-4">
                {[
                  '想「在酒館酒後亂性，強擄客官」？可以。',
                  '想「趁師父閉關時，偷偷在丹藥裡下毒」？隨你。',
                  '想「在比武擂台上脫衣嘲諷對手」？沒人擋得住。',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-white/70 leading-relaxed">
                    <span className="text-fw-gold/40 mt-1 shrink-0">▸</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="border-l-2 border-fw-gold/30 pl-5">
              <p className="text-fw-gold/70 font-serif mb-1">拒絕套路</p>
              <p className="text-white/50 leading-relaxed text-sm">這裡沒有標準答案。你的每一次奇思妙想，都會引發不可逆轉的江湖巨變。</p>
            </div>
          </div>
        </div>

        {/* 亮點二：18+ */}
        <div className="py-24 px-6 border-b border-white/5 bg-white/[0.02]">
          <div className="max-w-3xl mx-auto">
            <p className="text-xs text-fw-gold/50 tracking-[0.5em] uppercase font-mono mb-4">核心亮點二</p>
            <h2 className="text-2xl sm:text-3xl font-serif text-white mb-2">🔞 剝去濾鏡，看見最真實的人性</h2>
            <p className="text-white/50 mb-8 leading-relaxed">
              江湖不僅有刀光劍影，還有慾望、背叛與禁忌的煙火。
            </p>
            <div className="space-y-6">
              <div className="border-l-2 border-fw-gold/30 pl-5">
                <p className="text-fw-gold/70 font-serif mb-1">無碼的成人互動</p>
                <p className="text-white/50 leading-relaxed text-sm">憑藉強大的敘事引擎，你可以與 NPC 發展出超乎想像的親密關係，或在黑暗的暗巷中執行最殘酷的惡行。</p>
              </div>
              <div className="border-l-2 border-fw-gold/30 pl-5">
                <p className="text-fw-gold/70 font-serif mb-1">善惡由你</p>
                <p className="text-white/50 leading-relaxed text-sm">你可以成為受萬人景仰的俠義之士，也可以成為一個沉溺於權力與美色的混世魔王。在這個世界，我們不審查你的靈魂，只呈現你的選擇。</p>
              </div>
            </div>
          </div>
        </div>

        {/* 亮點三：活世界 */}
        <div className="py-24 px-6 border-b border-white/5">
          <div className="max-w-3xl mx-auto">
            <p className="text-xs text-fw-gold/50 tracking-[0.5em] uppercase font-mono mb-4">核心亮點三</p>
            <h2 className="text-2xl sm:text-3xl font-serif text-white mb-2">🧠 擁有記憶的說書人</h2>
            <p className="text-white/50 mb-8 leading-relaxed">
              這不只是文字堆砌，而是一個動態演進的生態系統。
            </p>
            <ul className="space-y-6">
              {[
                { title: '因果連鎖', desc: '你在新手村殺的一個路人，可能會讓你在十年後的京城遭到全城通緝。' },
                { title: '精準回饋', desc: '每一段描寫都包含感官細節。說書人會根據你的屬性（膂力、身法、悟性）與當前環境，為你親筆撰寫獨一無二的戰鬥與奇遇。' },
                { title: '永不中斷的傳奇', desc: '滾動摘要系統確保了故事的連貫性，你的每一刻成長與墮落，都會被刻在江湖的歷史中。' },
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="text-fw-gold/40 mt-1 shrink-0">▸</span>
                  <div>
                    <p className="text-fw-gold/70 font-serif mb-1">{item.title}</p>
                    <p className="text-white/50 leading-relaxed text-sm">{item.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 亮點四：RPG 深度 */}
        <div className="py-24 px-6 border-b border-white/5 bg-white/[0.02]">
          <div className="max-w-3xl mx-auto">
            <p className="text-xs text-fw-gold/50 tracking-[0.5em] uppercase font-mono mb-4">核心亮點四</p>
            <h2 className="text-2xl sm:text-3xl font-serif text-white mb-2">📊 隱藏在文字下的精密齒輪</h2>
            <p className="text-white/50 mb-8 leading-relaxed">
              別被文字外表騙了，這是一款硬核的數值 RPG。
            </p>
            <ul className="space-y-6">
              {[
                { title: '七大根骨定乾坤', desc: '膂力決定攻防、身法決定閃避、悟性決定學招速度、福緣決定奇遇。' },
                { title: '動態武學體系', desc: '從基礎外功到神功心法，你的修為會精確影響系統對戰鬥結果的判定。' },
                { title: '名望與稱號', desc: '俠義、惡名、威名，你的名號將決定 NPC 對你的態度——是夾道歡迎，還是拔劍相向？' },
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="text-fw-gold/40 mt-1 shrink-0">▸</span>
                  <div>
                    <p className="text-fw-gold/70 font-serif mb-1">{item.title}</p>
                    <p className="text-white/50 leading-relaxed text-sm">{item.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 最終 CTA */}
        <div className="py-24 px-6 text-center">
          <div className="max-w-2xl mx-auto space-y-6">
            <p className="text-xl sm:text-2xl font-serif text-white/80 leading-relaxed">
              「江湖很大，但我只想玩得大。」
            </p>
            <p className="text-white/40 leading-relaxed">
              不要再被預設的結局束縛。現在就踏入《自由江湖》，<br className="hidden sm:block" />
              體驗那種「只要我想，沒什麼不可以」的極致快感。
            </p>
            <div className="pt-4">
              <Link href="/game"
                className="inline-block px-12 py-5 bg-fw-gold text-black font-bold text-sm tracking-widest rounded hover:bg-fw-gold/90 transition-all shadow-[0_0_40px_rgba(212,175,55,0.3)] hover:shadow-[0_0_60px_rgba(212,175,55,0.5)]">
                立即啟程，撰寫你的不歸路
              </Link>
            </div>
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
