import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Textarea } from '@/Components/ui/textarea';
import { Label } from '@/Components/ui/label';
import { ArrowLeft } from 'lucide-react';
import { Link } from '@inertiajs/react';

interface Event {
    id: number;
    title: string;
}

interface Props {
    event: Event;
}

export default function CreateForm({ event }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        description: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('admin.events.forms.store', event.id));
    };

    return (
        <AdminLayout header="Buat Form Baru">
            <Head title="Buat Form Baru" />

            <div className="max-w-2xl mx-auto">
                <Link
                    href={route('admin.events.forms', event.id)}
                    className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Kembali ke Daftar Form
                </Link>

                <Card>
                    <CardHeader>
                        <CardTitle>Form untuk: {event.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nama Form *</Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="contoh: Feedback Expo, Feedback Seminar"
                                    className={errors.name ? 'border-red-500' : ''}
                                />
                                {errors.name && (
                                    <p className="text-sm text-red-500">{errors.name}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Deskripsi</Label>
                                <Textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    placeholder="Deskripsi singkat tentang form ini..."
                                    rows={4}
                                />
                            </div>

                            <div className="flex justify-end gap-4 pt-4">
                                <Link href={route('admin.events.forms', event.id)}>
                                    <Button type="button" variant="outline">
                                        Batal
                                    </Button>
                                </Link>
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="bg-[#f17720] hover:bg-[#d96a1a]"
                                >
                                    {processing ? 'Menyimpan...' : 'Buat Form'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
