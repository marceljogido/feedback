import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Card, CardContent } from '@/Components/ui/card';
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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/Components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/Components/ui/select';
import { Label } from '@/Components/ui/label';
import {
    Search,
    Edit,
    ExternalLink,
    FileText,
    Plus,
} from 'lucide-react';
import { useState } from 'react';

interface Event {
    id: number;
    title: string;
    slug: string;
    status: 'draft' | 'active' | 'closed';
    public_url: string;
    updated_at: string;
}

interface Props {
    events: {
        data: Event[];
        links: any;
        current_page: number;
        last_page: number;
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

export default function FormsIndex({ events }: Props) {
    const [search, setSearch] = useState('');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('admin.forms.index'), { search }, { preserveState: true });
    };

    return (
        <AdminLayout header="Kelola Form">
            <Head title="Kelola Form" />

            <div className="space-y-6">
                {/* Header Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex gap-2 flex-1 max-w-md">
                        {/* Search functionality can be added here similar to Events Index if needed */}
                    </div>

                    <Dialog>
                        <DialogTrigger asChild>
                            <Button className="bg-[#f17720] hover:bg-[#d96a1a]">
                                <Plus className="h-4 w-4 mr-2" />
                                Buat Form Baru
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Mulai Buat Form</DialogTitle>
                                <DialogDescription>
                                    Pilih event yang sudah ada untuk dibuatkan formnya, atau buat event baru.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 pt-4">
                                <div className="grid gap-4">
                                    <div className="space-y-2">
                                        <Label>Pilih Event yang Sudah Ada</Label>
                                        <Select onValueChange={(value) => router.visit(route('admin.events.builder', value))}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Pilih Event..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {events.data.map((event) => (
                                                    <SelectItem key={event.id} value={event.id.toString()}>
                                                        {event.title}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="relative">
                                        <div className="absolute inset-0 flex items-center">
                                            <span className="w-full border-t" />
                                        </div>
                                        <div className="relative flex justify-center text-xs uppercase">
                                            <span className="bg-white px-2 text-gray-500">Atau</span>
                                        </div>
                                    </div>
                                    <Link href={route('admin.events.create')} className="w-full">
                                        <Button variant="outline" className="w-full">
                                            <Plus className="h-4 w-4 mr-2" />
                                            Buat Event Baru
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Forms Table */}
                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nama Event</TableHead>
                                    <TableHead>Link Form</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Terakhir Diupdate</TableHead>
                                    <TableHead className="text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {events.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                                            Belum ada event. Buat event terlebih dahulu.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    events.data.map((event) => (
                                        <TableRow key={event.id}>
                                            <TableCell>
                                                <div className="font-medium text-gray-900">
                                                    {event.title}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <a
                                                    href={event.public_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                                                >
                                                    /{event.slug}
                                                    <ExternalLink className="h-3 w-3" />
                                                </a>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={statusColors[event.status]}>
                                                    {statusLabels[event.status]}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {event.updated_at}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Link href={route('admin.events.builder', event.id)}>
                                                    <Button size="sm" className="bg-[#11224e] hover:bg-[#1a3366]">
                                                        <FileText className="h-4 w-4 mr-2" />
                                                        Edit Form
                                                    </Button>
                                                </Link>
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
