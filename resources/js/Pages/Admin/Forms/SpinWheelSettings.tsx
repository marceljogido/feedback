import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router, Link } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { ArrowLeft, Plus, Trash2, Upload } from 'lucide-react';
import { useRef, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

interface Prize {
    id?: number;
    name: string;
    name_en: string | null;
    image: string | null;
    image_path: string | null;
    color: string;
    probability: number;
    stock: number;
    won_count?: number;
    is_active: boolean;
    sort_order: number;
}

interface Form {
    id: number;
    name: string;
    slug: string;
    status: 'draft' | 'active' | 'closed';
    public_url: string;
    spin_wheel_enabled: boolean;
    spin_wheel_title: string | null;
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
    prizes: Prize[];
}

interface Event {
    id: number;
    title: string;
}

interface Props {
    form: Form;
    event: Event;
}

const DEFAULT_COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'];

export default function SpinWheelSettings({ form, event }: Props) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Spin Wheel state
    const [spinEnabled, setSpinEnabled] = useState(form.spin_wheel_enabled ?? false);
    const [spinTitle, setSpinTitle] = useState(form.spin_wheel_title || '');
    const [spinBtnText, setSpinBtnText] = useState(form.spin_wheel_btn_text || 'PUTAR!');
    const [spinBtnColor, setSpinBtnColor] = useState(form.spin_wheel_btn_color || '#f17720');
    const [spinPointerColor, setSpinPointerColor] = useState(form.spin_wheel_pointer_color || '#e74c3c');
    const [spinResultMessage, setSpinResultMessage] = useState(form.spin_wheel_result_message || '');
    const [prizes, setPrizes] = useState<Prize[]>(form.prizes || []);
    const [spinSaving, setSpinSaving] = useState(false);
    const [spinSoundSpin, setSpinSoundSpin] = useState(form.spin_wheel_sound_spin);
    const [spinSoundBgm, setSpinSoundBgm] = useState(form.spin_wheel_sound_bgm);
    const [spinSoundWin, setSpinSoundWin] = useState(form.spin_wheel_sound_win);
    const [bgmEnabled, setBgmEnabled] = useState(form.spin_wheel_sound_bgm_enabled ?? true);
    const [spinSoundEnabled, setSpinSoundEnabled] = useState(form.spin_wheel_sound_spin_enabled ?? true);
    const [winSoundEnabled, setWinSoundEnabled] = useState(form.spin_wheel_sound_win_enabled ?? true);

    // --- Spin Wheel Helpers ---
    const addPrize = () => {
        const colorIndex = prizes.length % DEFAULT_COLORS.length;
        setPrizes([...prizes, {
            name: '',
            name_en: null,
            image: null,
            image_path: null,
            color: DEFAULT_COLORS[colorIndex],
            probability: 0,
            stock: 0,
            is_active: true,
            sort_order: prizes.length,
        }]);
    };

    const removePrize = (index: number) => {
        setPrizes(prizes.filter((_, i) => i !== index));
    };

    const updatePrize = (index: number, field: keyof Prize, value: any) => {
        const updated = [...prizes];
        (updated[index] as any)[field] = value;
        setPrizes(updated);
    };

    const distributeProbability = () => {
        const activePrizes = prizes.filter(p => p.is_active);
        if (activePrizes.length === 0) return;
        const each = parseFloat((100 / activePrizes.length).toFixed(2));
        const updated = prizes.map(p => ({
            ...p,
            probability: p.is_active ? each : 0,
        }));
        // Fix rounding — assign remainder to last active
        const totalAssigned = updated.filter(p => p.is_active).reduce((s, p) => s + p.probability, 0);
        const diff = parseFloat((100 - totalAssigned).toFixed(2));
        if (diff !== 0) {
            const lastActive = updated.filter(p => p.is_active).pop();
            if (lastActive) lastActive.probability += diff;
        }
        setPrizes(updated);
    };

    const uploadPrizeImage = async (index: number, file: File) => {
        const formData = new FormData();
        formData.append('image', file);
        try {
            const res = await axios.post(route('admin.forms.upload-prize-image'), formData);
            updatePrize(index, 'image', res.data.url);
            updatePrize(index, 'image_path', res.data.path);
        } catch (e) {
            console.error('Failed to upload prize image:', e);
        }
    };

    const uploadSound = async (type: 'spin' | 'stop' | 'win', file: File) => {
        const formData = new FormData();
        formData.append('sound', file);
        formData.append('type', type);
        formData.append('form_id', String(form.id));
        try {
            const res = await axios.post(route('admin.forms.upload-spin-sound'), formData);
            if (type === 'spin') setSpinSoundSpin(res.data.url);
            else if (type === 'bgm') setSpinSoundBgm(res.data.url);
            else setSpinSoundWin(res.data.url);
        } catch (e) {
            console.error('Failed to upload sound:', e);
        }
    };

    const saveSpinSettings = () => {
        setSpinSaving(true);
        router.post(route('admin.forms.spin-settings.save', form.id), {
            spin_wheel_enabled: spinEnabled,
            spin_wheel_title: spinTitle,
            spin_wheel_btn_text: spinBtnText,
            spin_wheel_btn_color: spinBtnColor,
            spin_wheel_pointer_color: spinPointerColor,
            spin_wheel_result_message: spinResultMessage,
            spin_wheel_sound_bgm_enabled: bgmEnabled,
            spin_wheel_sound_spin_enabled: spinSoundEnabled,
            spin_wheel_sound_win_enabled: winSoundEnabled,
            prizes: prizes.map((p, i) => ({
                ...p,
                sort_order: i,
            })),
        }, {
            preserveScroll: true,
            onFinish: () => setSpinSaving(false),
        });
    };

    // --- Mini Preview Canvas ---
    const drawWheel = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas || prizes.length === 0) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const size = canvas.width;
        const center = size / 2;
        const radius = center - 10;

        ctx.clearRect(0, 0, size, size);

        // Draw slices
        let startAngle = -Math.PI / 2;
        prizes.forEach((prize, i) => {
            const sliceAngle = (2 * Math.PI) / prizes.length;
            const endAngle = startAngle + sliceAngle;

            ctx.beginPath();
            ctx.moveTo(center, center);
            ctx.arc(center, center, radius, startAngle, endAngle);
            ctx.closePath();
            ctx.fillStyle = prize.color;
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Draw text
            ctx.save();
            ctx.translate(center, center);
            ctx.rotate(startAngle + sliceAngle / 2);
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 11px sans-serif';
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            const label = prize.name || `Hadiah ${i + 1}`;
            ctx.fillText(label.length > 12 ? label.substring(0, 12) + '…' : label, radius - 12, 0);
            ctx.restore();

            startAngle = endAngle;
        });

        // Draw center button
        ctx.beginPath();
        ctx.arc(center, center, 24, 0, 2 * Math.PI);
        ctx.fillStyle = spinBtnColor;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(spinBtnText.length > 8 ? spinBtnText.substring(0, 8) : spinBtnText, center, center);

        // Draw pointer
        ctx.beginPath();
        ctx.moveTo(center - 10, 6);
        ctx.lineTo(center + 10, 6);
        ctx.lineTo(center, 22);
        ctx.closePath();
        ctx.fillStyle = spinPointerColor;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.stroke();
    }, [prizes, spinBtnColor, spinBtnText, spinPointerColor]);

    useEffect(() => {
        drawWheel();
    }, [drawWheel]);

    return (
        <AdminLayout>
            <Head title={`Spin Wheel - ${form.name}`} />

            <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <Link
                        href={route('admin.forms.builder', form.id)}
                        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-4 transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Kembali ke Builder
                    </Link>

                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                                🎡 Spin Wheel
                            </h1>
                            <p className="text-gray-500 mt-1">Pengaturan roda keberuntungan untuk <strong>{form.name}</strong></p>
                        </div>

                        {/* Master Toggle */}
                        <div className="flex items-center gap-3">
                            <span className={`text-sm font-medium ${spinEnabled ? 'text-green-600' : 'text-gray-400'}`}>
                                {spinEnabled ? '✅ Aktif' : '❌ Nonaktif'}
                            </span>
                            <button
                                type="button"
                                onClick={() => setSpinEnabled(!spinEnabled)}
                                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-200 ${spinEnabled ? 'bg-green-500' : 'bg-gray-300'}`}
                            >
                                <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-200 shadow ${spinEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>
                    </div>
                </div>

                {!spinEnabled ? (
                    <Card>
                        <CardContent className="py-16 text-center">
                            <p className="text-6xl mb-4">🎡</p>
                            <h3 className="text-lg font-semibold text-gray-700 mb-2">Spin Wheel Belum Aktif</h3>
                            <p className="text-gray-500 text-sm mb-6">
                                Aktifkan Spin Wheel untuk memberikan hadiah kepada responden setelah mengisi form.
                            </p>
                            <Button onClick={() => setSpinEnabled(true)} className="bg-[#11224e] hover:bg-[#1a3366]">
                                ✨ Aktifkan Spin Wheel
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-6">
                        {/* Settings & Preview Row */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Left: Settings */}
                            <div className="lg:col-span-2 space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base">⚙️ Pengaturan Tampilan</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Judul Spin Wheel</Label>
                                                <Input value={spinTitle} onChange={e => setSpinTitle(e.target.value)} placeholder="Putar & Dapatkan Hadiah!" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Teks Tombol</Label>
                                                <Input value={spinBtnText} onChange={e => setSpinBtnText(e.target.value)} placeholder="PUTAR!" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Warna Tombol</Label>
                                                <div className="flex gap-2 items-center">
                                                    <input type="color" value={spinBtnColor} onChange={e => setSpinBtnColor(e.target.value)} className="h-9 w-12 rounded border cursor-pointer" />
                                                    <Input value={spinBtnColor} onChange={e => setSpinBtnColor(e.target.value)} className="flex-1 font-mono" maxLength={7} />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Warna Panah</Label>
                                                <div className="flex gap-2 items-center">
                                                    <input type="color" value={spinPointerColor} onChange={e => setSpinPointerColor(e.target.value)} className="h-9 w-12 rounded border cursor-pointer" />
                                                    <Input value={spinPointerColor} onChange={e => setSpinPointerColor(e.target.value)} className="flex-1 font-mono" maxLength={7} />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Pesan Hasil (opsional)</Label>
                                            <Input value={spinResultMessage} onChange={e => setSpinResultMessage(e.target.value)} placeholder="Selamat! Anda memenangkan..." />
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base">🔊 Sound Effects</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-gray-500 mb-4">
                                            Atur sound untuk spin wheel. Masing-masing bisa dinyalakan/dimatikan.
                                        </p>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            {[
                                                { type: 'bgm' as const, label: '🎵 BGM', desc: 'Background music, loop terus', current: spinSoundBgm, enabled: bgmEnabled, setEnabled: setBgmEnabled },
                                                { type: 'spin' as const, label: '🎰 Spin', desc: 'Saat roda berputar, tempo ikut putaran', current: spinSoundSpin, enabled: spinSoundEnabled, setEnabled: setSpinSoundEnabled },
                                                { type: 'win' as const, label: '🏆 Winner', desc: 'Saat hadiah muncul', current: spinSoundWin, enabled: winSoundEnabled, setEnabled: setWinSoundEnabled },
                                            ].map(sound => (
                                                <div key={sound.type} className={`p-4 rounded-lg border space-y-3 transition-all ${sound.enabled ? 'bg-white' : 'bg-gray-50 opacity-60'}`}>
                                                    <div className="flex items-center justify-between">
                                                        <p className="text-sm font-medium">{sound.label}</p>
                                                        <button
                                                            type="button"
                                                            onClick={() => sound.setEnabled(!sound.enabled)}
                                                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${sound.enabled ? 'bg-green-500' : 'bg-gray-300'}`}
                                                        >
                                                            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${sound.enabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
                                                        </button>
                                                    </div>
                                                    <p className="text-xs text-gray-400">{sound.desc}</p>
                                                    <p className="text-xs text-gray-500">{sound.current ? '✅ Custom MP3' : '🔈 Default'}</p>
                                                    <label className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 cursor-pointer">
                                                        <Upload className="h-3 w-3" />
                                                        Upload MP3
                                                        <input
                                                            type="file"
                                                            accept=".mp3,audio/mpeg"
                                                            className="hidden"
                                                            onChange={e => {
                                                                if (e.target.files?.[0]) uploadSound(sound.type, e.target.files[0]);
                                                            }}
                                                        />
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Right: Preview */}
                            <div>
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base">👁️ Preview Roda</CardTitle>
                                    </CardHeader>
                                    <CardContent className="flex justify-center">
                                        {prizes.length > 0 ? (
                                            <canvas ref={canvasRef} width={280} height={280} className="border rounded-xl shadow-sm bg-white" />
                                        ) : (
                                            <div className="w-[280px] h-[280px] rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-400 text-sm">
                                                Tambah hadiah untuk melihat preview
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </div>

                        {/* Prizes Section */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <span className="text-base">🎁 Daftar Hadiah ({prizes.length})</span>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" onClick={distributeProbability} disabled={prizes.filter(p => p.is_active).length === 0}>
                                            ⚖️ Distribusi Rata
                                        </Button>
                                        <Button size="sm" onClick={addPrize} className="bg-[#11224e] hover:bg-[#1a3366]">
                                            <Plus className="h-4 w-4 mr-1" /> Tambah Hadiah
                                        </Button>
                                    </div>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {prizes.length === 0 ? (
                                    <div className="text-center py-12 text-gray-400">
                                        <p className="text-4xl mb-3">🎁</p>
                                        <p className="text-sm">Belum ada hadiah. Klik "Tambah Hadiah" untuk mulai.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {/* Table Header */}
                                        <div className="hidden md:grid grid-cols-12 gap-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                            <div className="col-span-1">Warna</div>
                                            <div className="col-span-3">Nama Hadiah</div>
                                            <div className="col-span-2">Gambar</div>
                                            <div className="col-span-1">Prob %</div>
                                            <div className="col-span-1">Stok</div>
                                            <div className="col-span-1">Menang</div>
                                            <div className="col-span-1">Aktif</div>
                                            <div className="col-span-2 text-right">Aksi</div>
                                        </div>

                                        {prizes.map((prize, index) => (
                                            <div key={index} className={`grid grid-cols-1 md:grid-cols-12 gap-3 p-3 rounded-xl border ${prize.is_active ? 'bg-white' : 'bg-gray-50 opacity-60'} transition-all hover:shadow-sm`}>
                                                {/* Color */}
                                                <div className="col-span-1 flex items-center">
                                                    <input
                                                        type="color"
                                                        value={prize.color}
                                                        onChange={e => updatePrize(index, 'color', e.target.value)}
                                                        className="h-8 w-8 rounded-full border cursor-pointer"
                                                    />
                                                </div>

                                                {/* Name */}
                                                <div className="col-span-3">
                                                    <Input
                                                        value={prize.name}
                                                        onChange={e => updatePrize(index, 'name', e.target.value)}
                                                        placeholder="Nama hadiah..."
                                                        className="text-sm"
                                                    />
                                                </div>

                                                {/* Image */}
                                                <div className="col-span-2 flex items-center gap-2">
                                                    {prize.image && (
                                                        <img src={prize.image} alt="" className="h-8 w-8 rounded object-cover border" />
                                                    )}
                                                    <label className="text-xs text-blue-600 hover:text-blue-800 cursor-pointer whitespace-nowrap">
                                                        <Upload className="h-3 w-3 inline mr-1" />
                                                        {prize.image ? 'Ganti' : 'Upload'}
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            className="hidden"
                                                            onChange={e => {
                                                                if (e.target.files?.[0]) uploadPrizeImage(index, e.target.files[0]);
                                                            }}
                                                        />
                                                    </label>
                                                </div>

                                                {/* Probability */}
                                                <div className="col-span-1">
                                                    <Input
                                                        type="number"
                                                        value={prize.probability}
                                                        onChange={e => updatePrize(index, 'probability', parseFloat(e.target.value) || 0)}
                                                        min={0}
                                                        max={100}
                                                        step={0.01}
                                                        className="text-sm text-center"
                                                    />
                                                </div>

                                                {/* Stock */}
                                                <div className="col-span-1">
                                                    <Input
                                                        type="number"
                                                        value={prize.stock}
                                                        onChange={e => updatePrize(index, 'stock', parseInt(e.target.value) || 0)}
                                                        min={0}
                                                        className="text-sm text-center"
                                                        title="0 = unlimited"
                                                    />
                                                </div>

                                                {/* Won Count */}
                                                <div className="col-span-1 flex items-center justify-center">
                                                    <span className="text-sm font-medium text-amber-600">{prize.won_count || 0}</span>
                                                </div>

                                                {/* Active Toggle */}
                                                <div className="col-span-1 flex items-center justify-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => updatePrize(index, 'is_active', !prize.is_active)}
                                                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${prize.is_active ? 'bg-green-500' : 'bg-gray-300'}`}
                                                    >
                                                        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${prize.is_active ? 'translate-x-4' : 'translate-x-0.5'}`} />
                                                    </button>
                                                </div>

                                                {/* Actions */}
                                                <div className="col-span-2 flex items-center justify-end">
                                                    <button
                                                        onClick={() => removePrize(index)}
                                                        className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors"
                                                        title="Hapus hadiah"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}

                                        {/* Probability Summary */}
                                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border text-sm">
                                            <span className="text-gray-600">Total Probabilitas:</span>
                                            <span className={`font-bold ${Math.abs(prizes.filter(p => p.is_active).reduce((s, p) => s + p.probability, 0) - 100) < 0.1 ? 'text-green-600' : 'text-red-600'}`}>
                                                {prizes.filter(p => p.is_active).reduce((s, p) => s + p.probability, 0).toFixed(2)}%
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Save Button */}
                        <div className="flex justify-end gap-3">
                            <Link href={route('admin.forms.builder', form.id)}>
                                <Button variant="outline">Batal</Button>
                            </Link>
                            <Button onClick={saveSpinSettings} disabled={spinSaving} className="bg-[#11224e] hover:bg-[#1a3366] px-8">
                                {spinSaving ? '⏳ Menyimpan...' : '💾 Simpan Pengaturan'}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
