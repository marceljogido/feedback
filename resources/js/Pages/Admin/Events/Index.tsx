import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Badge } from '@/Components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/Components/ui/select';
import {
    Plus,
    Search,
    Settings,
    Trash2,
    FileText,
    Calendar,
} from 'lucide-react';
import { useState } from 'react';

interface Event {
    id: number;
    title: string;
    slug: string;
    status: 'draft' | 'active' | 'closed';
    locale: string;
    form_count: number;
    response_count: number;
    event_date: string | null;
    created_at: string;
}

interface Props {
    events: {
        data: Event[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    filters: {
        search?: string;
        status?: string;
    };
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

export default function EventsIndex({ events, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');

    const handleSearch = () => {
        router.get(route('admin.events.index'), { search, status }, {
            preserveState: true,
        });
    };

    const deleteEvent = (eventId: number) => {
        if (confirm('Apakah Anda yakin ingin menghapus event ini? Semua form dan respons juga akan dihapus.')) {
            router.delete(route('admin.events.destroy', eventId));
        }
    };

    return (
        <AdminLayout header="Daftar Event">
            <Head title="Daftar Event" />

            <div className="space-y-6">
                {/* Header with actions */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex flex-1 gap-4">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Cari event..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                className="pl-10"
                            />
                        </div>
                        <Select value={status} onValueChange={(value) => {
                            setStatus(value);
                            router.get(route('admin.events.index'), { search, status: value }, {
                                preserveState: true,
                            });
                        }}>
                            <SelectTrigger className="w-40">
                                <SelectValue placeholder="Semua Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Status</SelectItem>
                                <SelectItem value="draft">Draft</SelectItem>
                                <SelectItem value="active">Aktif</SelectItem>
                                <SelectItem value="closed">Ditutup</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <Link href={route('admin.events.create')}>
                        <Button className="bg-[#f17720] hover:bg-[#d96a1a]">
                            ➕ Buat Acara Baru
                        </Button>
                    </Link>
                </div>

                {/* Events List */}
                {events.data.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                Belum ada event
                            </h3>
                            <p className="text-gray-500 mb-4">
                                Buat event pertama Anda untuk mulai mengumpulkan feedback
                            </p>
                            <Link href={route('admin.events.create')}>
                                <Button className="bg-[#f17720] hover:bg-[#d96a1a]">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Buat Event
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4">
                        {events.data.map((event) => (
                            <Card key={event.id}>
                                <CardContent className="p-6">
                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-lg font-semibold">{event.title}</h3>
                                                <Badge className={statusColors[event.status]}>
                                                    {statusLabels[event.status]}
                                                </Badge>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                                                <span>{event.form_count} form</span>
                                                <span>•</span>
                                                <span>{event.response_count} respons</span>
                                                {event.event_date && (
                                                    <>
                                                        <span>•</span>
                                                        <span>{event.event_date}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-2">
                                            <Link href={route('admin.events.forms', event.id)}>
                                                <Button className="bg-[#11224e] hover:bg-[#1a3366]">
                                                    📋 Kelola Kuesioner
                                                </Button>
                                            </Link>
                                            <Link href={route('admin.events.edit', event.id)}>
                                                <Button variant="outline" size="sm" title="Pengaturan Acara">
                                                    ⚙️
                                                </Button>
                                            </Link>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => deleteEvent(event.id)}
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                title="Hapus Acara"
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

                {/* Pagination */}
                {events.last_page > 1 && (
                    <div className="flex justify-center gap-2">
                        {Array.from({ length: events.last_page }, (_, i) => i + 1).map((page) => (
                            <Link
                                key={page}
                                href={route('admin.events.index', { ...filters, page })}
                                className={`px-3 py-1 rounded ${page === events.current_page
                                    ? 'bg-[#11224e] text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                {page}
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </AdminLayout >
    );
}
