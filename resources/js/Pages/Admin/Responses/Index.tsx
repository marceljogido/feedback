import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link } from '@inertiajs/react';
import { Card, CardContent } from '@/Components/ui/card';
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
import { Eye, Star, FileText } from 'lucide-react';

interface Answer {
    question: string;
    type: string;
    value: string | number | null;
}

interface Respondent {
    id: number;
    event_title: string;
    name: string;
    email: string | null;
    submitted_at: string;
    answers: Answer[];
}

interface Props {
    respondents: {
        data: Respondent[];
        links: any;
        current_page: number;
        last_page: number;
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

export default function ResponsesIndex({ respondents }: Props) {
    return (
        <AdminLayout header="Semua Respons">
            <Head title="Semua Respons" />

            <div className="space-y-6">
                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Event</TableHead>
                                    <TableHead>Nama Respondent</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Waktu Submit</TableHead>
                                    <TableHead className="text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {respondents.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                                            Belum ada respons masuk.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    respondents.data.map((respondent) => (
                                        <TableRow key={respondent.id}>
                                            <TableCell className="font-medium text-gray-900">
                                                {respondent.event_title}
                                            </TableCell>
                                            <TableCell>
                                                {respondent.name}
                                            </TableCell>
                                            <TableCell>{respondent.email || '-'}</TableCell>
                                            <TableCell>{respondent.submitted_at}</TableCell>
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
                                                                Respons dari {respondent.name}
                                                            </DialogTitle>
                                                        </DialogHeader>
                                                        <div className="space-y-4 mt-4 max-h-[60vh] overflow-y-auto pr-2">
                                                            <div className="text-sm text-gray-500 pb-2 border-b">
                                                                <p>Event: <span className="font-medium text-gray-900">{respondent.event_title}</span></p>
                                                                <p>Waktu: {respondent.submitted_at}</p>
                                                                {respondent.email && <p>Email: {respondent.email}</p>}
                                                            </div>
                                                            {respondent.answers.map((answer, index) => (
                                                                <div key={index} className="space-y-1">
                                                                    <p className="font-medium text-gray-700 text-sm">
                                                                        {answer.question}
                                                                    </p>
                                                                    <div className="text-gray-900 text-sm">
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
                {respondents.last_page > 1 && (
                    <div className="flex justify-center gap-2">
                        {respondents.links.map((link: any, index: number) => (
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
