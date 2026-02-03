import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Textarea } from '@/Components/ui/textarea';
import { Label } from '@/Components/ui/label';
import { Badge } from '@/Components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/Components/ui/select';
import {
    ArrowLeft,
    Copy,
    ExternalLink,
    Save,
} from 'lucide-react';
import { Link } from '@inertiajs/react';

interface Event {
    id: number;
    title: string;
    slug: string;
    description: string | null;
    status: 'draft' | 'active' | 'closed';
    locale: string;
    banner_image: string | null;
    logo_image: string | null;
    event_date: string | null;
    public_url: string;
}

interface Props {
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

export default function EditEvent({ event }: Props) {
    const { data, setData, post, processing, errors } = useForm<{
        title: string;
        slug: string;
        description: string;
        event_date: string;
        locale: string;
        logo_image: File | null;
        banner_image: File | null;
        _method: string;
    }>({
        title: event.title,
        slug: event.slug,
        description: event.description || '',
        locale: event.locale,
        event_date: event.event_date || '',
        logo_image: null,
        banner_image: null,
        _method: 'PUT',
    });

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('admin.events.update', event.id), {
            forceFormData: true,
            preserveScroll: true,
        });
    };

    const toggleStatus = () => {
        router.post(route('admin.events.toggle-status', event.id), {}, {
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
        navigator.clipboard.writeText(event.public_url);
    };

    return (
        <AdminLayout header={`Settings: ${event.title}`}>
            <Head title={`Settings ${event.title}`} />

            <div className="space-y-6">
                {/* Header with actions */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <Link
                        href={route('admin.events.index')}
                        className="inline-flex items-center text-gray-600 hover:text-gray-900"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Kembali
                    </Link>

                    <div className="flex flex-wrap items-center gap-2">
                        <Badge className={statusColors[event.status]}>
                            {statusLabels[event.status]}
                        </Badge>
                        <Button variant="outline" size="sm" onClick={copyLink}>
                            <Copy className="h-4 w-4 mr-1" />
                            Salin Link
                        </Button>
                        <a href={event.public_url} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" size="sm">
                                <ExternalLink className="h-4 w-4 mr-1" />
                                Preview
                            </Button>
                        </a>
                        <Button
                            variant={event.status === 'active' ? 'destructive' : 'default'}
                            size="sm"
                            onClick={toggleStatus}
                            className={event.status !== 'active' ? 'bg-green-600 hover:bg-green-700' : ''}
                        >
                            {event.status === 'active' ? 'Tutup Event' : 'Aktifkan Event'}
                        </Button>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Pengaturan Event</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSave} className="space-y-6" encType="multipart/form-data">
                            <div className="space-y-2">
                                <Label htmlFor="title">Nama Event</Label>
                                <Input
                                    id="title"
                                    value={data.title}
                                    onChange={(e) => setData('title', e.target.value)}
                                    className={errors.title ? 'border-red-500' : ''}
                                />
                                {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
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

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="logo_image">Logo Event / Klien</Label>
                                        <div className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50 transition-colors">
                                            <Input
                                                id="logo_image"
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => setData('logo_image', e.target.files?.[0] || null)}
                                                className="cursor-pointer"
                                            />
                                            <p className="text-xs text-gray-500 mt-2">
                                                Format: PNG, JPG (Max 1MB). Disarankan persegi transparan.
                                            </p>
                                        </div>
                                        {event.logo_image && (
                                            <div className="mt-2">
                                                <p className="text-xs text-gray-500 mb-1">Logo Saat Ini:</p>
                                                <img src={event.logo_image} alt="Current Logo" className="h-12 w-auto border rounded p-1" />
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="banner_image">Banner Header</Label>
                                        <div className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50 transition-colors">
                                            <Input
                                                id="banner_image"
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => setData('banner_image', e.target.files?.[0] || null)}
                                                className="cursor-pointer"
                                            />
                                            <p className="text-xs text-gray-500 mt-2">
                                                Format: PNG, JPG (Max 2MB). Rasio 3:1 atau 4:1 disarankan.
                                            </p>
                                        </div>
                                        {event.banner_image && (
                                            <div className="mt-2">
                                                <p className="text-xs text-gray-500 mb-1">Banner Saat Ini:</p>
                                                <img src={event.banner_image} alt="Current Banner" className="h-16 w-full object-cover border rounded" />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="event_date">Tanggal Event</Label>
                                        <Input
                                            id="event_date"
                                            type="date"
                                            value={data.event_date || ''}
                                            onChange={(e) => setData('event_date', e.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="locale">Bahasa Default</Label>
                                        <Select
                                            value={data.locale}
                                            onValueChange={(value) => setData('locale', value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="id">Bahasa Indonesia</SelectItem>
                                                <SelectItem value="en">English</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={processing}
                                className="bg-[#11224e] hover:bg-[#1a3366] w-full md:w-auto"
                            >
                                <Save className="h-4 w-4 mr-2" />
                                {processing ? 'Menyimpan...' : 'Simpan Pengaturan'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
