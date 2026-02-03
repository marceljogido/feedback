import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
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
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/Components/ui/dialog';
import { Button } from '@/Components/ui/button';
import { ArrowLeft, Eye, Star, Download, FileText } from 'lucide-react';

interface Answer {
    question: string;
    type: string;
    value: string | number | null;
}

interface Response {
    id: number;
    name: string;
    email: string | null;
    submitted_at: string;
    answers: Answer[];
}

interface Props {
    event: {
        id: number;
        title: string;
        slug: string;
    };
    responses: {
        data: Response[];
        links: any;
        current_page: number;
        last_page: number;
    };
    stats: {
        totalResponses: number;
        avgRating: number | null;
    };
}

function StarRating({ value }: { value: number }) {
    return (
        <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <Star
                    key={star}
                    className={`h-4 w-4 ${star <= value
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                        }`}
                />
            ))}
        </div>
    );
}

function AnswerDisplay({ answer }: { answer: Answer }) {
    if (answer.type === 'rating' && typeof answer.value === 'number') {
        return <StarRating value={answer.value} />;
    }

    if (answer.type === 'file' && answer.value) {
        return (
            <a
                href={`/storage/${answer.value}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-blue-600 hover:underline"
            >
                <FileText className="h-4 w-4" />
                Lihat File
            </a>
        );
    }

    return <span>{answer.value || '-'}</span>;
}

export default function Responses({ event, responses, stats }: Props) {
    return (
        <AdminLayout header={`Respons: ${event.title}`}>
            <Head title={`Respons - ${event.title}`} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <Link
                        href={route('admin.events.builder', event.id)}
                        className="inline-flex items-center text-gray-600 hover:text-gray-900"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Kembali ke Form Builder
                    </Link>

                    <Button variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Export Excel
                    </Button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-2xl font-bold">{stats.totalResponses}</div>
                            <p className="text-sm text-gray-500">Total Respons</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-2">
                                <span className="text-2xl font-bold">
                                    {stats.avgRating ?? '-'}
                                </span>
                                {stats.avgRating && <StarRating value={Math.round(stats.avgRating)} />}
                            </div>
                            <p className="text-sm text-gray-500">Rata-rata Rating</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Responses Table */}
                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nama</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Waktu Submit</TableHead>
                                    <TableHead className="text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {responses.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                                            Belum ada respons masuk.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    responses.data.map((response) => (
                                        <TableRow key={response.id}>
                                            <TableCell className="font-medium">
                                                {response.name}
                                            </TableCell>
                                            <TableCell>{response.email || '-'}</TableCell>
                                            <TableCell>{response.submitted_at}</TableCell>
                                            <TableCell className="text-right">
                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <Button variant="ghost" size="sm">
                                                            <Eye className="h-4 w-4 mr-1" />
                                                            Detail
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent className="max-w-lg">
                                                        <DialogHeader>
                                                            <DialogTitle>
                                                                Respons dari {response.name}
                                                            </DialogTitle>
                                                        </DialogHeader>
                                                        <div className="space-y-4 mt-4">
                                                            <div className="text-sm text-gray-500">
                                                                Disubmit: {response.submitted_at}
                                                            </div>
                                                            {response.answers.map((answer, index) => (
                                                                <div key={index} className="space-y-1">
                                                                    <p className="font-medium text-gray-700">
                                                                        {answer.question}
                                                                    </p>
                                                                    <div className="text-gray-900">
                                                                        <AnswerDisplay answer={answer} />
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </DialogContent>
                                                </Dialog>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Pagination */}
                {responses.last_page > 1 && (
                    <div className="flex justify-center gap-2">
                        {responses.links.map((link: any, index: number) => (
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
