import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Textarea } from '@/Components/ui/textarea';
import { Label } from '@/Components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/Components/ui/select';
import { ArrowLeft } from 'lucide-react';
import { Link } from '@inertiajs/react';

export default function CreateEvent() {
    const { data, setData, post, processing, errors } = useForm({
        title: '',
        description: '',
        event_date: '',
        locale: 'id',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('admin.events.store'));
    };

    return (
        <AdminLayout header="Buat Event Baru">
            <Head title="Buat Event Baru" />

            <div className="max-w-2xl mx-auto">
                <Link
                    href={route('admin.events.index')}
                    className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Kembali ke Daftar Event
                </Link>

                <Card>
                    <CardHeader>
                        <CardTitle>Informasi Event</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="title">Nama Event *</Label>
                                <Input
                                    id="title"
                                    value={data.title}
                                    onChange={(e) => setData('title', e.target.value)}
                                    placeholder="contoh: Gala Dinner 2026"
                                    className={errors.title ? 'border-red-500' : ''}
                                />
                                {errors.title && (
                                    <p className="text-sm text-red-500">{errors.title}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Deskripsi</Label>
                                <Textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    placeholder="Deskripsi singkat tentang event..."
                                    rows={4}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="event_date">Tanggal Event</Label>
                                    <Input
                                        id="event_date"
                                        type="date"
                                        value={data.event_date}
                                        onChange={(e) => setData('event_date', e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="locale">Bahasa Form</Label>
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

                            <div className="flex justify-end gap-4 pt-4">
                                <Link href={route('admin.events.index')}>
                                    <Button type="button" variant="outline">
                                        Batal
                                    </Button>
                                </Link>
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="bg-[#f17720] hover:bg-[#d96a1a]"
                                >
                                    {processing ? 'Menyimpan...' : 'Buat Event'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
