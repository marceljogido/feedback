import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Input } from '@/Components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/Components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/Components/ui/dropdown-menu';
import {
    Plus,
    Search,
    MoreHorizontal,
    Edit,
    Eye,
    Trash2,
    Copy,
    ExternalLink,
} from 'lucide-react';
import { useState } from 'react';

interface Event {
    id: number;
    title: string;
    slug: string;
    status: 'draft' | 'active' | 'closed';
    locale: string;
    response_count: number;
    event_date: string | null;
    created_at: string;
    public_url: string;
}

interface Props {
    events: {
        data: Event[];
        links: any;
        current_page: number;
        last_page: number;
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

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('admin.events.index'), { search }, { preserveState: true });
    };

    const copyLink = (url: string) => {
        navigator.clipboard.writeText(url);
        // Could add toast notification here
    };

    const deleteEvent = (id: number) => {
        if (confirm('Apakah Anda yakin ingin menghapus event ini?')) {
            router.delete(route('admin.events.destroy', id));
        }
    };

    return (
        <AdminLayout header="Kelola Event">
            <Head title="Kelola Event" />

            <div className="space-y-6">
                {/* Header Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <form onSubmit={handleSearch} className="flex gap-2 flex-1 max-w-md">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                type="text"
                                placeholder="Cari event..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Button type="submit" variant="outline">
                            Cari
                        </Button>
                    </form>

                    <Link href={route('admin.events.create')}>
                        <Button className="bg-[#f17720] hover:bg-[#d96a1a]">
                            <Plus className="h-4 w-4 mr-2" />
                            Buat Event
                        </Button>
                    </Link>
                </div>

                {/* Events Table */}
                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nama Event</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-center">Respons</TableHead>
                                    <TableHead>Tanggal Event</TableHead>
                                    <TableHead>Dibuat</TableHead>
                                    <TableHead className="text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {events.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                                            Belum ada event. Buat event pertama Anda!
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    events.data.map((event) => (
                                        <TableRow key={event.id}>
                                            <TableCell>
                                                <div>
                                                    <Link
                                                        href={route('admin.events.edit', event.id)}
                                                        className="font-medium text-gray-900 hover:text-[#11224e]"
                                                    >
                                                        {event.title}
                                                    </Link>
                                                    <p className="text-sm text-gray-500">
                                                        /{event.slug}
                                                    </p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={statusColors[event.status]}>
                                                    {statusLabels[event.status]}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {event.response_count}
                                            </TableCell>
                                            <TableCell>
                                                {event.event_date || '-'}
                                            </TableCell>
                                            <TableCell>
                                                {event.created_at}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Link href={route('admin.events.edit', event.id)}>
                                                        <Button variant="ghost" size="sm" title="Edit">
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                    <Link href={route('admin.events.responses', event.id)}>
                                                        <Button variant="ghost" size="sm" title="Lihat Respons">
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        title="Salin Link"
                                                        onClick={() => copyLink(event.public_url)}
                                                    >
                                                        <Copy className="h-4 w-4" />
                                                    </Button>
                                                    <a href={event.public_url} target="_blank" rel="noopener noreferrer">
                                                        <Button variant="ghost" size="sm" title="Buka Form">
                                                            <ExternalLink className="h-4 w-4" />
                                                        </Button>
                                                    </a>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                        title="Hapus"
                                                        onClick={() => deleteEvent(event.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Pagination */}
                {events.last_page > 1 && (
                    <div className="flex justify-center gap-2">
                        {events.links.map((link: any, index: number) => (
                            <Link
                                key={index}
                                href={link.url || '#'}
                                className={`px-4 py-2 rounded-lg text-sm ${link.active
                                    ? 'bg-[#11224e] text-white'
                                    : 'bg-white border hover:bg-gray-50'
                                    } ${!link.url && 'opacity-50 cursor-not-allowed'}`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
