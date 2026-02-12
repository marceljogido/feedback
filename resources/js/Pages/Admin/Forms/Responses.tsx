import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Card, CardContent } from '@/Components/ui/card';
import { ArrowLeft, Star, Users, Download, Mail, Calendar, MessageSquare, User, Trash2, Search, List, Table as TableIcon, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
// Actually, I'll use simple useEffect for debounce or just simple input with onKeyDown/Button
// Let's use simple input with manual trigger or simple state debounce.
// Laravel Inertia usually uses a simple pattern.

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

interface Form {
    id: number;
    name: string;
    slug: string;
}

interface Event {
    id: number;
    title: string;
}

interface Props {
    form: Form;
    event: Event;
    responses: {
        data: Response[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    stats: {
        totalResponses: number;
        avgRating: number | null;
    };
    questions: Array<{
        id: number;
        question_text: string;
        type: string;
    }>;
    filters: {
        search?: string;
    };
}

function RatingStars({ value }: { value: number }) {
    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
                <Star
                    key={star}
                    className={`h-4 w-4 transition-colors ${star <= value
                        ? 'fill-amber-400 text-amber-400'
                        : 'fill-gray-200 text-gray-200'
                        }`}
                />
            ))}
            <span className="ml-2 text-sm font-semibold text-gray-700">{value}/5</span>
        </div>
    );
}

export default function FormResponses({ form, event, responses, stats, questions, filters }: Props) {
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [viewMode, setViewMode] = useState<'list' | 'table'>('list');
    const [search, setSearch] = useState(filters.search || '');
    const [isLoading, setIsLoading] = useState(false);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (search !== (filters.search || '')) {
                setIsLoading(true);
                router.get(
                    route('admin.forms.responses', form.id),
                    { search },
                    {
                        preserveState: true,
                        preserveScroll: true,
                        replace: true,
                        only: ['responses', 'filters'],
                        onFinish: () => setIsLoading(false),
                    }
                );
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [search]);

    return (
        <AdminLayout header={`Responses: ${form.name}`}>
            <Head title={`Responses - ${form.name}`} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <Link
                        href={route('admin.events.forms', event.id)}
                        className="inline-flex items-center text-gray-500 hover:text-gray-900 transition-colors text-sm"
                    >
                        <ArrowLeft className="h-4 w-4 mr-1.5" />
                        Kembali ke Daftar Form
                    </Link>

                    {responses.data.length > 0 && (
                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    const confirmText = prompt('Ketik "DELETE" untuk menghapus SEMUA respon secara permanen:');
                                    if (confirmText === 'DELETE') {
                                        router.delete(route('admin.forms.responses.destroy-all', form.id), {
                                            preserveScroll: true,
                                        });
                                    }
                                }}
                                className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-xl text-sm font-medium transition-all shadow-sm hover:shadow-md active:scale-95"
                            >
                                <Trash2 className="h-4 w-4" />
                                Hapus Semua
                            </button>
                            <a
                                href={route('admin.forms.export-csv', form.id)}
                                className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition-all shadow-sm hover:shadow-md active:scale-95"
                            >
                                <Download className="h-4 w-4" />
                                Export CSV
                            </a>
                        </div>
                    )}
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white shadow-lg">
                        <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white/10" />
                        <div className="absolute bottom-0 right-0 -mb-8 -mr-8 h-32 w-32 rounded-full bg-white/5" />
                        <div className="relative">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                                    <Users className="h-5 w-5" />
                                </div>
                                <span className="text-blue-100 text-sm font-medium">Total Responden</span>
                            </div>
                            <p className="text-4xl font-bold tracking-tight">{stats.totalResponses}</p>
                        </div>
                    </div>

                    {stats.avgRating !== null && (
                        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 p-6 text-white shadow-lg">
                            <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white/10" />
                            <div className="absolute bottom-0 right-0 -mb-8 -mr-8 h-32 w-32 rounded-full bg-white/5" />
                            <div className="relative">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                                        <Star className="h-5 w-5" />
                                    </div>
                                    <span className="text-amber-100 text-sm font-medium">Rating Rata-rata</span>
                                </div>
                                <div className="flex items-end gap-2">
                                    <p className="text-4xl font-bold tracking-tight">{stats.avgRating}</p>
                                    <span className="text-amber-100 text-lg mb-1">/ 5</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Search and View Toggle */}
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <div className="relative w-full sm:max-w-md">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            {isLoading ? (
                                <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
                            ) : (
                                <Search className="h-4 w-4 text-gray-400" />
                            )}
                        </div>
                        <input
                            type="text"
                            placeholder="Cari respon berdasarkan nama, email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10 block w-full rounded-lg border-gray-200 bg-gray-50 text-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                    </div>

                    <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-md transition-all ${viewMode === 'list'
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'}`}
                            title="List View"
                        >
                            <List className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('table')}
                            className={`p-2 rounded-md transition-all ${viewMode === 'table'
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'}`}
                            title="Table View"
                        >
                            <TableIcon className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* Responses */}
                {responses.data.length === 0 ? (
                    <Card className="border-dashed border-2">
                        <CardContent className="py-16 text-center">
                            <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                                <MessageSquare className="h-8 w-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                Belum ada respons
                            </h3>
                            <p className="text-gray-500 text-sm max-w-sm mx-auto">
                                Bagikan link form untuk mulai mengumpulkan feedback dari responden
                            </p>
                        </CardContent>
                    </Card>
                ) : viewMode === 'table' ? (
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4 w-16 text-center whitespace-nowrap">No</th>
                                        <th className="px-6 py-4 whitespace-nowrap">Waktu</th>
                                        <th className="px-6 py-4 whitespace-nowrap">Responden</th>
                                        {questions.map((q) => (
                                            <th key={q.id} className="px-6 py-4 min-w-[200px]">
                                                {q.question_text}
                                            </th>
                                        ))}
                                        <th className="px-6 py-4 text-right whitespace-nowrap sticky right-0 bg-gray-50 shadow-[-5px_0_10px_-5px_rgba(0,0,0,0.1)]">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {responses.data.map((response, idx) => (
                                        <tr key={response.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4 text-center text-gray-500 whitespace-nowrap">
                                                {(responses.current_page - 1) * responses.per_page + idx + 1}
                                            </td>
                                            <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar className="h-3.5 w-3.5" />
                                                    {response.submitted_at}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span className="font-bold">{response.name}</span>
                                                    {response.email && (
                                                        <span className="text-xs text-gray-500">{response.email}</span>
                                                    )}
                                                </div>
                                            </td>
                                            {questions.map((q) => {
                                                const answer = response.answers.find(a => a.question === q.question_text);
                                                return (
                                                    <td key={q.id} className="px-6 py-4 text-gray-700 align-top">
                                                        {answer ? (
                                                            answer.type === 'rating' ? (
                                                                <div className="flex items-center gap-1">
                                                                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                                                                    <span>{answer.value}</span>
                                                                </div>
                                                            ) : answer.type === 'file' && answer.value ? (
                                                                <a
                                                                    href={String(answer.value)}
                                                                    target="_blank"
                                                                    className="text-blue-600 hover:text-blue-800 underline text-xs"
                                                                >
                                                                    Lihat File
                                                                </a>
                                                            ) : (
                                                                <span className="line-clamp-3" title={String(answer.value)}>{answer.value}</span>
                                                            )
                                                        ) : (
                                                            <span className="text-gray-300">-</span>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                            <td className="px-6 py-4 text-right whitespace-nowrap sticky right-0 bg-white shadow-[-5px_0_10px_-5px_rgba(0,0,0,0.1)]">
                                                <button
                                                    onClick={() => {
                                                        if (confirm('Apakah Anda yakin ingin menghapus respon ini secara permanen?')) {
                                                            router.delete(route('admin.responses.destroy', response.id), {
                                                                preserveScroll: true,
                                                            });
                                                        }
                                                    }}
                                                    className="p-2 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                                                    title="Hapus Respon"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {responses.data.map((response, idx) => (
                            <div
                                key={response.id}
                                className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
                            >
                                {/* Response Header - Always visible */}
                                <button
                                    onClick={() => setExpandedId(expandedId === response.id ? null : response.id)}
                                    className="w-full px-5 py-4 flex items-center gap-4 text-left hover:bg-gray-50/50 transition-colors"
                                >
                                    {/* Avatar */}
                                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-[#11224e] to-[#5c83c4] flex items-center justify-center text-white font-bold text-sm shadow-sm">
                                        {response.name.charAt(0).toUpperCase()}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-bold text-gray-900 truncate text-base">{response.name}</h4>
                                            <span className="flex-shrink-0 px-2 py-0.5 text-xs font-semibold bg-gray-100 text-gray-600 rounded-full">
                                                #{(responses.current_page - 1) * responses.per_page + idx + 1}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 mt-0.5">
                                            {response.email && (
                                                <span className="flex items-center gap-1.5 text-sm text-gray-500">
                                                    <Mail className="h-3.5 w-3.5" />
                                                    {response.email}
                                                </span>
                                            )}
                                            <span className="flex items-center gap-1.5 text-sm text-gray-500">
                                                <Calendar className="h-3.5 w-3.5" />
                                                {response.submitted_at}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Expand icon */}
                                    <svg
                                        className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${expandedId === response.id ? 'rotate-180' : ''}`}
                                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                {/* Answers - Expandable */}
                                <div className={`transition-all duration-300 ease-in-out overflow-hidden ${expandedId === response.id ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
                                    }`}>
                                    <div className="px-5 pb-5 pt-1">
                                        <div className="bg-gray-50 rounded-xl p-4 space-y-4">
                                            {response.answers.map((answer, index) => (
                                                <div key={index} className="flex flex-col gap-1.5">
                                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                                        {answer.question}
                                                    </span>
                                                    <div className="text-base text-gray-900 font-medium">
                                                        {answer.type === 'rating' ? (
                                                            <RatingStars value={Number(answer.value) || 0} />
                                                        ) : answer.type === 'file' && answer.value ? (
                                                            <a
                                                                href={String(answer.value)}
                                                                target="_blank"
                                                                className="text-blue-600 hover:text-blue-800 underline underline-offset-2"
                                                            >
                                                                📎 Lihat File
                                                            </a>
                                                        ) : (
                                                            <span className="leading-relaxed">{answer.value || <span className="text-gray-400 italic">—</span>}</span>
                                                        )}
                                                    </div>
                                                    {index < response.answers.length - 1 && (
                                                        <div className="border-b border-gray-200/60 mt-2" />
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                        <div className="mt-4 flex justify-end">
                                            <button
                                                onClick={() => {
                                                    if (confirm('Apakah Anda yakin ingin menghapus respon ini secara permanen?')) {
                                                        router.delete(route('admin.responses.destroy', response.id), {
                                                            preserveScroll: true,
                                                        });
                                                    }
                                                }}
                                                className="text-red-500 hover:text-red-700 text-sm font-medium flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                                Hapus Respon
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {responses.last_page > 1 && (
                    <div className="flex justify-center items-center gap-1.5 pt-2">
                        {Array.from({ length: responses.last_page }, (_, i) => i + 1).map((page) => (
                            <Link
                                key={page}
                                href={route('admin.forms.responses', { form: form.id, page })}
                                className={`w-9 h-9 flex items-center justify-center rounded-xl text-sm font-medium transition-all duration-200 ${page === responses.current_page
                                    ? 'bg-[#11224e] text-white shadow-md shadow-[#11224e]/30'
                                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                                    }`}
                            >
                                {page}
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
