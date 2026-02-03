import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router } from '@inertiajs/react';
import { Card, CardContent } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Badge } from '@/Components/ui/badge';
import { Switch } from '@/Components/ui/switch';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/Components/ui/select';
import {
    ArrowLeft,
    Plus,
    Trash2,
    GripVertical,
    Copy,
    ExternalLink,
    Save,
} from 'lucide-react';
import { Link } from '@inertiajs/react';
import { useState } from 'react';

interface Question {
    id?: number;
    question_text: string;
    question_text_en: string;
    type: 'text' | 'textarea' | 'rating' | 'file' | 'multiple_choice';
    is_required: boolean;
    options: string[] | null;
    sort_order: number;
}

interface Event {
    id: number;
    title: string;
    slug: string;
    status: 'draft' | 'active' | 'closed';
    public_url: string;
}

interface Props {
    event: Event;
    questions: Question[];
}

const questionTypes = [
    { value: 'text', label: 'Teks Singkat' },
    { value: 'textarea', label: 'Paragraf' },
    { value: 'rating', label: 'Rating Bintang' },
    { value: 'file', label: 'Upload File' },
    { value: 'multiple_choice', label: 'Pilihan Ganda' },
];

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

export default function FormBuilder({ event, questions: initialQuestions }: Props) {
    const [questions, setQuestions] = useState<Question[]>(initialQuestions);
    const [saving, setSaving] = useState(false);

    const addQuestion = () => {
        const newQuestion: Question = {
            question_text: '',
            question_text_en: '',
            type: 'text',
            is_required: false,
            options: null,
            sort_order: questions.length,
        };
        setQuestions([...questions, newQuestion]);
    };

    const updateQuestion = (index: number, field: keyof Question, value: any) => {
        const updated = [...questions];
        updated[index] = { ...updated[index], [field]: value };
        setQuestions(updated);
    };

    const removeQuestion = (index: number) => {
        setQuestions(questions.filter((_, i) => i !== index));
    };

    const saveQuestions = () => {
        setSaving(true);
        router.post(
            route('admin.events.questions.save', event.id),
            { questions: questions.map((q, i) => ({ ...q, sort_order: i })) },
            {
                onFinish: () => setSaving(false),
                preserveScroll: true,
            }
        );
    };

    const toggleStatus = () => {
        router.post(route('admin.events.toggle-status', event.id), {}, {
            preserveScroll: true,
        });
    };

    const copyLink = () => {
        navigator.clipboard.writeText(event.public_url);
    };

    return (
        <AdminLayout header={`Membangun Form: ${event.title}`}>
            <Head title={`Builder ${event.title}`} />

            <div className="space-y-6">
                {/* Header with actions */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <Link
                        href={route('admin.forms.index')}
                        className="inline-flex items-center text-gray-600 hover:text-gray-900"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Kembali ke Daftar Form
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
                            {event.status === 'active' ? 'Tutup Form' : 'Aktifkan Form'}
                        </Button>
                    </div>
                </div>

                <div className="space-y-4">
                    {/* Questions List */}
                    {questions.map((question, index) => (
                        <Card key={index} className="relative">
                            <CardContent className="pt-6">
                                <div className="absolute left-2 top-1/2 -translate-y-1/2 cursor-grab">
                                    <GripVertical className="h-5 w-5 text-gray-400" />
                                </div>
                                <div className="pl-6 space-y-4">
                                    <div className="flex gap-4">
                                        <div className="flex-1 space-y-2">
                                            <Label>Pertanyaan (ID)</Label>
                                            <Input
                                                value={question.question_text}
                                                onChange={(e) => updateQuestion(index, 'question_text', e.target.value)}
                                                placeholder="Tulis pertanyaan dalam Bahasa Indonesia..."
                                            />
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            <Label>Pertanyaan (EN)</Label>
                                            <Input
                                                value={question.question_text_en || ''}
                                                onChange={(e) => updateQuestion(index, 'question_text_en', e.target.value)}
                                                placeholder="Write question in English..."
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="w-48">
                                            <Label>Tipe</Label>
                                            <Select
                                                value={question.type}
                                                onValueChange={(value) => updateQuestion(index, 'type', value)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {questionTypes.map((type) => (
                                                        <SelectItem key={type.value} value={type.value}>
                                                            {type.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="flex items-center gap-2 pt-6">
                                            <Switch
                                                checked={question.is_required}
                                                onCheckedChange={(checked) => updateQuestion(index, 'is_required', checked)}
                                            />
                                            <Label>Wajib diisi</Label>
                                        </div>

                                        <div className="flex-1" />

                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                            onClick={() => removeQuestion(index)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    {question.type === 'multiple_choice' && (
                                        <div className="space-y-2">
                                            <Label>Pilihan (pisahkan dengan koma)</Label>
                                            <Input
                                                value={question.options?.join(', ') || ''}
                                                onChange={(e) => updateQuestion(index, 'options', e.target.value.split(',').map(s => s.trim()))}
                                                placeholder="Pilihan 1, Pilihan 2, Pilihan 3"
                                            />
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {questions.length === 0 && (
                        <Card>
                            <CardContent className="py-12 text-center text-gray-500">
                                Belum ada pertanyaan. Klik tombol di bawah untuk menambahkan.
                            </CardContent>
                        </Card>
                    )}

                    <div className="flex gap-4">
                        <Button variant="outline" onClick={addQuestion}>
                            <Plus className="h-4 w-4 mr-2" />
                            Tambah Pertanyaan
                        </Button>

                        <Button
                            onClick={saveQuestions}
                            disabled={saving}
                            className="bg-[#11224e] hover:bg-[#1a3366]"
                        >
                            <Save className="h-4 w-4 mr-2" />
                            {saving ? 'Menyimpan...' : 'Simpan Pertanyaan'}
                        </Button>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
