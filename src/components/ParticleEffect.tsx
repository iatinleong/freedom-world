'use client';

import { useEffect, useRef } from 'react';

interface Particle {
    x: number;
    y: number;
    size: number;
    speedX: number;
    speedY: number;
    opacity: number;
    life: number;
}

export function ParticleEffect() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas size
        const updateCanvasSize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        updateCanvasSize();
        window.addEventListener('resize', updateCanvasSize);

        const particles: Particle[] = [];
        const particleCount = 30;

        // Initialize particles
        for (let i = 0; i < particleCount; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: Math.random() * 2 + 0.5,
                speedX: (Math.random() - 0.5) * 0.3,
                speedY: Math.random() * 0.5 + 0.2,
                opacity: Math.random() * 0.3 + 0.1,
                life: Math.random() * 100,
            });
        }

        let animationFrameId: number;

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            particles.forEach((particle) => {
                // Update position
                particle.x += particle.speedX;
                particle.y -= particle.speedY;
                particle.life += 0.5;

                // Fade effect
                const fadeOpacity = Math.sin(particle.life * 0.05) * 0.5 + 0.5;

                // Reset particle if it goes off screen
                if (particle.y < -10) {
                    particle.y = canvas.height + 10;
                    particle.x = Math.random() * canvas.width;
                }
                if (particle.x < -10 || particle.x > canvas.width + 10) {
                    particle.x = Math.random() * canvas.width;
                }

                // Draw particle
                ctx.save();
                ctx.globalAlpha = particle.opacity * fadeOpacity * 0.3;
                ctx.fillStyle = '#d4af37'; // Gold color
                ctx.shadowBlur = 4;
                ctx.shadowColor = '#d4af37';

                // Draw as a small diamond shape
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                ctx.fill();

                // Draw connecting lines occasionally
                if (Math.random() > 0.98) {
                    ctx.globalAlpha = 0.05;
                    ctx.strokeStyle = '#d4af37';
                    ctx.lineWidth = 0.5;
                    ctx.beginPath();
                    ctx.moveTo(particle.x, particle.y);
                    const nearbyParticle = particles[Math.floor(Math.random() * particles.length)];
                    const distance = Math.sqrt(
                        Math.pow(particle.x - nearbyParticle.x, 2) +
                        Math.pow(particle.y - nearbyParticle.y, 2)
                    );
                    if (distance < 100) {
                        ctx.lineTo(nearbyParticle.x, nearbyParticle.y);
                        ctx.stroke();
                    }
                }

                ctx.restore();
            });

            animationFrameId = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener('resize', updateCanvasSize);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-0"
            style={{ opacity: 0.4 }}
        />
    );
}
