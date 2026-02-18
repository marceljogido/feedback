import React from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Textarea } from '@/Components/ui/textarea';
import { Label } from '@/Components/ui/label';
import { Badge } from '@/Components/ui/badge';
import { Switch } from '@/Components/ui/switch';
import { Card, CardContent } from '@/Components/ui/card';
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
    Pencil,
    X,
    Star,
    Upload,
    Globe,
    Check,
    Settings,
    Image as ImageIcon,
    Type,
    AlignLeft,
    List,
    CheckSquare,
    Mail,
    Phone,
    ChevronsUpDown,
    Calendar,
    Gauge,
    Clock,
} from 'lucide-react';
import { Link } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Question {
    id: number | null;
    question_text: string;
    question_text_en: string | null;
    description: string | null;
    description_en: string | null;
    image: string | null;
    type: QuestionType;
    is_required: boolean;
    options: (string | Option)[] | null;
    sort_order: number;
}

interface Option {
    text: string;
    text_en: string | null;
    image: string | null; // using 'image' to match Question interface consistently
}

type QuestionType = 'text' | 'textarea' | 'rating' | 'file' | 'multiple_choice' | 'dropdown' | 'checkbox' | 'email' | 'number' | 'date' | 'time' | 'linear_scale';

interface Form {
    id: number;
    name: string;
    slug: string;
    status: 'draft' | 'active' | 'closed';
    public_url: string;
    collect_name: boolean;
    collect_email: boolean;
    name_label: string | null;
    email_label: string | null;
    respondent_fields: { key: string; label: string; type: 'text' | 'email'; enabled: boolean; required: boolean }[];
    banner_image: string | null;
    logo_image: string | null;
    title: string | null;
    description: string | null;
}

interface Event {
    id: number;
    title: string;
    description: string | null;
    logo_image: string | null;
    banner_image: string | null;
    theme_config: {
        custom_labels?: {
            name?: string;
            name_en?: string;
            email?: string;
            email_en?: string;
        };
    } | null;
}

interface Props {
    form: Form;
    event: Event;
    questions: Question[];
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

const questionTypes = [
    { id: 'text', value: 'text', label: 'Ketik Jawaban', icon: Type, description: 'Satu baris (Nama, Jabatan, dll)' },
    { id: 'textarea', value: 'textarea', label: 'Ketik Ulasan', icon: AlignLeft, description: 'Banyak baris (Saran, Kritik, Cerita)' },
    { id: 'email', value: 'email', label: 'Email', icon: Mail, description: 'Input email dengan validasi' },
    { id: 'number', value: 'number', label: 'Nomor HP / Angka', icon: Phone, description: 'Input khusus angka/nomor' },
    { id: 'rating', value: 'rating', label: 'Rating (1-5)', icon: Star, description: 'Skala bintang 1-5' },
    { id: 'multiple_choice', value: 'multiple_choice', label: 'Pilihan Ganda', icon: List, description: 'Pilih satu dari opsi' },
    { id: 'checkbox', value: 'checkbox', label: 'Kotak Centang', icon: CheckSquare, description: 'Pilih beberapa dari opsi' },
    { id: 'dropdown', value: 'dropdown', label: 'Dropdown', icon: ChevronsUpDown, description: 'Pilih satu dari menu dropdown' },
    { id: 'date', value: 'date', label: 'Tanggal', icon: Calendar, description: 'Input pilih tanggal' },
    { id: 'time', value: 'time', label: 'Waktu', icon: Clock, description: 'Input pilih jam/waktu' },
    { id: 'linear_scale', value: 'linear_scale', label: 'Skala Linear', icon: Gauge, description: 'Skala angka dengan label' },
    { id: 'file', value: 'file', label: 'Upload File', icon: Upload, description: 'Upload file / gambar' },
] as const;

// Star Rating Preview Component
function StarRatingPreview() {
    return (
        <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} className="h-8 w-8 text-gray-300" />
            ))}
        </div>
    );
}

function normalizeOptions(options: (string | Option)[] | null): Option[] {
    if (!options) return [];
    return options.map(opt => {
        if (typeof opt === 'string') return { text: opt, text_en: null, image: null };
        return opt;
    });
}

// Question Editor Modal
function QuestionEditor({
    question,
    onSave,
    onCancel,
}: {
    question: Question;
    onSave: (q: Question) => void;
    onCancel: () => void;
}) {
    const [localQuestion, setLocalQuestion] = useState<Question>(question);
    const [isUploading, setIsUploading] = useState(false);
    const [optionUploading, setOptionUploading] = useState<number | null>(null);

    // Initialize options if null
    useEffect(() => {
        if (!localQuestion.options) {
            handleUpdate('options', []);
        }
    }, []);

    const handleUpdate = (field: keyof Question, value: any) => {
        setLocalQuestion(prev => ({ ...prev, [field]: value }));
    };

    const handleOptionImageUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setOptionUploading(index);
        const formData = new FormData();
        formData.append('image', file);

        try {
            const response = await axios.post(route('admin.forms.upload-question-image'), formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.data.success) {
                const currentOptions = normalizeOptions(localQuestion.options);
                currentOptions[index].image = response.data.path;
                handleUpdate('options', currentOptions);
            } else {
                alert('Upload gagal: ' + (response.data.message || 'Unknown error'));
            }
        } catch (error: any) {
            console.error('Option upload failed:', error);
            const message = error.response?.data?.message || error.message || 'Unknown error';
            alert(`Gagal upload gambar opsi: ${message}`);
        } finally {
            setOptionUploading(null);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('image', file);

        try {
            const response = await axios.post(route('admin.forms.upload-question-image'), formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.data.success) {
                handleUpdate('image', response.data.path);
            } else {
                alert('Upload gagal: ' + (response.data.message || 'Unknown error'));
            }
        } catch (error: any) {
            console.error('Upload failed:', error);
            const message = error.response?.data?.message || error.message || 'Unknown error';
            alert(`Gagal upload gambar: ${message}`);
        } finally {
            setIsUploading(false);
        }
    };

    const removeImage = () => {
        handleUpdate('image', null);
    };

    const getImageUrl = (path: string | null) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        return `/storage/${path}`;
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b flex items-center justify-between">
                    <h3 className="text-lg font-semibold">✏️ Edit Pertanyaan</h3>
                    <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    {/* Image Upload Section */}
                    <div className="space-y-2">
                        <Label>📷 Gambar Pertanyaan (Opsional)</Label>
                        {localQuestion.image ? (
                            <div className="relative">
                                <img
                                    src={getImageUrl(localQuestion.image) || ''}
                                    alt="Question image"
                                    className="w-full h-40 object-contain rounded-lg border bg-gray-50"
                                />
                                <button
                                    onClick={removeImage}
                                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        ) : (
                            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    {isUploading ? (
                                        <p className="text-sm text-gray-500">Mengupload...</p>
                                    ) : (
                                        <>
                                            <Upload className="h-8 w-8 text-gray-400 mb-2" />
                                            <p className="text-sm text-gray-500">Klik untuk upload gambar</p>
                                            <p className="text-xs text-gray-400">PNG, JPG, GIF (max 5MB)</p>
                                            <p className="text-xs text-blue-500 mt-1">Saran: Landscape, min 800px lebar</p>
                                        </>
                                    )}
                                </div>
                                <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    disabled={isUploading}
                                />
                            </label>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label>Pertanyaan (Indonesia) *</Label>
                        <Input
                            value={localQuestion.question_text}
                            onChange={(e) => handleUpdate('question_text', e.target.value)}
                            placeholder="Masukkan pertanyaan..."
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Pertanyaan (English) - Opsional</Label>
                        <Input
                            value={localQuestion.question_text_en || ''}
                            onChange={(e) => handleUpdate('question_text_en', e.target.value)}
                            placeholder="Enter question in English..."
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Deskripsi (Indonesia) - Opsional</Label>
                        <Input
                            value={localQuestion.description || ''}
                            onChange={(e) => handleUpdate('description', e.target.value)}
                            placeholder="Tambahkan deskripsi/penjelasan..."
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Deskripsi (English) - Opsional</Label>
                        <Input
                            value={localQuestion.description_en || ''}
                            onChange={(e) => handleUpdate('description_en', e.target.value)}
                            placeholder="Add description in English..."
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Tipe Jawaban</Label>
                        <Select
                            value={localQuestion.type}
                            onValueChange={(value) => handleUpdate('type', value)}
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

                    <div className="flex items-center space-x-2">
                        <Switch
                            checked={localQuestion.is_required}
                            onCheckedChange={(checked) => handleUpdate('is_required', checked)}
                        />
                        <Label>Wajib diisi</Label>
                    </div>

                    {localQuestion.type === 'linear_scale' && (
                        <div className="space-y-3 p-3 bg-gray-50 rounded-lg border">
                            <Label className="text-sm font-medium">Pengaturan Skala</Label>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label className="text-xs text-gray-500">Nilai Minimum</Label>
                                    <Select
                                        value={String((localQuestion.options as any)?.min ?? 1)}
                                        onValueChange={(v) => {
                                            const opts = (localQuestion.options as any) || {};
                                            handleUpdate('options', { ...opts, min: parseInt(v) });
                                        }}
                                    >
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="0">0</SelectItem>
                                            <SelectItem value="1">1</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs text-gray-500">Nilai Maksimum</Label>
                                    <Select
                                        value={String((localQuestion.options as any)?.max ?? 5)}
                                        onValueChange={(v) => {
                                            const opts = (localQuestion.options as any) || {};
                                            handleUpdate('options', { ...opts, max: parseInt(v) });
                                        }}
                                    >
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {[2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                                                <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="space-y-1">
                                    <Label className="text-xs text-gray-500">Label Minimum (opsional)</Label>
                                    <Input
                                        value={(localQuestion.options as any)?.min_label || ''}
                                        onChange={(e) => {
                                            const opts = (localQuestion.options as any) || {};
                                            handleUpdate('options', { ...opts, min_label: e.target.value });
                                        }}
                                        placeholder="Contoh: Sangat Tidak Setuju"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs text-gray-500">Label Maksimum (opsional)</Label>
                                    <Input
                                        value={(localQuestion.options as any)?.max_label || ''}
                                        onChange={(e) => {
                                            const opts = (localQuestion.options as any) || {};
                                            handleUpdate('options', { ...opts, max_label: e.target.value });
                                        }}
                                        placeholder="Contoh: Sangat Setuju"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {localQuestion.type === 'multiple_choice' && (
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <Label>Opsi Jawaban</Label>
                                <span className="text-xs text-blue-500">Saran gambar: Persegi/Landscape, min 500px lebar</span>
                            </div>
                            <div className="space-y-2">
                                {normalizeOptions(localQuestion.options).map((option, index) => (
                                    <div key={index} className="flex flex-col gap-2 p-3 bg-gray-50 rounded-lg border">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-gray-500 w-6">{index + 1}.</span>
                                            <Input
                                                value={option.text}
                                                onChange={(e) => {
                                                    const newOptions = normalizeOptions(localQuestion.options);
                                                    newOptions[index].text = e.target.value;
                                                    handleUpdate('options', newOptions);
                                                }}
                                                placeholder={`Opsi ${index + 1}`}
                                                className="flex-1"
                                            />

                                            {/* Image Upload Button */}
                                            <label className="cursor-pointer p-2 hover:bg-gray-200 rounded-md" title="Upload Gambar Opsi">
                                                <input
                                                    type="file"
                                                    className="hidden"
                                                    accept="image/*"
                                                    onChange={(e) => handleOptionImageUpload(index, e)}
                                                    disabled={optionUploading === index}
                                                />
                                                {optionUploading === index ? (
                                                    <span className="animate-spin">⌛</span>
                                                ) : (
                                                    <Upload className={`h-4 w-4 ${option.image ? 'text-green-600' : 'text-gray-400'}`} />
                                                )}
                                            </label>

                                            <button
                                                onClick={() => {
                                                    const newOptions = normalizeOptions(localQuestion.options).filter((_, i) => i !== index);
                                                    handleUpdate('options', newOptions);
                                                }}
                                                className="p-2 text-red-500 hover:bg-red-50 rounded-md"
                                                title="Hapus Opsi"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>

                                        {/* Option Image Preview */}
                                        {option.image && (
                                            <div className="ml-8 relative w-24 h-24">
                                                <img
                                                    src={getImageUrl(option.image) || ''}
                                                    alt="Option"
                                                    className="w-full h-full object-contain rounded-md border bg-white"
                                                />
                                                <button
                                                    onClick={() => {
                                                        const newOptions = normalizeOptions(localQuestion.options);
                                                        newOptions[index].image = null;
                                                        handleUpdate('options', newOptions);
                                                    }}
                                                    className="absolute -top-1 -right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-sm"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    const newOptions = normalizeOptions(localQuestion.options);
                                    newOptions.push({ text: '', text_en: null, image: null });
                                    handleUpdate('options', newOptions);
                                }}
                                className="w-full"
                            >
                                + Tambah Opsi
                            </Button>
                        </div>
                    )}
                </div>

                <div className="p-6 border-t flex justify-end gap-3">
                    <Button variant="outline" onClick={onCancel}>
                        Batal
                    </Button>
                    <Button
                        onClick={() => onSave(localQuestion)}
                        className="bg-[#f17720] hover:bg-[#d96a1a]"
                    >
                        <Check className="h-4 w-4 mr-2" />
                        Simpan Pertanyaan
                    </Button>
                </div>
            </div>
        </div>
    );
}

// Sortable Preview Question Card
function SortablePreviewQuestion({
    question,
    index,
    onEdit,
    onDelete,
}: {
    question: Question;
    index: number;
    onEdit: () => void;
    onDelete: () => void;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: question.id || `new-${index}` });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style}>
            <Card className="group relative hover:ring-2 hover:ring-[#f17720] transition-all">
                {/* Edit/Delete overlay on hover */}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <button
                        {...attributes}
                        {...listeners}
                        className="p-2 bg-white rounded-md shadow hover:bg-gray-50 cursor-grab active:cursor-grabbing"
                        title="Seret untuk mengubah urutan"
                    >
                        <GripVertical className="h-4 w-4 text-gray-400" />
                    </button>
                    <button
                        onClick={onEdit}
                        className="p-2 bg-white rounded-md shadow hover:bg-blue-50"
                        title="Edit pertanyaan"
                    >
                        <Pencil className="h-4 w-4 text-blue-600" />
                    </button>
                    <button
                        onClick={onDelete}
                        className="p-2 bg-white rounded-md shadow hover:bg-red-50"
                        title="Hapus pertanyaan"
                    >
                        <Trash2 className="h-4 w-4 text-red-600" />
                    </button>
                </div>

                <CardContent className="pt-6">
                    <div className="space-y-3">
                        {/* Show image if exists */}
                        {question.image && (
                            <img
                                src={question.image.startsWith('http') ? question.image : `/storage/${question.image}`}
                                alt="Question image"
                                className="w-full h-auto max-h-48 object-contain rounded-lg bg-gray-50"
                            />
                        )}

                        <Label className="text-base">
                            {question.question_text || 'Pertanyaan baru...'}
                            {question.is_required && (
                                <span className="text-red-500 ml-1">*</span>
                            )}
                        </Label>

                        {question.description && (
                            <p className="text-sm text-gray-500">{question.description}</p>
                        )}

                        {/* Preview based on type */}
                        {question.type === 'text' && (
                            <Input disabled placeholder="Ketik jawaban di sini..." />
                        )}

                        {question.type === 'textarea' && (
                            <Textarea disabled placeholder="Ketik ulasan di sini..." rows={3} />
                        )}

                        {question.type === 'rating' && <StarRatingPreview />}

                        {question.type === 'file' && (
                            <div className="border-2 border-dashed rounded-lg p-6 text-center bg-gray-50">
                                <Upload className="h-8 w-8 mx-auto text-gray-400" />
                                <p className="text-sm text-gray-500 mt-2">Upload file</p>
                            </div>
                        )}

                        {question.type === 'multiple_choice' && question.options && (
                            <div className="space-y-2">
                                {normalizeOptions(question.options).map((option, i) => (
                                    <label
                                        key={i}
                                        className={`flex gap-3 p-3 rounded-lg border bg-gray-50 ${option.image ? 'items-start' : 'items-center'}`}
                                    >
                                        <input
                                            type="radio"
                                            name={`preview_${index}`}
                                            disabled
                                            className="h-4 w-4 mt-1"
                                        />
                                        <div className="flex-1">
                                            {option.image && (
                                                <img
                                                    src={option.image.startsWith('http') ? option.image : `/storage/${option.image}`}
                                                    alt="Option"
                                                    className="w-24 h-24 object-contain rounded-md border mb-2 bg-white"
                                                />
                                            )}
                                            <span className="text-gray-600 relative top-[-2px]">{option.text}</span>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        )}

                        {question.type === 'checkbox' && question.options && (
                            <div className="space-y-2">
                                {normalizeOptions(question.options).map((option, i) => (
                                    <label
                                        key={i}
                                        className={`flex gap-3 p-3 rounded-lg border bg-gray-50 ${option.image ? 'items-start' : 'items-center'}`}
                                    >
                                        <input
                                            type="checkbox"
                                            disabled
                                            className="h-4 w-4 mt-1 rounded"
                                        />
                                        <div className="flex-1">
                                            {option.image && (
                                                <img
                                                    src={option.image.startsWith('http') ? option.image : `/storage/${option.image}`}
                                                    alt="Option"
                                                    className="w-24 h-24 object-contain rounded-md border mb-2 bg-white"
                                                />
                                            )}
                                            <span className="text-gray-600 relative top-[-2px]">{option.text}</span>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        )}

                        {question.type === 'dropdown' && question.options && (
                            <div>
                                <select
                                    disabled
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-400 text-sm"
                                >
                                    <option value="">Pilih jawaban...</option>
                                    {normalizeOptions(question.options).map((option, i) => (
                                        <option key={i} value={option.text}>{option.text}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {question.type === 'date' && (
                            <Input type="date" disabled className="bg-gray-50 text-gray-400" />
                        )}

                        {question.type === 'time' && (
                            <Input type="time" disabled className="bg-gray-50 text-gray-400" />
                        )}

                        {question.type === 'linear_scale' && (() => {
                            const opts = (question.options as any) || {};
                            const min = opts.min ?? 1;
                            const max = opts.max ?? 5;
                            return (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between gap-1 flex-wrap">
                                        {Array.from({ length: max - min + 1 }, (_, i) => min + i).map((n) => (
                                            <button
                                                key={n}
                                                disabled
                                                className="w-10 h-10 rounded-full border border-gray-300 bg-gray-50 text-gray-400 text-sm font-medium"
                                            >
                                                {n}
                                            </button>
                                        ))}
                                    </div>
                                    {(opts.min_label || opts.max_label) && (
                                        <div className="flex justify-between text-xs text-gray-400">
                                            <span>{opts.min_label || ''}</span>
                                            <span>{opts.max_label || ''}</span>
                                        </div>
                                    )}
                                </div>
                            );
                        })()}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default function FormBuilder({ form, event, questions: initialQuestions }: Props) {
    const [questions, setQuestions] = useState<Question[]>(initialQuestions);
    const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');

    // Form Customization State
    const [formBanner, setFormBanner] = useState<string | null>(form.banner_image);
    const [formLogo, setFormLogo] = useState<string | null>(form.logo_image);
    const [formTitle, setFormTitle] = useState<string>(form.title || '');
    const [formDescription, setFormDescription] = useState<string>(form.description || '');
    const [isEditingHeader, setIsEditingHeader] = useState(false);
    const [isUploadingBanner, setIsUploadingBanner] = useState(false);
    const [isUploadingLogo, setIsUploadingLogo] = useState(false);

    // Refs for file inputs
    const bannerInputRef = React.useRef<HTMLInputElement>(null);
    const logoInputRef = React.useRef<HTMLInputElement>(null);

    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Dynamic Respondent Fields
    interface RespondentField {
        key: string;
        label: string;
        type: 'text' | 'email' | 'number';
        enabled: boolean;
        required: boolean;
    }

    const [respondentFields, setRespondentFields] = useState<RespondentField[]>(
        form.respondent_fields?.length > 0
            ? form.respondent_fields
            : []
    );
    const fieldsSaveTimerRef = React.useRef<NodeJS.Timeout | null>(null);
    const questionsSaveTimerRef = React.useRef<NodeJS.Timeout | null>(null);
    const [lastSavedQuestions, setLastSavedQuestions] = useState<string>(JSON.stringify(initialQuestions));
    const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');

    const saveRespondentFields = async (fields: RespondentField[]) => {
        try {
            await fetch(route('admin.forms.update-collect-settings', form.id), {
                method: 'POST',
                body: JSON.stringify({ respondent_fields: fields }),
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });
        } catch (error) {
            console.error('Failed to save respondent fields:', error);
        }
    };

    const saveRespondentFieldsDebounced = (fields: RespondentField[]) => {
        if (fieldsSaveTimerRef.current) clearTimeout(fieldsSaveTimerRef.current);
        fieldsSaveTimerRef.current = setTimeout(() => saveRespondentFields(fields), 800);
    };

    const addRespondentField = () => {
        const newField: RespondentField = {
            key: `field_${Date.now()}`,
            label: '',
            type: 'text',
            enabled: true,
            required: true,
        };
        const updated = [...respondentFields, newField];
        setRespondentFields(updated);
        saveRespondentFields(updated);
    };

    const removeRespondentField = (index: number) => {
        const updated = respondentFields.filter((_, i) => i !== index);
        setRespondentFields(updated);
        saveRespondentFields(updated);
    };

    const updateRespondentField = (index: number, changes: Partial<RespondentField>) => {
        const updated = [...respondentFields];
        updated[index] = { ...updated[index], ...changes };
        setRespondentFields(updated);
        saveRespondentFieldsDebounced(updated);
    };

    const toggleRespondentField = (index: number) => {
        const updated = [...respondentFields];
        updated[index] = { ...updated[index], enabled: !updated[index].enabled };
        setRespondentFields(updated);
        saveRespondentFields(updated);
    };

    // Banner Upload Handler
    const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploadingBanner(true);
        const formData = new FormData();
        formData.append('image', file);

        try {
            const response = await fetch(route('admin.forms.upload-banner', form.id), {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });
            const data = await response.json();
            if (data.success) {
                setFormBanner(data.url);
            }
        } catch (error) {
            console.error('Banner upload failed:', error);
        } finally {
            setIsUploadingBanner(false);
        }
    };

    // Logo Upload Handler
    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploadingLogo(true);
        const formData = new FormData();
        formData.append('image', file);

        try {
            const response = await fetch(route('admin.forms.upload-logo', form.id), {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });
            const data = await response.json();
            if (data.success) {
                setFormLogo(data.url);
            }
        } catch (error) {
            console.error('Logo upload failed:', error);
        } finally {
            setIsUploadingLogo(false);
        }
    };

    // Save Header Changes
    const saveHeaderChanges = async () => {
        try {
            const response = await fetch(route('admin.forms.update-header', form.id), {
                method: 'POST',
                body: JSON.stringify({
                    title: formTitle || null,
                    description: formDescription || null,
                }),
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });
            const data = await response.json();
            if (data.success) {
                setIsEditingHeader(false);
            }
        } catch (error) {
            console.error('Header update failed:', error);
        }
    };

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            setQuestions((items) => {
                const oldIndex = items.findIndex((q, i) => (q.id || `new-${i}`) === active.id);
                const newIndex = items.findIndex((q, i) => (q.id || `new-${i}`) === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const addQuestion = () => {
        setIsDialogOpen(true);
        setEditingIndex(null);
    };

    const handleAddQuestion = (type: QuestionType) => {
        const newQuestion: Question = {
            id: null,
            question_text: '',
            question_text_en: null,
            description: null,
            description_en: null,
            image: null,
            type: type,
            is_required: false,
            options: null,
            sort_order: questions.length,
        };
        setQuestions([...questions, newQuestion]);
        setEditingIndex(questions.length);
    };

    const updateQuestion = (index: number, updatedQuestion: Question) => {
        const updated = [...questions];
        updated[index] = updatedQuestion;
        setQuestions(updated);
        // Automatically close editing mode after save
        setEditingIndex(null);
    };

    const updateQuestionField = (index: number, field: keyof Question, value: any) => {
        const updated = [...questions];
        updated[index] = { ...updated[index], [field]: value };
        setQuestions(updated);
    };

    const deleteQuestion = (index: number) => {
        if (confirm('Hapus pertanyaan ini?')) {
            setQuestions(questions.filter((_, i) => i !== index));
        }
    };

    const saveQuestions = React.useCallback(() => {
        setSaveStatus('saving');
        const sortedQuestions = questions.map((q, i) => ({ ...q, sort_order: i }));

        router.post(route('admin.forms.questions.save', form.id), {
            questions: sortedQuestions,
        } as any, {
            preserveScroll: true,
            onFinish: () => {
                setSaveStatus('saved');
                setLastSavedQuestions(JSON.stringify(questions));
            },
            onError: () => setSaveStatus('error'),
        });
    }, [questions, form.id]);

    // Auto-save logic for questions
    React.useEffect(() => {
        const currentQuestionsStr = JSON.stringify(questions);
        if (currentQuestionsStr !== lastSavedQuestions) {
            if (questionsSaveTimerRef.current) {
                clearTimeout(questionsSaveTimerRef.current);
            }

            setSaveStatus('saving');
            questionsSaveTimerRef.current = setTimeout(() => {
                saveQuestions();
            }, 2000); // 2 seconds debounce
        }

        return () => {
            if (questionsSaveTimerRef.current) {
                clearTimeout(questionsSaveTimerRef.current);
            }
        };
    }, [questions, lastSavedQuestions, saveQuestions]);

    // Helper functions for Options
    const normalizeOptions = (options: any): Option[] => {
        if (!options) return [];
        if (Array.isArray(options)) {
            return options.map(opt => {
                if (typeof opt === 'string') return { text: opt, text_en: null, image: null };
                return opt;
            });
        }
        return [];
    };

    const addOption = (questionIndex: number) => {
        const updated = [...questions];
        const currentOptions = normalizeOptions(updated[questionIndex].options);

        updated[questionIndex] = {
            ...updated[questionIndex],
            options: [...currentOptions, { text: '', text_en: null, image: null }]
        };
        setQuestions(updated);
    };

    const updateOption = (questionIndex: number, optionIndex: number, data: Partial<Option>) => {
        const updated = [...questions];
        const currentOptions = normalizeOptions(updated[questionIndex].options);

        currentOptions[optionIndex] = { ...currentOptions[optionIndex], ...data };

        updated[questionIndex] = {
            ...updated[questionIndex],
            options: currentOptions
        };
        setQuestions(updated);
    };

    const removeOption = (questionIndex: number, optionIndex: number) => {
        const updated = [...questions];
        const currentOptions = normalizeOptions(updated[questionIndex].options);

        updated[questionIndex] = {
            ...updated[questionIndex],
            options: currentOptions.filter((_, i) => i !== optionIndex)
        };
        setQuestions(updated);
    };

    // Image Handlers
    const handleImageUpload = async (file: File, questionIndex: number) => {
        const formData = new FormData();
        formData.append('image', file);

        try {
            const response = await axios.post(route('admin.forms.upload-question-image'), formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            updateQuestion(questionIndex, {
                ...questions[questionIndex],
                image: response.data.path
            });
        } catch (error) {
            console.error('Upload failed:', error);
            alert('Gagal mengupload gambar. Pastikan format sesuai dan ukuran max 5MB.');
        }
    };

    const deleteQuestionImage = async (questionIndex: number) => {
        const imagePath = questions[questionIndex].image;
        if (!imagePath) return;

        try {
            await axios.post(route('admin.forms.delete-question-image'), {
                path: imagePath
            });

            updateQuestion(questionIndex, {
                ...questions[questionIndex],
                image: null
            });
        } catch (error) {
            console.error('Delete failed:', error);
        }
    };

    const handleOptionImageUpload = async (file: File, questionIndex: number, optionIndex: number) => {
        const formData = new FormData();
        formData.append('image', file);

        try {
            const response = await axios.post(route('admin.forms.upload-question-image'), formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            updateOption(questionIndex, optionIndex, {
                image: response.data.path
            });
        } catch (error) {
            console.error('Upload failed:', error);
            alert('Gagal mengupload gambar opsi.');
        }
    };

    const toggleStatus = () => {
        router.post(route('admin.forms.toggle-status', form.id), {}, {
            preserveScroll: true,
        });
    };

    const copyLink = () => {
        navigator.clipboard.writeText(form.public_url);
        alert('Link berhasil disalin!');
    };

    const handleCloseDialog = () => {
        setIsDialogOpen(false);
        setEditingIndex(null);
    };

    return (
        <AdminLayout header={`Builder: ${form.name}`}>
            <Head title={`Form Builder - ${form.name}`} />

            {/* Editor Modal */}
            {editingIndex !== null && questions[editingIndex] && (
                <QuestionEditor
                    question={questions[editingIndex]}
                    onSave={(q) => updateQuestion(editingIndex, q)}
                    onCancel={() => setEditingIndex(null)}
                />
            )}

            {/* Live Preview Container */}
            <div className="min-h-screen bg-gradient-to-br from-[#11224e] to-[#5c83c4] -m-4 lg:-m-8">
                {/* Floating Header Bar */}
                <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm shadow-lg">
                    <div className="max-w-5xl mx-auto px-4 py-3">
                        {/* Top Row - Navigation & Form Name */}
                        <div className="flex items-center justify-between mb-3">
                            <Link
                                href={route('admin.events.forms', event.id)}
                                className="inline-flex items-center text-gray-600 hover:text-gray-900 font-medium"
                            >
                                ⬅️ Kembali ke Daftar Kuesioner
                            </Link>

                            <div className="flex items-center gap-3">
                                <Badge className={statusColors[form.status]}>
                                    {statusLabels[form.status]}
                                </Badge>
                                <span className="text-sm font-semibold text-gray-700 bg-gray-100 px-3 py-1 rounded-full">
                                    📝 {form.name}
                                </span>
                            </div>
                        </div>

                        {/* Toolbar Row - Actions */}
                        <div className="flex items-center justify-between border-t pt-3">
                            {/* Left Actions */}
                            <div className="flex items-center gap-2 flex-wrap">
                                <Button variant="outline" size="sm" onClick={copyLink}>
                                    📋 Salin Link
                                </Button>
                                <a href={form.public_url} target="_blank" rel="noopener noreferrer">
                                    <Button variant="outline" size="sm">
                                        👁️ Preview Form
                                    </Button>
                                </a>
                                <Link href={route('admin.forms.responses', form.id)}>
                                    <Button variant="outline" size="sm">
                                        📊 Lihat Jawaban
                                    </Button>
                                </Link>
                                <Link href={route('admin.forms.edit', form.id)}>
                                    <Button variant="outline" size="sm">
                                        ⚙️ Pengaturan Form
                                    </Button>
                                </Link>
                            </div>

                            {/* Right Actions */}
                            <div className="flex items-center gap-2">
                                <Button
                                    variant={form.status === 'active' ? 'destructive' : 'default'}
                                    size="sm"
                                    onClick={toggleStatus}
                                    className={form.status !== 'active' ? 'bg-green-600 hover:bg-green-700' : ''}
                                >
                                    {form.status === 'active' ? '🔒 Tutup Form' : '✅ Aktifkan Form'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Language Switcher (Static for preview) */}
                <div className="absolute top-32 right-4 z-10">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled
                        className="bg-white/20 border-white/30 text-white"
                    >
                        <Globe className="h-4 w-4 mr-2" />
                        English
                    </Button>
                </div>

                {/* Banner Preview - Interactive */}
                <div className="relative group">
                    {/* Hidden File Inputs */}
                    <input
                        ref={bannerInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleBannerUpload}
                    />
                    <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleLogoUpload}
                    />

                    {/* Banner Image - Clickable */}
                    <div
                        className="relative cursor-pointer"
                        onClick={() => bannerInputRef.current?.click()}
                    >
                        {(formBanner || event.banner_image) ? (
                            <img
                                src={formBanner || event.banner_image || ''}
                                alt="Banner"
                                className="w-full h-48 md:h-64 object-contain"
                            />
                        ) : (
                            <div className="w-full h-48 md:h-64 bg-gradient-to-r from-[#11224e] to-[#5c83c4]" />
                        )}
                        <div className="absolute inset-0 bg-black/30" />

                        {/* Upload Overlay */}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <div className="text-white text-center">
                                {isUploadingBanner ? (
                                    <span>⏳ Mengupload...</span>
                                ) : (
                                    <>
                                        <Upload className="h-8 w-8 mx-auto mb-2" />
                                        <span className="text-sm">Klik untuk ganti Banner</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Header Content - Logo & Title */}
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                        <div className="max-w-2xl mx-auto flex items-center gap-4">
                            {/* Logo - Clickable */}
                            <div
                                className="relative cursor-pointer group/logo"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    logoInputRef.current?.click();
                                }}
                            >
                                {(formLogo || event.logo_image) ? (
                                    <img
                                        src={formLogo || event.logo_image || ''}
                                        alt="Logo"
                                        className="h-16 w-16 rounded-lg bg-white p-2"
                                    />
                                ) : (
                                    <div className="h-16 w-16 rounded-lg bg-white/20 flex items-center justify-center">
                                        <span className="text-2xl">🏢</span>
                                    </div>
                                )}
                                {/* Logo Upload Overlay */}
                                <div className="absolute inset-0 bg-black/50 rounded-lg opacity-0 group-hover/logo:opacity-100 transition-opacity flex items-center justify-center">
                                    {isUploadingLogo ? (
                                        <span className="text-white text-xs">⏳</span>
                                    ) : (
                                        <Upload className="h-4 w-4 text-white" />
                                    )}
                                </div>
                            </div>

                            {/* Title & Description - Editable */}
                            <div className="flex-1" onClick={(e) => e.stopPropagation()}>
                                {isEditingHeader ? (
                                    <div className="space-y-2">
                                        <Input
                                            value={formTitle}
                                            onChange={(e) => setFormTitle(e.target.value)}
                                            placeholder={event.title}
                                            className="bg-white/90 text-gray-900 font-bold text-lg"
                                        />
                                        <Textarea
                                            value={formDescription}
                                            onChange={(e) => setFormDescription(e.target.value)}
                                            placeholder={event.description || 'Deskripsi form...'}
                                            className="bg-white/90 text-gray-900 text-sm resize-none"
                                            rows={2}
                                        />
                                        <div className="flex gap-2">
                                            <Button size="sm" onClick={saveHeaderChanges} className="bg-green-600 hover:bg-green-700">
                                                ✅ Simpan
                                            </Button>
                                            <Button size="sm" variant="outline" onClick={() => setIsEditingHeader(false)} className="text-white border-white/50">
                                                ❌ Batal
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div
                                        className="cursor-pointer hover:bg-white/10 rounded-lg p-2 -m-2 transition-colors"
                                        onClick={() => setIsEditingHeader(true)}
                                    >
                                        <h1 className="text-2xl md:text-3xl font-bold text-white">
                                            {formTitle || event.title}
                                        </h1>
                                        <p className="text-white/80 mt-1">
                                            {formDescription || event.description || 'Klik untuk tambah deskripsi...'}
                                        </p>
                                        <span className="text-white/50 text-xs mt-1 inline-block">✏️ Klik untuk edit</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Form Preview */}
                <div className="max-w-2xl mx-auto px-4 py-8">
                    <div className="space-y-6">
                        {/* Respondent Fields Settings */}
                        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-white font-semibold text-sm flex items-center gap-2">
                                    👤 Data Responden
                                    <span className="text-white/50 text-xs font-normal">(tampil di form publik)</span>
                                </h3>
                                <button
                                    type="button"
                                    onClick={addRespondentField}
                                    className="text-xs bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded-lg transition-colors flex items-center gap-1"
                                >
                                    ➕ Tambah Field
                                </button>
                            </div>
                            {respondentFields.length === 0 && (
                                <p className="text-white/40 text-sm text-center py-3">Belum ada field. Klik "Tambah Field" untuk mulai.</p>
                            )}
                            <div className="space-y-3">
                                {respondentFields.map((field, index) => (
                                    <div key={field.key} className="bg-white/10 rounded-xl px-4 py-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                <span className="text-lg">
                                                    {field.type === 'email' ? '📧' : (field.type === 'number' ? '🔢' : '📝')}
                                                </span>
                                                <div className="flex-1 min-w-0">
                                                    <span className="text-white font-medium text-sm truncate block">
                                                        {field.label || `Field ${index + 1}`}
                                                    </span>
                                                    <p className="text-white/50 text-xs">{field.required !== false ? 'Wajib diisi' : 'Opsional'}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => removeRespondentField(index)}
                                                    className="text-red-400 hover:text-red-300 text-sm p-1 transition-colors"
                                                    title="Hapus field"
                                                >
                                                    🗑️
                                                </button>
                                                <div
                                                    className={`relative w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer ${field.enabled ? 'bg-green-500' : 'bg-gray-500'}`}
                                                    onClick={() => toggleRespondentField(index)}
                                                >
                                                    <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${field.enabled ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
                                                </div>
                                            </div>
                                        </div>
                                        {field.enabled && (
                                            <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
                                                <div>
                                                    <label className="text-white/70 text-xs mb-1 block">Label:</label>
                                                    <input
                                                        type="text"
                                                        value={field.label}
                                                        onChange={(e) => updateRespondentField(index, { label: e.target.value })}
                                                        placeholder={`Field ${index + 1}`}
                                                        className="w-full px-3 py-1.5 bg-white/20 border border-white/20 rounded-lg text-white text-sm placeholder:text-white/40 focus:outline-none focus:border-white/40"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-white/70 text-xs mb-1 block">Tipe:</label>
                                                    <select
                                                        value={field.type}
                                                        onChange={(e) => updateRespondentField(index, { type: e.target.value as 'text' | 'email' | 'number' })}
                                                        className="w-full px-3 py-1.5 bg-white/20 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-white/40"
                                                    >
                                                        <option value="text" className="text-black">Teks</option>
                                                        <option value="email" className="text-black">Email</option>
                                                        <option value="number" className="text-black">Angka</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="flex items-center gap-2 cursor-pointer mt-1">
                                                        <input
                                                            type="checkbox"
                                                            checked={field.required !== false}
                                                            onChange={(e) => updateRespondentField(index, { required: e.target.checked })}
                                                            className="w-4 h-4 rounded border-white/30 bg-white/20 text-green-500 focus:ring-0"
                                                        />
                                                        <span className="text-white/70 text-xs">Wajib diisi</span>
                                                    </label>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Respondent Fields Preview Card */}
                        {respondentFields.some(f => f.enabled) && (
                            <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4 border border-gray-100">
                                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Data Responden</h3>
                                {respondentFields.filter(f => f.enabled).map((field) => (
                                    <div key={field.key} className="space-y-1.5">
                                        <label className="text-sm font-medium text-gray-700">
                                            {field.label || field.key} {field.required !== false && <span className="text-red-500">*</span>}
                                        </label>
                                        <div className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-400 text-sm">
                                            {field.type === 'email'
                                                ? 'email@contoh.com'
                                                : `${field.label || 'Jawaban'}...`}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Questions */}
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={questions.map((q, i) => q.id || `new-${i}`)}
                                strategy={verticalListSortingStrategy}
                            >
                                <div className="space-y-4">
                                    {questions.map((question, index) => (
                                        <SortablePreviewQuestion
                                            key={question.id || `new-${index}`}
                                            question={question}
                                            index={index}
                                            onEdit={() => setEditingIndex(index)}
                                            onDelete={() => deleteQuestion(index)}
                                        />
                                    ))}
                                </div>
                            </SortableContext>
                        </DndContext>

                        {/* Empty State */}
                        {questions.length === 0 && (
                            <div className="text-center py-12 text-white/80">
                                <p className="text-lg">Belum ada pertanyaan</p>
                                <p className="text-sm mt-1">Klik tombol di bawah untuk menambahkan pertanyaan pertama</p>
                            </div>
                        )}

                        {/* Add Question Button */}
                        <button
                            onClick={addQuestion}
                            className="w-full border-2 border-dashed border-white/30 rounded-xl p-6 text-white/80 hover:text-white hover:border-white/50 hover:bg-white/5 transition-all flex items-center justify-center gap-2"
                        >
                            ➕ Tambah Pertanyaan Baru
                        </button>

                        {/* Submit Preview (Static) */}
                        <Button
                            disabled
                            className="w-full bg-[#f17720] text-lg py-6 opacity-50"
                        >
                            Kirim Testimoni
                        </Button>

                        {/* Footer */}
                        <div className="mt-8 text-center">
                            <img
                                src="/images/logo-white.svg"
                                alt="DIGIOH"
                                className="h-6 mx-auto opacity-60"
                            />
                        </div>
                    </div>
                </div>
            </div>
            {/* Question Type Dialog */}
            {isDialogOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-lg w-full max-w-lg">
                        <div className="p-6 border-b flex items-center justify-between">
                            <h3 className="text-lg font-semibold">
                                {editingIndex !== null ? 'Edit Pertanyaan' : 'Tambah Pertanyaan'}
                            </h3>
                            <button onClick={handleCloseDialog} className="text-gray-400 hover:text-gray-600">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto max-h-[70vh]">
                            {editingIndex === null ? (
                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                                    {questionTypes.map((type) => (
                                        <button
                                            key={type.id}
                                            onClick={() => handleAddQuestion(type.id as QuestionType)}
                                            className="flex flex-col items-center gap-3 p-4 rounded-xl border-2 border-dashed border-gray-200 hover:border-blue-500 hover:bg-blue-50/50 transition-all group text-left"
                                        >
                                            <div className="p-3 bg-gray-100 rounded-lg group-hover:bg-blue-100 text-gray-600 group-hover:text-blue-600 transition-colors">
                                                <type.icon className="h-6 w-6" />
                                            </div>
                                            <div className="text-center">
                                                <div className="font-medium text-gray-900 group-hover:text-blue-700">
                                                    {type.label}
                                                </div>
                                                <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                                                    {type.description}
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {/* Question Text */}
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>Pertanyaan (ID) <span className="text-red-500">*</span></Label>
                                            <Input
                                                value={questions[editingIndex].question_text}
                                                onChange={(e) => updateQuestionField(editingIndex, 'question_text', e.target.value)}
                                                placeholder="Contoh: Apa pendapat Anda tentang acara ini?"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Pertanyaan (EN) <span className="text-gray-400 text-xs">(Opsional)</span></Label>
                                            <Input
                                                value={questions[editingIndex].question_text_en || ''}
                                                onChange={(e) => updateQuestionField(editingIndex, 'question_text_en', e.target.value)}
                                                placeholder="Example: What do you think about this event?"
                                            />
                                        </div>
                                    </div>

                                    {/* Question Image */}
                                    <div className="space-y-2">
                                        <Label>Gambar Pertanyaan <span className="text-gray-400 text-xs">(Opsional)</span></Label>
                                        <p className="text-xs text-gray-500 mb-2">
                                            Format: JPG, PNG, GIF. Max 5MB. Rekomendasi lebar min 800px (Landscape).
                                        </p>
                                        <div className="flex items-start gap-4">
                                            {questions[editingIndex].image && (
                                                <div className="relative group border rounded-lg overflow-hidden w-24 h-24 shrink-0 bg-gray-50">
                                                    <img
                                                        src={`/storage/${questions[editingIndex].image}`}
                                                        alt="Question"
                                                        className="w-full h-full object-contain"
                                                    />
                                                    <button
                                                        onClick={() => deleteQuestionImage(editingIndex)}
                                                        className="absolute top-1 right-1 bg-white/90 p-1 rounded-full text-red-600 hover:text-red-700 hover:bg-white shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </button>
                                                </div>
                                            )}
                                            <div className="flex-1">
                                                <Input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) handleImageUpload(file, editingIndex);
                                                    }}
                                                    className="cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                                />
                                                <p className="text-xs text-gray-500 mt-2">
                                                    Upload gambar baru untuk mengganti yang lama.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Options for Multiple Choice / Rating / Dropdown */}
                                    {['multiple_choice', 'dropdown', 'checkbox'].includes(questions[editingIndex].type) && (
                                        <div className="space-y-3 pt-4 border-t">
                                            <div className="flex items-center justify-between">
                                                <Label>Pilihan Jawaban</Label>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => addOption(editingIndex)}
                                                >
                                                    <Plus className="h-4 w-4 mr-2" />
                                                    Tambah Pilihan
                                                </Button>
                                            </div>

                                            <p className="text-xs text-gray-500 mb-2">
                                                Rekomendasi gambar opsi: Rasio 1:1 (Square) atau Landscape, lebar min 500px.
                                            </p>

                                            <div className="space-y-3">
                                                {normalizeOptions(questions[editingIndex].options).map((option, optIndex) => (
                                                    <div key={optIndex} className="p-3 border rounded-lg bg-gray-50 space-y-3">
                                                        <div className="flex gap-2 items-start">
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1">
                                                                <Input
                                                                    value={option.text}
                                                                    onChange={(e) => updateOption(editingIndex, optIndex, { text: e.target.value })}
                                                                    placeholder={`Pilihan ${optIndex + 1} (ID)`}
                                                                />
                                                                <Input
                                                                    value={option.text_en || ''}
                                                                    onChange={(e) => updateOption(editingIndex, optIndex, { text_en: e.target.value })}
                                                                    placeholder={`Option ${optIndex + 1} (EN)`}
                                                                />
                                                            </div>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => removeOption(editingIndex, optIndex)}
                                                                className="text-red-500 hover:text-red-700 shrink-0"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>

                                                        {/* Option Image Upload */}
                                                        <div className="flex items-center gap-3 pl-1">
                                                            {option.image ? (
                                                                <div className="relative group w-12 h-12 border rounded overflow-hidden bg-white shrink-0">
                                                                    <img
                                                                        src={`/storage/${option.image}`}
                                                                        alt="Option"
                                                                        className="w-full h-full object-contain"
                                                                    />
                                                                    <button
                                                                        onClick={() => {
                                                                            // Delete option image logic here if needed
                                                                            // For now, allow replacing directly
                                                                        }}
                                                                        className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                                                                    >
                                                                        Ganti
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <div className="w-12 h-12 border border-dashed rounded flex items-center justify-center text-gray-400 bg-white shrink-0">
                                                                    <ImageIcon className="h-5 w-5" />
                                                                </div>
                                                            )}

                                                            <div className="flex-1">
                                                                <Input
                                                                    type="file"
                                                                    accept="image/*"
                                                                    className="h-9 py-1 text-sm file:mr-2 file:py-1 file:px-2 file:text-xs"
                                                                    onChange={(e) => {
                                                                        const file = e.target.files?.[0];
                                                                        if (file) handleOptionImageUpload(file, editingIndex, optIndex);
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Settings Toggle */}
                                    <div className="flex items-center space-x-2 pt-4 border-t">
                                        <Switch
                                            id="required"
                                            checked={questions[editingIndex].is_required}
                                            onCheckedChange={(checked) => updateQuestionField(editingIndex, 'is_required', checked)}
                                        />
                                        <Label htmlFor="required">Wajib Diisi</Label>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="p-6 border-t bg-gray-50 rounded-b-xl flex justify-end gap-3">
                            <Button variant="outline" onClick={handleCloseDialog}>
                                {editingIndex !== null ? 'Selesai Edit' : 'Tutup'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
