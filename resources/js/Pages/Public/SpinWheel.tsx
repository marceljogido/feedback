import { Head } from '@inertiajs/react';
import { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';

interface Prize {
    id: number;
    name: string;
    name_en: string | null;
    image: string | null;
    color: string;
    probability: number;
}

interface Props {
    event: {
        title: string;
        logo_image: string | null;
    };
    form: {
        slug: string;
        spin_wheel_title: string;
        spin_wheel_btn_text: string;
        spin_wheel_btn_color: string;
        spin_wheel_pointer_color: string;
        spin_wheel_sound_spin: string | null;
        spin_wheel_sound_bgm: string | null;
        spin_wheel_sound_win: string | null;
        spin_wheel_sound_bgm_enabled: boolean;
        spin_wheel_sound_spin_enabled: boolean;
        spin_wheel_sound_win_enabled: boolean;
        spin_wheel_result_message: string | null;
    };
    prizes: Prize[];
    respondent_id: number;
    token: string;
}

// Default sounds using Web Audio API
function createTickSound(audioCtx: AudioContext) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.frequency.value = 800;
    gain.gain.value = 0.15;
    osc.start();
    osc.stop(audioCtx.currentTime + 0.03);
}

function createFanfareSound(audioCtx: AudioContext) {
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.value = freq;
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime + i * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + i * 0.15 + 0.4);
        osc.start(audioCtx.currentTime + i * 0.15);
        osc.stop(audioCtx.currentTime + i * 0.15 + 0.4);
    });
}

// Fade out an audio element over durationMs
function fadeOutAudio(audio: HTMLAudioElement, durationMs: number = 500) {
    const startVol = audio.volume;
    const steps = 20;
    const stepTime = durationMs / steps;
    const volStep = startVol / steps;
    let currentStep = 0;
    const interval = setInterval(() => {
        currentStep++;
        audio.volume = Math.max(0, startVol - volStep * currentStep);
        if (currentStep >= steps) {
            clearInterval(interval);
            audio.pause();
            audio.volume = startVol; // Reset for next play
        }
    }, stepTime);
    return interval;
}

export default function SpinWheel({ event, form, prizes, respondent_id, token }: Props) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const bgmRef = useRef<HTMLAudioElement | null>(null);
    const spinSoundRef = useRef<HTMLAudioElement | null>(null);
    const winSoundRef = useRef<HTMLAudioElement | null>(null);
    const bgmFadeRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const [rotation, setRotation] = useState(0);
    const [spinning, setSpinning] = useState(false);
    const [wonPrize, setWonPrize] = useState<Prize | null>(null);
    const [resultMessage, setResultMessage] = useState('');
    const [showPopup, setShowPopup] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [phoneError, setPhoneError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');
    const [bgmStarted, setBgmStarted] = useState(false);

    const totalSlices = prizes.length;
    const sliceAngle = (2 * Math.PI) / totalSlices;

    // Preload custom sounds
    useEffect(() => {
        if (form.spin_wheel_sound_bgm && form.spin_wheel_sound_bgm_enabled) {
            bgmRef.current = new Audio(form.spin_wheel_sound_bgm);
            bgmRef.current.loop = true;
            bgmRef.current.volume = 0.3;
        }
        if (form.spin_wheel_sound_spin && form.spin_wheel_sound_spin_enabled) {
            spinSoundRef.current = new Audio(form.spin_wheel_sound_spin);
            spinSoundRef.current.loop = true;
        }
        if (form.spin_wheel_sound_win && form.spin_wheel_sound_win_enabled) {
            winSoundRef.current = new Audio(form.spin_wheel_sound_win);
        }

        return () => {
            // Cleanup on unmount
            if (bgmFadeRef.current) clearInterval(bgmFadeRef.current);
            bgmRef.current?.pause();
            spinSoundRef.current?.pause();
            winSoundRef.current?.pause();
        };
    }, [form]);

    // Draw the wheel
    const drawWheel = useCallback((currentRotation: number) => {
        const canvas = canvasRef.current;
        if (!canvas || totalSlices === 0) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const size = canvas.width;
        const center = size / 2;
        const radius = center - 16;

        ctx.clearRect(0, 0, size, size);

        // Shadow
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.2)';
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(center, center, radius + 4, 0, 2 * Math.PI);
        ctx.fillStyle = '#222';
        ctx.fill();
        ctx.restore();

        // Draw slices
        let startAngle = currentRotation - Math.PI / 2;
        prizes.forEach((prize, i) => {
            const endAngle = startAngle + sliceAngle;

            // Slice fill
            ctx.beginPath();
            ctx.moveTo(center, center);
            ctx.arc(center, center, radius, startAngle, endAngle);
            ctx.closePath();
            ctx.fillStyle = prize.color;
            ctx.fill();

            // Slice border
            ctx.strokeStyle = 'rgba(255,255,255,0.4)';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Text
            ctx.save();
            ctx.translate(center, center);
            ctx.rotate(startAngle + sliceAngle / 2);
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 14px "Inter", sans-serif';
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            ctx.shadowColor = 'rgba(0,0,0,0.5)';
            ctx.shadowBlur = 3;
            const label = prize.name;
            ctx.fillText(label.length > 14 ? label.substring(0, 14) + '…' : label, radius - 18, 0);
            ctx.restore();

            startAngle = endAngle;
        });

        // Outer ring
        ctx.beginPath();
        ctx.arc(center, center, radius + 3, 0, 2 * Math.PI);
        ctx.strokeStyle = 'rgba(255,255,255,0.6)';
        ctx.lineWidth = 5;
        ctx.stroke();

        // Center button
        const btnRadius = Math.min(40, radius * 0.2);
        ctx.beginPath();
        ctx.arc(center, center, btnRadius, 0, 2 * Math.PI);
        const gradient = ctx.createRadialGradient(center - 5, center - 5, 0, center, center, btnRadius);
        gradient.addColorStop(0, lightenColor(form.spin_wheel_btn_color, 30));
        gradient.addColorStop(1, form.spin_wheel_btn_color);
        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Button text
        ctx.fillStyle = '#fff';
        ctx.font = `bold ${Math.max(10, btnRadius * 0.4)}px "Inter", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(0,0,0,0.3)';
        ctx.shadowBlur = 2;
        const btnLabel = form.spin_wheel_btn_text;
        ctx.fillText(btnLabel.length > 8 ? btnLabel.substring(0, 8) : btnLabel, center, center);
        ctx.shadowBlur = 0;

        // Pointer (triangle at top)
        const pointerSize = 18;
        ctx.beginPath();
        ctx.moveTo(center - pointerSize, 8);
        ctx.lineTo(center + pointerSize, 8);
        ctx.lineTo(center, 8 + pointerSize + 8);
        ctx.closePath();
        ctx.fillStyle = form.spin_wheel_pointer_color;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
    }, [prizes, totalSlices, sliceAngle, form]);

    useEffect(() => {
        drawWheel(rotation);
    }, [rotation, drawWheel]);

    function lightenColor(hex: string, percent: number) {
        const num = parseInt(hex.replace('#', ''), 16);
        const r = Math.min(255, (num >> 16) + Math.round(255 * percent / 100));
        const g = Math.min(255, ((num >> 8) & 0x00FF) + Math.round(255 * percent / 100));
        const b = Math.min(255, (num & 0x0000FF) + Math.round(255 * percent / 100));
        return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)}`;
    }

    // Spin the wheel
    const handleSpin = async () => {
        if (spinning || submitted) return;
        setSpinning(true);
        setError('');

        // Init audio context on user gesture
        if (!audioCtxRef.current) {
            audioCtxRef.current = new AudioContext();
        }

        // Start BGM on first interaction if not started yet
        if (!bgmStarted && bgmRef.current) {
            bgmRef.current.play().catch(() => { });
            setBgmStarted(true);
        }

        // === SOUND FLOW: BGM fade out → Spin start (simultaneously) ===
        if (bgmRef.current && !bgmRef.current.paused) {
            if (bgmFadeRef.current) clearInterval(bgmFadeRef.current);
            bgmFadeRef.current = fadeOutAudio(bgmRef.current, 500);
        }

        // Start spin sound IMMEDIATELY with the wheel — no delay
        if (spinSoundRef.current) {
            spinSoundRef.current.currentTime = 0;
            spinSoundRef.current.playbackRate = 1.5;
            spinSoundRef.current.play().catch(() => { });
        }

        try {
            // Determine which prize to show (frontend random for animation only)
            const totalProb = prizes.reduce((s, p) => s + p.probability, 0);
            let random = Math.random() * totalProb;
            let cumulative = 0;
            let targetIndex = 0;
            for (let i = 0; i < prizes.length; i++) {
                cumulative += prizes[i].probability;
                if (random <= cumulative) {
                    targetIndex = i;
                    break;
                }
            }

            // Calculate target rotation
            const targetAngle = -(targetIndex * sliceAngle + sliceAngle / 2);
            const spins = 5 + Math.random() * 3; // 5-8 full rotations
            const totalRotation = spins * Math.PI * 2 + targetAngle - rotation;

            // Animate
            const duration = 4000 + Math.random() * 1000; // 4-5 seconds
            const startTime = Date.now();
            const startRotation = rotation;
            let lastSlice = -1;

            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);

                // Ease out cubic: eased = 1 - (1-t)^3
                const eased = 1 - Math.pow(1 - progress, 3);
                const currentRotation = startRotation + totalRotation * eased;
                setRotation(currentRotation);

                // === SPIN SOUND: playbackRate follows wheel speed ===
                // Derivative of ease-out cubic = 3*(1-t)^2
                // Map from [0..3] to [0.25..1.5] so sound slows down with the wheel
                if (spinSoundRef.current && !spinSoundRef.current.paused) {
                    const derivative = 3 * Math.pow(1 - progress, 2); // 3→0
                    const rate = 0.25 + (derivative / 3) * 1.25; // maps to 0.25→1.5
                    spinSoundRef.current.playbackRate = Math.max(0.25, rate);
                }

                // Tick sound at slice boundaries (fallback when no custom spin sound)
                if (!spinSoundRef.current && form.spin_wheel_sound_spin_enabled) {
                    const normalizedAngle = ((currentRotation % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
                    const currentSlice = Math.floor(normalizedAngle / sliceAngle) % totalSlices;
                    if (currentSlice !== lastSlice) {
                        if (audioCtxRef.current) createTickSound(audioCtxRef.current);
                        lastSlice = currentSlice;
                    }
                }

                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    // === Wheel stopped → Stop spin sound immediately ===
                    if (spinSoundRef.current) {
                        spinSoundRef.current.pause();
                        spinSoundRef.current.currentTime = 0;
                    }

                    // Winner sound after short pause (300ms — just enough to feel the "stop")
                    setTimeout(() => {
                        if (winSoundRef.current) {
                            winSoundRef.current.currentTime = 0;
                            winSoundRef.current.play().catch(() => { });
                        } else if (form.spin_wheel_sound_win_enabled && audioCtxRef.current) {
                            createFanfareSound(audioCtxRef.current);
                        }

                        setWonPrize(prizes[targetIndex]);
                        setShowPopup(true);
                    }, 300);
                }
            };

            requestAnimationFrame(animate);
        } catch (err) {
            setSpinning(false);
            setError('Terjadi kesalahan. Silakan coba lagi.');
        }
    };

    // Submit phone and confirm win on backend
    const handleSubmitPhone = async () => {
        if (!phoneNumber || phoneNumber.length < 8) {
            setPhoneError('Masukkan nomor HP yang valid (min. 8 digit).');
            return;
        }
        setPhoneError('');
        setSubmitting(true);

        try {
            const res = await axios.post(route('form.spin', form.slug), {
                respondent_id: respondent_id,
                phone_number: phoneNumber,
            });

            if (res.data.success) {
                setResultMessage(res.data.result_message);
                setSubmitted(true);
                // Redirect to thank you after 2 sec
                setTimeout(() => {
                    window.location.href = route('form.thankyou', form.slug);
                }, 2500);
            }
        } catch (err: any) {
            const errorMsg = err.response?.data?.error || 'Terjadi kesalahan. Silakan coba lagi.';
            setPhoneError(errorMsg);
        } finally {
            setSubmitting(false);
        }
    };

    const canvasSize = Math.min(typeof window !== 'undefined' ? window.innerWidth - 48 : 360, 400);

    return (
        <>
            <Head title={form.spin_wheel_title || 'Spin Wheel'} />

            <div className="min-h-screen bg-gradient-to-br from-[#11224e] to-[#5c83c4] flex flex-col items-center justify-center p-4 relative overflow-hidden">
                {/* Background decorations */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full bg-white/5 animate-pulse" />
                    <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-white/5 animate-pulse" style={{ animationDelay: '1s' }} />
                    <div className="absolute top-1/4 right-10 w-32 h-32 rounded-full bg-white/3 animate-pulse" style={{ animationDelay: '0.5s' }} />
                </div>

                {/* Logo */}
                {event.logo_image && (
                    <img src={event.logo_image} alt={event.title} className="h-12 mb-4 object-contain relative z-10" />
                )}

                {/* Title */}
                <h1 className="text-2xl md:text-3xl font-bold text-white text-center mb-6 relative z-10">
                    {form.spin_wheel_title || 'Putar & Dapatkan Hadiah!'}
                </h1>

                {/* Wheel */}
                <div className="relative z-10 mb-6">
                    <canvas
                        ref={canvasRef}
                        width={canvasSize}
                        height={canvasSize}
                        onClick={!spinning && !submitted ? handleSpin : undefined}
                        className={`cursor-pointer ${spinning ? 'cursor-wait' : ''}`}
                    />
                </div>

                {/* Spin button (below wheel) */}
                {!spinning && !submitted && (
                    <button
                        onClick={handleSpin}
                        className="relative z-10 px-8 py-3 rounded-full text-white font-bold text-lg shadow-lg transform hover:scale-105 transition-all duration-200 animate-bounce"
                        style={{ backgroundColor: form.spin_wheel_btn_color }}
                    >
                        🎡 {form.spin_wheel_btn_text || 'PUTAR!'}
                    </button>
                )}

                {spinning && !showPopup && (
                    <p className="text-white/80 text-lg animate-pulse relative z-10">🎡 Memutar roda...</p>
                )}

                {error && (
                    <p className="text-red-300 text-sm bg-red-900/30 px-4 py-2 rounded-lg relative z-10">{error}</p>
                )}

                {/* === UNCLOSEABLE POPUP === */}
                {showPopup && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-center animate-in zoom-in-95 duration-300">
                            {!submitted ? (
                                <>
                                    <div className="text-5xl mb-3">🎉</div>
                                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Selamat!</h2>
                                    <p className="text-gray-600 mb-4">Anda mendapatkan:</p>

                                    <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-200 rounded-xl p-4 mb-4">
                                        {wonPrize?.image && (
                                            <img src={wonPrize.image} alt={wonPrize.name} className="w-24 h-24 object-contain mx-auto mb-3" />
                                        )}
                                        <p className="text-xl font-bold text-amber-800">{wonPrize?.name}</p>
                                    </div>

                                    <p className="text-sm text-gray-500 mb-3">
                                        📱 Masukkan nomor HP Anda agar tim kami dapat menghubungi Anda untuk proses klaim hadiah.
                                    </p>

                                    <input
                                        type="tel"
                                        placeholder="Contoh: 081234567890"
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9+]/g, ''))}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-center text-lg font-medium focus:border-blue-500 focus:outline-none mb-2"
                                        autoFocus
                                    />

                                    {phoneError && (
                                        <p className="text-sm text-red-500 mb-2">{phoneError}</p>
                                    )}

                                    <button
                                        onClick={handleSubmitPhone}
                                        disabled={submitting || !phoneNumber}
                                        className="w-full py-3 rounded-xl text-white font-bold text-lg transition-all duration-200 disabled:opacity-50"
                                        style={{ backgroundColor: form.spin_wheel_btn_color }}
                                    >
                                        {submitting ? '⏳ Mengirim...' : '📤 Kirim'}
                                    </button>
                                </>
                            ) : (
                                <>
                                    <div className="text-5xl mb-3">✅</div>
                                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Terima Kasih!</h2>
                                    <p className="text-gray-600 mb-4">
                                        {resultMessage || form.spin_wheel_result_message || 'Tim kami akan menghubungi Anda untuk proses klaim hadiah.'}
                                    </p>
                                    <p className="text-sm text-gray-400">Mengalihkan...</p>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
