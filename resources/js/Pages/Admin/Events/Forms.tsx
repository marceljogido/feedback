import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import {
    ArrowLeft,
    Plus,
    ExternalLink,
    Settings,
    FileText,
    BarChart3,
    Trash2,
    Copy,
    Scan,
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/Components/ui/dialog';
import { useState } from 'react';

interface Form {
    id: number;
    name: string;
    slug: string;
    status: 'draft' | 'active' | 'closed';
    response_count: number;
    public_url: string;
    created_at: string;
}

interface Event {
    id: number;
    title: string;
    slug: string;
}

interface Props {
    event: Event;
    forms: Form[];
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

export default function EventForms({ event, forms }: Props) {
    const [viewingQrFormId, setViewingQrFormId] = useState<number | null>(null);
    const viewingForm = forms.find(f => f.id === viewingQrFormId);

    const downloadQR = () => {
        const canvas = document.getElementById('qr-code-canvas') as HTMLCanvasElement;
        if (canvas) {
            const pngUrl = canvas.toDataURL('image/png');
            const downloadLink = document.createElement('a');
            downloadLink.href = pngUrl;
            downloadLink.download = `qr-${viewingForm?.slug}.png`;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
        }
    };
    const copyLink = (url: string) => {
        navigator.clipboard.writeText(url);
    };

    const deleteForm = (formId: number) => {
        if (confirm('Apakah Anda yakin ingin menghapus form ini?')) {
            router.delete(route('admin.forms.destroy', formId));
        }
    };

    const duplicateForm = (formId: number) => {
        if (confirm('Apakah Anda yakin ingin menduplikasi form ini?')) {
            router.post(route('admin.forms.duplicate', formId));
        }
    };

    return (
        <AdminLayout header={`Kuesioner: ${event.title}`}>
            <Head title={`Kuesioner - ${event.title}`} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <Link
                        href={route('admin.events.index')}
                        className="inline-flex items-center text-gray-600 hover:text-gray-900"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Kembali ke Daftar Event
                    </Link>

                    <Link href={route('admin.events.forms.create', event.id)}>
                        <Button className="bg-[#f17720] hover:bg-[#d96a1a]">
                            ➕ Buat Kuesioner Baru
                        </Button>
                    </Link>
                </div>

                {/* Forms List */}
                {forms.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                Belum ada kuesioner
                            </h3>
                            <p className="text-gray-500 mb-4">
                                Buat kuesioner pertama untuk acara ini. Kuesioner adalah form yang akan diisi oleh peserta.
                            </p>
                            <Link href={route('admin.events.forms.create', event.id)}>
                                <Button className="bg-[#f17720] hover:bg-[#d96a1a]">
                                    <Plus className="h-4 w-4 mr-2" />
                                    + Buat Kuesioner
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4">
                        {forms.map((form) => (
                            <Card key={form.id}>
                                <CardContent className="p-6">
                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-lg font-semibold">{form.name}</h3>
                                                <Badge className={statusColors[form.status]}>
                                                    {statusLabels[form.status]}
                                                </Badge>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                                                <span>{form.response_count} respons</span>
                                                <span>•</span>
                                                <span>Dibuat: {form.created_at}</span>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setViewingQrFormId(form.id)}
                                                title="Tampilkan QR Code"
                                            >
                                                <Scan className="h-4 w-4 mr-1" />
                                                QR
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => copyLink(form.public_url)}
                                            >
                                                📋 Salin Link
                                            </Button>
                                            <a href={form.public_url} target="_blank" rel="noopener noreferrer">
                                                <Button variant="outline" size="sm">
                                                    👁️ Preview
                                                </Button>
                                            </a>
                                            <Link href={route('admin.forms.builder', form.id)}>
                                                <Button variant="outline" size="sm" title="Buat/Edit Pertanyaan">
                                                    ✏️ Edit Pertanyaan
                                                </Button>
                                            </Link>
                                            <Link href={route('admin.forms.responses', form.id)}>
                                                <Button variant="outline" size="sm" title="Lihat Jawaban Peserta">
                                                    📊 Lihat Jawaban
                                                </Button>
                                            </Link>
                                            <Link href={route('admin.forms.edit', form.id)}>
                                                <Button variant="outline" size="sm" title="Pengaturan Kuesioner">
                                                    ⚙️
                                                </Button>
                                            </Link>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => duplicateForm(form.id)}
                                                title="Duplikat Kuesioner"
                                            >
                                                <Copy className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => deleteForm(form.id)}
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                title="Hapus Kuesioner"
                                            >
                                                🗑️
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            <Dialog open={!!viewingQrFormId} onOpenChange={(open) => !open && setViewingQrFormId(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>QR Code Form</DialogTitle>
                        <DialogDescription>
                            Scan QR Code ini untuk akses langsung ke kuesioner.
                        </DialogDescription>
                    </DialogHeader>
                    {viewingForm && (
                        <div className="flex flex-col items-center justify-center space-y-6 py-4">
                            <div className="p-4 bg-white border rounded-lg shadow-sm">
                                <QRCodeCanvas
                                    id="qr-code-canvas"
                                    value={viewingForm.public_url}
                                    size={256}
                                    level={'H'}
                                    includeMargin={true}
                                />
                            </div>
                            <div className="text-center text-sm text-muted-foreground">
                                <p className="font-medium mb-1">{viewingForm.name}</p>
                                <p className="text-xs break-all">{viewingForm.public_url}</p>
                            </div>
                            <Button onClick={downloadQR} className="w-full sm:w-auto">
                                <Scan className="mr-2 h-4 w-4" /> Download PNG
                            </Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}
