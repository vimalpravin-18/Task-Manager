import React, { useEffect, useRef, useState } from 'react';

/* ─────────────────────────────────────────────
   Confetti particle config
───────────────────────────────────────────── */
const COLORS = [
  '#f59e0b', '#fbbf24', '#34d399', '#6ee7b7',
  '#818cf8', '#c084fc', '#f472b6', '#38bdf8',
  '#fb923c', '#a3e635',
];

function randomBetween(a, b) {
  return a + Math.random() * (b - a);
}

function createParticle(canvasW, canvasH) {
  const type = Math.random() < 0.6 ? 'rect' : Math.random() < 0.5 ? 'circle' : 'star';
  return {
    x: randomBetween(0, canvasW),
    y: randomBetween(-canvasH * 0.4, -10),
    vx: randomBetween(-2.5, 2.5),
    vy: randomBetween(2.5, 6),
    rotation: randomBetween(0, Math.PI * 2),
    rotationSpeed: randomBetween(-0.08, 0.08),
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    size: randomBetween(6, 14),
    opacity: 1,
    type,
    wobble: randomBetween(0, Math.PI * 2),
    wobbleSpeed: randomBetween(0.03, 0.09),
    gravity: randomBetween(0.06, 0.14),
  };
}

function drawStar(ctx, cx, cy, r, points = 5) {
  const step = Math.PI / points;
  ctx.beginPath();
  for (let i = 0; i < 2 * points; i++) {
    const angle = i * step - Math.PI / 2;
    const radius = i % 2 === 0 ? r : r * 0.42;
    ctx.lineTo(cx + radius * Math.cos(angle), cy + radius * Math.sin(angle));
  }
  ctx.closePath();
}

/* ─────────────────────────────────────────────
   Confetti Canvas
───────────────────────────────────────────── */
function ConfettiCanvas({ active }) {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const rafRef = useRef(null);
  const frameRef = useRef(0);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Spawn burst
    const burst = () => {
      const { width, height } = canvas;
      for (let i = 0; i < 180; i++) {
        particlesRef.current.push(createParticle(width, height));
      }
    };
    burst();
    // Second wave at 600ms
    const t2 = setTimeout(burst, 600);
    // Third small wave at 1200ms
    const t3 = setTimeout(() => {
      const { width, height } = canvas;
      for (let i = 0; i < 80; i++) {
        particlesRef.current.push(createParticle(width, height));
      }
    }, 1200);

    const animate = () => {
      frameRef.current++;
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      particlesRef.current = particlesRef.current.filter(p => p.opacity > 0.01 && p.y < height + 60);

      for (const p of particlesRef.current) {
        p.wobble += p.wobbleSpeed;
        p.x += p.vx + Math.sin(p.wobble) * 1.2;
        p.y += p.vy;
        p.vy += p.gravity;
        p.rotation += p.rotationSpeed;
        if (p.y > height * 0.7) p.opacity -= 0.012;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 4;

        if (p.type === 'rect') {
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        } else if (p.type === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          drawStar(ctx, 0, 0, p.size / 2);
          ctx.fill();
        }
        ctx.restore();
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafRef.current);
      clearTimeout(t2);
      clearTimeout(t3);
      window.removeEventListener('resize', resize);
      particlesRef.current = [];
    };
  }, [active]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed', inset: 0, width: '100%', height: '100%',
        pointerEvents: 'none', zIndex: 9999,
      }}
    />
  );
}

/* ─────────────────────────────────────────────
   Trophy Icon (animated SVG)
───────────────────────────────────────────── */
function TrophyIcon({ color = '#f59e0b' }) {
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
      <defs>
        <radialGradient id="trophyGold" cx="50%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#fde68a" />
          <stop offset="50%" stopColor={color} />
          <stop offset="100%" stopColor="#b45309" />
        </radialGradient>
        <filter id="trophyGlow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      {/* Cup body */}
      <path
        d="M20 10h32v20c0 11-7 18-16 20s-16-9-16-20V10z"
        fill="url(#trophyGold)" filter="url(#trophyGlow)"
      />
      {/* Handles */}
      <path d="M20 14H10a8 8 0 008 14h2" stroke={color} strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M52 14h10a8 8 0 01-8 14h-2" stroke={color} strokeWidth="2.5" strokeLinecap="round" fill="none" />
      {/* Stem */}
      <rect x="30" y="50" width="12" height="8" rx="2" fill="url(#trophyGold)" />
      {/* Base */}
      <rect x="22" y="58" width="28" height="5" rx="2.5" fill="url(#trophyGold)" />
      {/* Star on cup */}
      <path
        d="M36 18l1.8 5.5h5.8l-4.7 3.4 1.8 5.5L36 29l-4.7 3.4 1.8-5.5-4.7-3.4h5.8z"
        fill="white" opacity="0.85"
      />
    </svg>
  );
}

function FireIcon() {
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
      <defs>
        <radialGradient id="fireGrad" cx="50%" cy="80%" r="80%">
          <stop offset="0%" stopColor="#fde68a" />
          <stop offset="40%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#dc2626" />
        </radialGradient>
      </defs>
      <path
        d="M36 8C36 8 48 20 48 32c0 4-1.5 7-4 9 1-3 0-6-2-8-1 5-4 8-8 10 2-4 1-9-2-12-2 4-4 10-2 16-4-3-6-8-6-14 0-8 4-14 4-14s-6 6-6 16c0 8 6 15 14 15s14-7 14-15c0-14-14-25-14-35z"
        fill="url(#fireGrad)"
      />
      <ellipse cx="36" cy="58" rx="6" ry="3" fill="#fde68a" opacity="0.6" />
    </svg>
  );
}

/* ─────────────────────────────────────────────
   Main Overlay Component
───────────────────────────────────────────── */
export default function CelebrationOverlay({ type, onDismiss }) {
  const [phase, setPhase] = useState('enter'); // 'enter' | 'visible' | 'exit'
  const [ringPulse, setRingPulse] = useState(0);

  const isDaily = type === 'daily';
  const accentColor = isDaily ? '#f59e0b' : '#818cf8';
  const accentColorAlt = isDaily ? '#fbbf24' : '#c084fc';
  const glowColor = isDaily ? 'rgba(245,158,11,0.35)' : 'rgba(129,140,248,0.35)';
  const title = isDaily ? 'Daily Goal Crushed! 🎯' : 'Weekly Goal Complete! 🏆';
  const subtitle = isDaily
    ? "You've smashed today's target. Keep the momentum going!"
    : "Incredible week! You've hit your weekly productivity goal.";
  const badgeLabel = isDaily ? "Today's Champion" : 'Week Warrior';

  // Animate rings
  useEffect(() => {
    const interval = setInterval(() => setRingPulse(p => p + 1), 1200);
    return () => clearInterval(interval);
  }, []);

  // Entrance
  useEffect(() => {
    const t = setTimeout(() => setPhase('visible'), 30);
    return () => clearTimeout(t);
  }, []);

  // Auto-dismiss after 6 s
  useEffect(() => {
    const t = setTimeout(() => handleClose(), 6000);
    return () => clearTimeout(t);
  }, []);

  const handleClose = () => {
    setPhase('exit');
    setTimeout(onDismiss, 420);
  };

  const enterStyle = phase === 'visible'
    ? { opacity: 1, transform: 'scale(1) translateY(0)' }
    : phase === 'exit'
    ? { opacity: 0, transform: 'scale(0.88) translateY(24px)' }
    : { opacity: 0, transform: 'scale(0.82) translateY(32px)' };

  return (
    <>
      {/* Confetti */}
      <ConfettiCanvas active={phase !== 'exit'} />

      {/* Backdrop */}
      <div
        onClick={handleClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 10000,
          background: 'rgba(5, 8, 20, 0.72)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'opacity 0.4s ease',
          opacity: phase === 'exit' ? 0 : 1,
        }}
      >
        {/* Card */}
        <div
          onClick={e => e.stopPropagation()}
          style={{
            position: 'relative',
            background: 'linear-gradient(145deg, rgba(15,20,40,0.98) 0%, rgba(22,28,56,0.98) 100%)',
            border: `1.5px solid ${accentColor}44`,
            borderRadius: '28px',
            padding: '48px 44px 40px',
            maxWidth: '420px',
            width: '90vw',
            textAlign: 'center',
            boxShadow: `0 0 0 1px ${accentColor}22, 0 40px 100px rgba(0,0,0,0.7), 0 0 60px ${glowColor}`,
            transition: 'opacity 0.42s cubic-bezier(0.34,1.56,0.64,1), transform 0.42s cubic-bezier(0.34,1.56,0.64,1)',
            ...enterStyle,
          }}
        >
          {/* Decorative corner glows */}
          <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: `radial-gradient(circle, ${accentColor}30 0%, transparent 70%)`, pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -40, left: -40, width: 140, height: 140, borderRadius: '50%', background: `radial-gradient(circle, ${accentColorAlt}25 0%, transparent 70%)`, pointerEvents: 'none' }} />

          {/* Animated pulse rings behind icon */}
          <div style={{ position: 'relative', width: 140, height: 140, margin: '0 auto 24px' }}>
            {[1, 2, 3].map(i => (
              <div
                key={`${ringPulse}-${i}`}
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '50%',
                  border: `2px solid ${accentColor}`,
                  animation: `celebRing ${1.2 + i * 0.4}s ease-out ${i * 0.18}s forwards`,
                  opacity: 0,
                }}
              />
            ))}
            {/* Icon circle */}
            <div style={{
              position: 'absolute', inset: 0,
              borderRadius: '50%',
              background: `radial-gradient(circle at 40% 35%, ${accentColorAlt}30, ${accentColor}18, transparent 70%)`,
              border: `2px solid ${accentColor}55`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 0 40px ${glowColor}, 0 0 80px ${accentColor}18`,
              animation: 'celebIconFloat 3s ease-in-out infinite',
            }}>
              {isDaily ? <TrophyIcon color={accentColor} /> : <FireIcon />}
            </div>
          </div>

          {/* Badge pill */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '4px 14px',
            borderRadius: '100px',
            background: `${accentColor}20`,
            border: `1px solid ${accentColor}45`,
            color: accentColor,
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            marginBottom: 14,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: accentColor, display: 'inline-block', boxShadow: `0 0 6px ${accentColor}` }} />
            {badgeLabel}
          </div>

          {/* Title */}
          <h2 style={{
            fontSize: 26,
            fontWeight: 900,
            color: '#f1f5f9',
            margin: '0 0 10px',
            letterSpacing: '-0.02em',
            lineHeight: 1.2,
            textShadow: `0 0 30px ${accentColor}60`,
          }}>
            {title}
          </h2>

          {/* Subtitle */}
          <p style={{
            fontSize: 14,
            color: 'rgba(148,163,184,0.85)',
            margin: '0 0 32px',
            lineHeight: 1.6,
            fontWeight: 500,
          }}>
            {subtitle}
          </p>

          {/* Shimmer separator */}
          <div style={{
            width: '100%',
            height: 1,
            background: `linear-gradient(to right, transparent, ${accentColor}60, transparent)`,
            marginBottom: 28,
          }} />

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={handleClose}
              style={{
                flex: 1,
                padding: '12px 0',
                borderRadius: '14px',
                border: `1px solid ${accentColor}40`,
                background: 'transparent',
                color: 'rgba(148,163,184,0.8)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(148,163,184,0.08)'; e.currentTarget.style.color = '#e2e8f0'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(148,163,184,0.8)'; }}
            >
              Dismiss
            </button>
            <button
              onClick={handleClose}
              style={{
                flex: 1,
                padding: '12px 0',
                borderRadius: '14px',
                border: 'none',
                background: `linear-gradient(135deg, ${accentColor}, ${accentColorAlt})`,
                color: '#0f1428',
                fontSize: 13,
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: `0 4px 20px ${accentColor}50`,
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = `0 8px 28px ${accentColor}65`; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `0 4px 20px ${accentColor}50`; }}
            >
              Keep Going! 🚀
            </button>
          </div>

          {/* Auto-dismiss hint */}
          <p style={{ marginTop: 16, fontSize: 11, color: 'rgba(100,116,139,0.7)', fontWeight: 500 }}>
            Auto-closes in a few seconds · click outside to dismiss
          </p>
        </div>
      </div>

      {/* Keyframe styles injected */}
      <style>{`
        @keyframes celebRing {
          0%   { transform: scale(0.6); opacity: 0.9; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        @keyframes celebIconFloat {
          0%, 100% { transform: translateY(0px) scale(1); }
          50%       { transform: translateY(-8px) scale(1.04); }
        }
      `}</style>
    </>
  );
}
