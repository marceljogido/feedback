import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import {
    Calendar,
    MessageSquare,
    Star,
    Plus,
    ArrowRight,
} from 'lucide-react';

interface Stats {
    totalEvents: number;
    totalResponses: number;
    avgRating: number | null;
}

interface Event {
    id: number;
    title: string;
    slug: string;
    status: 'draft' | 'active' | 'closed';
    response_count: number;
    created_at: string;
}

interface Response {
    id: number;
    event_title: string;
    name: string;
    submitted_at: string;
}

interface Props {
    stats: Stats;
    recentEvents: Event[];
    recentResponses: Response[];
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

export default function Dashboard({ stats, recentEvents, recentResponses }: Props) {
    return (
        <AdminLayout header="Dashboard">
            <Head title="Dashboard" />

            <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="border-l-4 border-l-[#11224e]">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-gray-500">
                                Total Event
                            </CardTitle>
                            <Calendar className="h-5 w-5 text-[#11224e]" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-gray-900">
                                {stats.totalEvents}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-[#f17720]">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-gray-500">
                                Total Respons
                            </CardTitle>
                            <MessageSquare className="h-5 w-5 text-[#f17720]" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-gray-900">
                                {stats.totalResponses}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-yellow-500">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-gray-500">
                                Rata-rata Rating
                            </CardTitle>
                            <Star className="h-5 w-5 text-yellow-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-gray-900">
                                {stats.avgRating ? `${stats.avgRating}/5` : '-'}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Events & Responses */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Recent Events */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Event Terbaru</CardTitle>
                            <Link href={route('admin.events.create')}>
                                <Button size="sm" className="bg-[#f17720] hover:bg-[#d96a1a]">
                                    <Plus className="h-4 w-4 mr-1" />
                                    Buat Event
                                </Button>
                            </Link>
                        </CardHeader>
                        <CardContent>
                            {recentEvents.length === 0 ? (
                                <p className="text-gray-500 text-center py-8">
                                    Belum ada event. Buat event pertama Anda!
                                </p>
                            ) : (
                                <div className="space-y-4">
                                    {recentEvents.map((event) => (
                                        <div
                                            key={event.id}
                                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <Link
                                                    href={route('admin.events.edit', event.id)}
                                                    className="font-medium text-gray-900 hover:text-[#11224e] truncate block"
                                                >
                                                    {event.title}
                                                </Link>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Badge className={statusColors[event.status]}>
                                                        {statusLabels[event.status]}
                                                    </Badge>
                                                    <span className="text-sm text-gray-500">
                                                        {event.response_count} respons
                                                    </span>
                                                </div>
                                            </div>
                                            <Link href={route('admin.events.edit', event.id)}>
                                                <ArrowRight className="h-5 w-5 text-gray-400" />
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Recent Responses */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Respons Terbaru</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {recentResponses.length === 0 ? (
                                <p className="text-gray-500 text-center py-8">
                                    Belum ada respons masuk.
                                </p>
                            ) : (
                                <div className="space-y-4">
                                    {recentResponses.map((response) => (
                                        <div
                                            key={response.id}
                                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                        >
                                            <div>
                                                <p className="font-medium text-gray-900">
                                                    {response.name}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    {response.event_title}
                                                </p>
                                            </div>
                                            <span className="text-sm text-gray-400">
                                                {response.submitted_at}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AdminLayout>
    );
}
