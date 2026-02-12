import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Textarea } from '@/Components/ui/textarea';
import { Label } from '@/Components/ui/label';
import { Badge } from '@/Components/ui/badge';

import { ArrowLeft, Copy, ExternalLink, Save, Pencil, Calendar, QrCode, Download } from 'lucide-react';
import { Link } from '@inertiajs/react';
import { QRCodeCanvas } from 'qrcode.react';
import { useRef } from 'react';

interface Form {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    status: 'draft' | 'active' | 'closed';
    opens_at: string | null;
    closes_at: string | null;
    allow_edit: boolean;
    thank_you_title: string | null;
    thank_you_message: string | null;
    thank_you_button_text: string | null;
    thank_you_button_url: string | null;
    response_limit: number | null;
    public_url: string;
}

interface Event {
    id: number;
    title: string;
    theme_config: {
        custom_labels?: {
            name?: string;
            name_en?: string;
            email?: string;
            email_en?: string;
        };
    } | null;
}

interface Props {
    form: Form;
    event: Event;
}

const statusColors = {
    draft: 'bg-gray-100 text-gray-700',
    active: 'bg-green-100 text-green-700',
    closed: 'bg-red-100 text-red-700',
};

const statusLabels = {
    draft: 'Draft',
    active: 'Aktif',
    closed: 'Ditutup',
};

export default function EditForm({ form, event }: Props) {
    const qrRef = useRef<HTMLDivElement>(null);

    const downloadQRCode = () => {
        if (!qrRef.current) return;

        const canvas = qrRef.current.querySelector('canvas');
        if (canvas) {
            const image = canvas.toDataURL("image/png");
            const link = document.createElement('a');
            link.href = image;
            link.download = `qrcode-${form.slug}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const { data, setData, put, processing, errors } = useForm({
        name: form.name,
        slug: form.slug,
        description: form.description || '',
        opens_at: form.opens_at || '',
        closes_at: form.closes_at || '',
        allow_edit: form.allow_edit ?? false,
        thank_you_title: form.thank_you_title || '',
        thank_you_message: form.thank_you_message || '',
        thank_you_button_text: form.thank_you_button_text || '',
        thank_you_button_url: form.thank_you_button_url || '',
        response_limit: form.response_limit || '',
    });

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('admin.forms.update', form.id), {
            preserveScroll: true,
        });
    };

    const toggleStatus = () => {
        router.post(route('admin.forms.toggle-status', form.id), {}, {
            preserveScroll: true,
        });
    };

    const generateSlug = (text: string) => {
        return text
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
    };

    const copyLink = () => {
        navigator.clipboard.writeText(form.public_url);
    };

    return (
        <AdminLayout header={`Settings: ${form.name}`}>
            <Head title={`Settings ${form.name}`} />

            <div className="space-y-6">
                {/* Header with actions */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <Link
                        href={route('admin.events.forms', event.id)}
                        className="inline-flex items-center text-gray-600 hover:text-gray-900"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Kembali ke Daftar Form
                    </Link>

                    <div className="flex flex-wrap items-center gap-2">
                        <Badge className={statusColors[form.status]}>
                            {statusLabels[form.status]}
                        </Badge>
                        <Button variant="outline" size="sm" onClick={copyLink}>
                            📋 Salin Link
                        </Button>
                        <a href={form.public_url} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" size="sm">
                                👁️ Preview
                            </Button>
                        </a>
                        <Link href={route('admin.forms.builder', form.id)}>
                            <Button variant="outline" size="sm">
                                ✏️ Edit Pertanyaan
                            </Button>
                        </Link>
                        <Button
                            variant={form.status === 'active' ? 'destructive' : 'default'}
                            size="sm"
                            onClick={toggleStatus}
                            className={form.status !== 'active' ? 'bg-green-600 hover:bg-green-700' : ''}
                        >
                            {form.status === 'active' ? '🔒 Tutup Form' : '✅ Aktifkan Form'}
                        </Button>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Pengaturan Form</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSave} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nama Form</Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    className={errors.name ? 'border-red-500' : ''}
                                />
                                {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="slug">Slug (URL)</Label>
                                <div className="flex gap-2">
                                    <div className="flex-1 flex">
                                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                                            /form/
                                        </span>
                                        <Input
                                            id="slug"
                                            value={data.slug}
                                            onChange={(e) => setData('slug', generateSlug(e.target.value))}
                                            className={`rounded-l-none ${errors.slug ? 'border-red-500' : ''}`}
                                        />
                                    </div>
                                    <Button type="button" variant="outline" onClick={() => {
                                        const url = `${window.location.origin}/form/${data.slug}`;
                                        navigator.clipboard.writeText(url);
                                    }}>
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </div>
                                {errors.slug && <p className="text-sm text-red-500">{errors.slug}</p>}
                                <p className="text-xs text-gray-500">
                                    Link: {window.location.origin}/form/{data.slug}
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Deskripsi</Label>
                                <Textarea
                                    id="description"
                                    value={data.description || ''}
                                    onChange={(e) => setData('description', e.target.value)}
                                    rows={3}
                                />
                            </div>

                            <Button
                                type="submit"
                                disabled={processing}
                                className="bg-[#11224e] hover:bg-[#1a3366] w-full md:w-auto"
                            >
                                {processing ? 'Menyimpan...' : '💾 Simpan Pengaturan'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Scheduling Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            Jadwal Buka/Tutup Otomatis
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-gray-500 mb-4">
                            Atur jadwal kapan form akan dibuka dan ditutup secara otomatis. Kosongkan jika tidak ingin menggunakan jadwal.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="opens_at">Waktu Mulai (Buka)</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="opens_at"
                                        type="datetime-local"
                                        value={data.opens_at}
                                        onChange={(e) => setData('opens_at', e.target.value)}
                                        className={errors.opens_at ? 'border-red-500' : ''}
                                    />
                                    {data.opens_at && (
                                        <Button type="button" variant="ghost" size="sm" onClick={() => setData('opens_at', '')}>
                                            ✕
                                        </Button>
                                    )}
                                </div>
                                {errors.opens_at && <p className="text-sm text-red-500">{errors.opens_at}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="closes_at">Waktu Selesai (Tutup)</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="closes_at"
                                        type="datetime-local"
                                        value={data.closes_at}
                                        onChange={(e) => setData('closes_at', e.target.value)}
                                        className={errors.closes_at ? 'border-red-500' : ''}
                                    />
                                    {data.closes_at && (
                                        <Button type="button" variant="ghost" size="sm" onClick={() => setData('closes_at', '')}>
                                            ✕
                                        </Button>
                                    )}
                                </div>
                                {errors.closes_at && <p className="text-sm text-red-500">{errors.closes_at}</p>}
                            </div>
                        </div>

                        {(data.opens_at || data.closes_at) && (
                            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                                📅 Jadwal aktif:
                                {data.opens_at && <span> Buka <strong>{new Date(data.opens_at).toLocaleString('id-ID')}</strong></span>}
                                {data.opens_at && data.closes_at && <span> —</span>}
                                {data.closes_at && <span> Tutup <strong>{new Date(data.closes_at).toLocaleString('id-ID')}</strong></span>}
                            </div>
                        )}

                        {/* Edit after submission toggle */}
                        <div className="mt-6 pt-6 border-t">
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label className="text-base font-medium">✏️ Izinkan Edit Jawaban</Label>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Responden akan mendapat link untuk mengedit jawaban setelah submit.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setData('allow_edit', !data.allow_edit)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${data.allow_edit ? 'bg-[#11224e]' : 'bg-gray-300'
                                        }`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${data.allow_edit ? 'translate-x-6' : 'translate-x-1'
                                            }`}
                                    />
                                </button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Response Limit Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            🔢 Pembatasan Responden
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-gray-500 mb-4">
                            Batasi jumlah responden yang bisa mengisi form ini. Kosongkan jika tidak ada batasan.
                        </p>
                        <div className="space-y-2 max-w-xs">
                            <Label htmlFor="response_limit">Maksimal Jumlah Responden</Label>
                            <Input
                                id="response_limit"
                                type="number"
                                placeholder="Contoh: 100"
                                value={data.response_limit}
                                onChange={(e) => setData('response_limit', e.target.value)}
                                className={errors.response_limit ? 'border-red-500' : ''}
                            />
                            {errors.response_limit && <p className="text-sm text-red-500">{errors.response_limit}</p>}
                        </div>
                    </CardContent>
                </Card>

                {/* Custom Thank You Page Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            🎉 Custom Halaman Terima Kasih
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-gray-500 mb-4">
                            Sesuaikan tampilan halaman setelah responden mengirim jawaban.
                        </p>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="thank_you_title">Judul (Title)</Label>
                                <Input
                                    id="thank_you_title"
                                    placeholder="Default: Terima Kasih!"
                                    value={data.thank_you_title}
                                    onChange={(e) => setData('thank_you_title', e.target.value)}
                                    className={errors.thank_you_title ? 'border-red-500' : ''}
                                />
                                {errors.thank_you_title && <p className="text-sm text-red-500">{errors.thank_you_title}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="thank_you_message">Pesan (Message)</Label>
                                <Textarea
                                    id="thank_you_message"
                                    placeholder="Default: Testimoni Anda telah berhasil dikirim."
                                    value={data.thank_you_message}
                                    onChange={(e) => setData('thank_you_message', e.target.value)}
                                    rows={3}
                                    className={errors.thank_you_message ? 'border-red-500' : ''}
                                />
                                {errors.thank_you_message && <p className="text-sm text-red-500">{errors.thank_you_message}</p>}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="thank_you_button_text">Teks Tombol (Opsional)</Label>
                                    <Input
                                        id="thank_you_button_text"
                                        placeholder="Contoh: Join Grup WA"
                                        value={data.thank_you_button_text}
                                        onChange={(e) => setData('thank_you_button_text', e.target.value)}
                                        className={errors.thank_you_button_text ? 'border-red-500' : ''}
                                    />
                                    {errors.thank_you_button_text && <p className="text-sm text-red-500">{errors.thank_you_button_text}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="thank_you_button_url">Link Tombol (Opsional)</Label>
                                    <Input
                                        id="thank_you_button_url"
                                        placeholder="https://..."
                                        value={data.thank_you_button_url}
                                        onChange={(e) => setData('thank_you_button_url', e.target.value)}
                                        className={errors.thank_you_button_url ? 'border-red-500' : ''}
                                    />
                                    {errors.thank_you_button_url && <p className="text-sm text-red-500">{errors.thank_you_button_url}</p>}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* QR Code Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <QrCode className="h-5 w-5" />
                            QR Code Form
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
                            <div className="bg-white p-4 rounded-xl border shadow-sm" ref={qrRef}>
                                <QRCodeCanvas
                                    value={form.public_url}
                                    size={200}
                                    level={"H"}
                                    includeMargin={true}
                                />
                            </div>

                            <div className="flex-1 space-y-4">
                                <div>
                                    <h3 className="text-lg font-medium mb-2">Scan untuk mengisi form</h3>
                                    <p className="text-gray-500 text-sm">
                                        Gunakan QR Code ini untuk memudahkan responden mengakses form Anda secara langsung.
                                        Cocok untuk dicetak di poster, meja registrasi, atau layar presentasi.
                                    </p>
                                </div>

                                <div className="flex flex-wrap gap-3">
                                    <Button onClick={downloadQRCode} className="bg-[#11224e] hover:bg-[#1a3366]">
                                        <Download className="h-4 w-4 mr-2" />
                                        Download QR Code
                                    </Button>

                                    <Button variant="outline" onClick={copyLink}>
                                        <Copy className="h-4 w-4 mr-2" />
                                        Salin Link Form
                                    </Button>
                                </div>

                                <div className="p-3 bg-gray-50 rounded-lg border text-sm text-gray-600 break-all">
                                    {form.public_url}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}

