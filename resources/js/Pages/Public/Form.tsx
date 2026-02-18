import { Head, useForm } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Textarea } from '@/Components/ui/textarea';
import { Label } from '@/Components/ui/label';
import { Card, CardContent } from '@/Components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/Components/ui/select';
import { Star, Upload, Loader2, Check, X, Image as ImageIcon } from 'lucide-react';
import { useState } from 'react';

interface Question {
    id: number;
    text_id: string;
    text_en: string;
    image: string | null;
    type: 'text' | 'textarea' | 'rating' | 'file' | 'multiple_choice' | 'checkbox' | 'dropdown' | 'date' | 'time' | 'linear_scale' | 'email' | 'number';
    is_required: boolean;
    options: (string | Option)[] | null;
    description_id: string | null;
    description_en: string | null;
}

interface Option {
    text: string;
    image: string | null;
}

interface Event {
    id: number;
    title: string;
    description: string | null;
    default_locale: string;
    banner_image: string | null;
    logo_image: string | null;
    theme_config: {
        custom_labels?: {
            name?: string;
            name_en?: string;
            email?: string;
            email_en?: string;
        };
    } | null;
}

interface RespondentField {
    key: string;
    label: string;
    type: 'text' | 'email' | 'number';
    enabled: boolean;
    required: boolean;
}

interface FormProps {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    respondent_fields: RespondentField[];
    banner_image: string | null;
    logo_image: string | null;
    title: string | null;
}

interface Props {
    event: Event;
    form: FormProps;
    questions: Question[];
    editMode?: boolean;
    editToken?: string;
    existingAnswers?: { [key: number]: any };
    existingRespondentData?: { [key: string]: string };
}

const translations = {
    id: {
        name: 'Nama Anda',
        email: 'Email (Opsional)',
        submit: 'Kirim Testimoni',
        submit_edit: 'Simpan Perubahan',
        submitting: 'Mengirim...',
        required: 'Wajib diisi',
        switchLang: 'English',
        placeholder_text: 'Ketik jawaban Anda di sini...',
        placeholder_textarea: 'Ketik ulasan Anda di sini...',
        placeholder_email: 'nama@email.com',
        placeholder_number: '123...',
    },
    en: {
        name: 'Your Name',
        email: 'Email (Optional)',
        submit: 'Submit Testimonial',
        submit_edit: 'Save Changes',
        submitting: 'Submitting...',
        required: 'Required',
        switchLang: 'Indonesia',
        placeholder_text: 'Type your answer here...',
        placeholder_textarea: 'Type your review here...',
        placeholder_email: 'name@email.com',
        placeholder_number: '123...',
    },
};

function StarRatingInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
    const [hover, setHover] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);

    const handleClick = (star: number) => {
        setIsAnimating(true);
        onChange(star);
        setTimeout(() => setIsAnimating(false), 300);
    };

    return (
        <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    className={`focus:outline-none transition-all duration-200 transform hover:scale-125 ${isAnimating && star === value ? 'animate-bounce' : ''
                        }`}
                    onMouseEnter={() => setHover(star)}
                    onMouseLeave={() => setHover(0)}
                    onClick={() => handleClick(star)}
                >
                    <Star
                        className={`h-10 w-10 transition-colors duration-200 ${star <= (hover || value)
                            ? 'fill-yellow-400 text-yellow-400 drop-shadow-md'
                            : 'text-gray-300 hover:text-yellow-200'
                            }`}
                    />
                </button>
            ))}
        </div>
    );
}

export default function Form({ event, form, questions, editMode = false, editToken, existingAnswers, existingRespondentData }: Props) {
    const [locale, setLocale] = useState<'id' | 'en'>(event.default_locale as 'id' | 'en');
    const [lightboxImage, setLightboxImage] = useState<string | null>(null);

    // Resolve assets: form-level takes priority over event-level
    const bannerImage = form.banner_image || event.banner_image;
    const logoImage = form.logo_image || event.logo_image;
    const displayTitle = form.title || event.title;
    const displayDescription = form.description || event.description;

    const enabledFields = (form.respondent_fields || []).filter((f: RespondentField) => f.enabled);

    const { data, setData, post, put, processing, errors } = useForm<{
        respondent_data: { [key: string]: string };
        answers: { [key: number]: any };
    }>({
        respondent_data: existingRespondentData || {},
        answers: existingAnswers || {},
    });

    const [submitSuccess, setSubmitSuccess] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (editMode && editToken) {
            put(`/form/${form.slug}/edit/${editToken}`, {
                preserveScroll: true,
                onSuccess: () => {
                    setSubmitSuccess(true);
                    setTimeout(() => {
                        window.location.href = route('form.thankyou', form.slug);
                    }, 1200);
                },
            });
        } else {
            post(route('form.submit', form.slug), {
                preserveScroll: true,
                onSuccess: () => {
                    setSubmitSuccess(true);
                    setTimeout(() => {
                        window.location.href = route('form.thankyou', form.slug);
                    }, 1200);
                },
            });
        }
    };

    const updateAnswer = (questionId: number, value: any) => {
        setData('answers', { ...data.answers, [questionId]: value });
    };

    const toggleLocale = () => {
        setLocale(locale === 'id' ? 'en' : 'id');
    };

    const t = translations[locale];
    const getQuestionText = (q: Question) => locale === 'id' ? q.text_id : q.text_en;

    return (
        <>
            <Head title={event.title} />

            <div className="min-h-screen bg-gradient-to-br from-[#11224e] to-[#5c83c4]">
                {/* Language Switcher */}
                <div className="absolute top-4 right-4 z-10">
                    <Select value={locale} onValueChange={(value: 'id' | 'en') => setLocale(value)}>
                        <SelectTrigger className="w-[140px] bg-white/20 border-white/30 text-white hover:bg-white/30">
                            <SelectValue>
                                {locale === 'id' ? '🇮🇩 Indonesia' : '🇬🇧 English'}
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="id">🇮🇩 Indonesia</SelectItem>
                            <SelectItem value="en">🇬🇧 English</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Banner */}
                <div className="relative h-40 md:h-64 overflow-hidden">
                    {bannerImage ? (
                        <>
                            {/* Blurred Background Layer */}
                            <img
                                src={bannerImage}
                                alt="Banner Background"
                                className="absolute inset-0 w-full h-full object-cover blur-md scale-110 opacity-50"
                            />
                            {/* Clean Focused Layer */}
                            <img
                                src={bannerImage}
                                alt={displayTitle}
                                className="relative w-full h-full object-contain z-10"
                            />
                        </>
                    ) : (
                        <div className="w-full h-full bg-gradient-to-r from-[#11224e] to-[#5c83c4] animate-in fade-in zoom-in-105 duration-1000" />
                    )}
                    <div className="absolute inset-0 bg-black/30 animate-in fade-in duration-1000 z-20" />
                    <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
                        <div className="max-w-2xl mx-auto flex items-center gap-4">
                            {logoImage && (
                                <img
                                    src={logoImage}
                                    alt="Logo"
                                    className="h-12 w-12 md:h-16 md:w-16 rounded-lg bg-white p-2"
                                />
                            )}
                            <div>
                                <h1 className="text-xl md:text-3xl font-bold text-white leading-tight">
                                    {displayTitle}
                                </h1>
                                {displayDescription && (
                                    <p className="text-white/90 text-sm md:text-base mt-1 line-clamp-2 md:line-clamp-none">{displayDescription}</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Form */}
                <div className="max-w-2xl mx-auto px-3 md:px-4 py-6 md:py-8 relative z-10 -mt-6 md:-mt-10">
                    {editMode && (
                        <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3">
                            <span className="text-2xl">✏️</span>
                            <div>
                                <p className="font-semibold text-amber-800">
                                    {locale === 'id' ? 'Mode Edit' : 'Edit Mode'}
                                </p>
                                <p className="text-sm text-amber-600">
                                    {locale === 'id'
                                        ? 'Anda sedang mengedit jawaban yang sudah dikirim sebelumnya.'
                                        : 'You are editing your previously submitted answers.'}
                                </p>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* Respondent Data Fields */}
                        {enabledFields.length > 0 && (
                            <Card className="shadow-lg animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-backwards">
                                <CardContent className="pt-6 space-y-4">
                                    {enabledFields.map((field: RespondentField) => (
                                        <div key={field.key} className="space-y-2">
                                            <Label className="text-base">
                                                {field.label || field.key} {field.required !== false && <span className="text-red-500">*</span>}
                                            </Label>
                                            <Input
                                                type={field.type === 'email' ? 'email' : (field.type === 'number' ? 'tel' : 'text')}
                                                pattern={field.type === 'number' ? '[0-9]*' : undefined}
                                                value={data.respondent_data[field.key] || ''}
                                                onChange={(e) => {
                                                    let value = e.target.value;
                                                    if (field.type === 'number') {
                                                        value = value.replace(/\D/g, '');
                                                    }
                                                    setData('respondent_data', {
                                                        ...data.respondent_data,
                                                        [field.key]: value,
                                                    });
                                                }}
                                                className={`${(errors as any)[`respondent_data.${field.key}`] ? 'border-red-500' : ''} transition-all duration-300 focus:scale-[1.01] focus:shadow-md focus:border-[#f17720] focus:ring-[#f17720]`}
                                                placeholder={field.type === 'email' ? t.placeholder_email : `${field.label || field.key}...`}
                                            />
                                            {(errors as any)[`respondent_data.${field.key}`] && (
                                                <p className="text-red-500 text-sm">{(errors as any)[`respondent_data.${field.key}`]}</p>
                                            )}
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        )}

                        {/* Questions */}
                        {questions.map((question, index) => (
                            <Card
                                key={question.id}
                                className="shadow-lg animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-backwards"
                                style={{ animationDelay: `${index * 150}ms`, animationFillMode: 'backwards' }}
                            >
                                <CardContent className="pt-6">
                                    <div className="space-y-3">
                                        {/* Question Image */}
                                        {question.image && (
                                            <div
                                                className="relative group/qimg cursor-zoom-in mb-4"
                                                onClick={() => setLightboxImage(question.image!.startsWith('http') ? question.image! : `/storage/${question.image}`)}
                                            >
                                                <img
                                                    src={question.image.startsWith('http') ? question.image : `/storage/${question.image}`}
                                                    alt=""
                                                    className="w-full h-auto max-h-[500px] object-contain rounded-lg transition-opacity group-hover/qimg:opacity-90"
                                                />
                                                <div className="absolute top-2 right-2 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover/qimg:opacity-100 transition-opacity">
                                                    <ImageIcon className="h-5 w-5" />
                                                </div>
                                            </div>
                                        )}
                                        <Label className="text-base">
                                            {getQuestionText(question)}
                                            {question.is_required && (
                                                <span className="text-red-500 ml-1">*</span>
                                            )}
                                        </Label>

                                        {(() => {
                                            const desc = locale === 'en' ? (question.description_en || question.description_id) : question.description_id;
                                            return desc ? <p className="text-sm text-gray-500">{desc}</p> : null;
                                        })()}

                                        {question.type === 'text' && (
                                            <Input
                                                value={data.answers[question.id] || ''}
                                                onChange={(e) => updateAnswer(question.id, e.target.value)}
                                                className={`${(errors as any)[`answers.${question.id}`] ? 'border-red-500' : ''} transition-all duration-300 focus:scale-[1.01] focus:shadow-md focus:border-[#f17720] focus:ring-[#f17720]`}
                                                placeholder={t.placeholder_text}
                                            />
                                        )}

                                        {question.type === 'textarea' && (
                                            <Textarea
                                                value={data.answers[question.id] || ''}
                                                onChange={(e) => updateAnswer(question.id, e.target.value)}
                                                rows={4}
                                                className={`${(errors as any)[`answers.${question.id}`] ? 'border-red-500' : ''} transition-all duration-300 focus:scale-[1.01] focus:shadow-md focus:border-[#f17720] focus:ring-[#f17720]`}
                                                placeholder={t.placeholder_textarea}
                                            />
                                        )}

                                        {question.type === 'rating' && (
                                            <StarRatingInput
                                                value={data.answers[question.id] || 0}
                                                onChange={(value) => updateAnswer(question.id, value)}
                                            />
                                        )}

                                        {question.type === 'file' && (
                                            <div className="border-2 border-dashed rounded-lg p-6 text-center">
                                                <Upload className="h-8 w-8 mx-auto text-gray-400" />
                                                <Input
                                                    type="file"
                                                    accept=".jpg,.jpeg,.png,.gif,.pdf"
                                                    onChange={(e) => updateAnswer(question.id, e.target.files?.[0])}
                                                    className="mt-2"
                                                />
                                            </div>
                                        )}

                                        {question.type === 'email' && (
                                            <Input
                                                type="email"
                                                value={data.answers[question.id] || ''}
                                                onChange={(e) => updateAnswer(question.id, e.target.value)}
                                                className={(errors as any)[`answers.${question.id}`] ? 'border-red-500' : ''}
                                                placeholder={t.placeholder_email}
                                            />
                                        )}

                                        {question.type === 'number' && (
                                            <Input
                                                type="tel"
                                                pattern="[0-9]*"
                                                value={data.answers[question.id] || ''}
                                                onChange={(e) => updateAnswer(question.id, e.target.value.replace(/\D/g, ''))}
                                                className={(errors as any)[`answers.${question.id}`] ? 'border-red-500' : ''}
                                                placeholder={t.placeholder_number}
                                            />
                                        )}

                                        {question.type === 'multiple_choice' && question.options && (
                                            <div className="space-y-2">
                                                {question.options.map((rawOption, index) => {
                                                    const option = typeof rawOption === 'string' ? { text: rawOption, image: null } : rawOption;
                                                    return (
                                                        <label
                                                            key={index}
                                                            className={`flex gap-3 p-3 rounded-lg border bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors ${option.image ? 'items-start' : 'items-center'}`}
                                                        >
                                                            <input
                                                                type="radio"
                                                                name={`question_${question.id}`}
                                                                value={option.text}
                                                                checked={data.answers[question.id] === option.text}
                                                                onChange={() => updateAnswer(question.id, option.text)}
                                                                className="h-4 w-4 text-[#f17720] focus:ring-[#f17720] mt-1"
                                                            />
                                                            <div className="flex-1">
                                                                {option.image && (
                                                                    <div
                                                                        className="relative group/optimg cursor-zoom-in"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            e.preventDefault();
                                                                            if (option.image) setLightboxImage(option.image.startsWith('http') ? option.image : `/storage/${option.image}`);
                                                                        }}
                                                                    >
                                                                        <img
                                                                            src={option.image.startsWith('http') ? option.image : `/storage/${option.image}`}
                                                                            alt="Option"
                                                                            className="w-full h-auto max-h-64 object-contain rounded-md border mb-2 transition-opacity group-hover/optimg:opacity-90"
                                                                        />
                                                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/optimg:opacity-100 transition-opacity">
                                                                            <div className="bg-black/50 p-2 rounded-full">
                                                                                <ImageIcon className="h-6 w-6 text-white" />
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                <span className="text-gray-700 relative top-[-2px]">{option.text}</span>
                                                            </div>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {question.type === 'checkbox' && question.options && (
                                            <div className="space-y-2">
                                                {question.options.map((rawOption, index) => {
                                                    const option = typeof rawOption === 'string' ? { text: rawOption, image: null } : rawOption;
                                                    const selectedValues: string[] = Array.isArray(data.answers[question.id]) ? data.answers[question.id] : [];
                                                    const isChecked = selectedValues.includes(option.text);
                                                    return (
                                                        <label
                                                            key={index}
                                                            className={`flex gap-3 p-3 rounded-lg border cursor-pointer hover:bg-gray-100 transition-colors ${isChecked ? 'bg-blue-50 border-blue-300' : 'bg-gray-50'} ${option.image ? 'items-start' : 'items-center'}`}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={isChecked}
                                                                onChange={() => {
                                                                    const newValues = isChecked
                                                                        ? selectedValues.filter(v => v !== option.text)
                                                                        : [...selectedValues, option.text];
                                                                    updateAnswer(question.id, newValues);
                                                                }}
                                                                className="h-4 w-4 rounded text-[#f17720] focus:ring-[#f17720] mt-1"
                                                            />
                                                            <div className="flex-1">
                                                                {option.image && (
                                                                    <div
                                                                        className="relative group/optimg cursor-zoom-in"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            e.preventDefault();
                                                                            if (option.image) setLightboxImage(option.image.startsWith('http') ? option.image : `/storage/${option.image}`);
                                                                        }}
                                                                    >
                                                                        <img
                                                                            src={option.image.startsWith('http') ? option.image : `/storage/${option.image}`}
                                                                            alt="Option"
                                                                            className="w-full h-auto max-h-64 object-contain rounded-md border mb-2 transition-opacity group-hover/optimg:opacity-90"
                                                                        />
                                                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/optimg:opacity-100 transition-opacity">
                                                                            <div className="bg-black/50 p-2 rounded-full">
                                                                                <ImageIcon className="h-6 w-6 text-white" />
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                <span className="text-gray-700 relative top-[-2px]">{option.text}</span>
                                                            </div>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {question.type === 'dropdown' && question.options && (
                                            <select
                                                value={data.answers[question.id] || ''}
                                                onChange={(e) => updateAnswer(question.id, e.target.value)}
                                                className={`w-full px-3 py-2 bg-white border rounded-lg text-sm transition-all duration-300 focus:border-[#f17720] focus:ring-[#f17720] focus:outline-none ${(errors as any)[`answers.${question.id}`] ? 'border-red-500' : 'border-gray-200'}`}
                                            >
                                                <option value="">{locale === 'id' ? 'Pilih jawaban...' : 'Select an answer...'}</option>
                                                {question.options.map((rawOption, index) => {
                                                    const option = typeof rawOption === 'string' ? { text: rawOption } : rawOption;
                                                    return (
                                                        <option key={index} value={option.text}>{option.text}</option>
                                                    );
                                                })}
                                            </select>
                                        )}

                                        {question.type === 'date' && (
                                            <Input
                                                type="date"
                                                value={data.answers[question.id] || ''}
                                                onChange={(e) => updateAnswer(question.id, e.target.value)}
                                                className={`${(errors as any)[`answers.${question.id}`] ? 'border-red-500' : ''} transition-all duration-300 focus:border-[#f17720] focus:ring-[#f17720]`}
                                            />
                                        )}

                                        {question.type === 'time' && (
                                            <Input
                                                type="time"
                                                value={data.answers[question.id] || ''}
                                                onChange={(e) => updateAnswer(question.id, e.target.value)}
                                                className={`${(errors as any)[`answers.${question.id}`] ? 'border-red-500' : ''} transition-all duration-300 focus:border-[#f17720] focus:ring-[#f17720]`}
                                            />
                                        )}

                                        {question.type === 'linear_scale' && (() => {
                                            const opts = (question.options as any) || {};
                                            const min = opts.min ?? 1;
                                            const max = opts.max ?? 5;
                                            const selected = data.answers[question.id];
                                            return (
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between gap-1 flex-wrap">
                                                        {Array.from({ length: max - min + 1 }, (_, i) => min + i).map((n) => (
                                                            <button
                                                                key={n}
                                                                type="button"
                                                                onClick={() => updateAnswer(question.id, String(n))}
                                                                className={`w-10 h-10 rounded-full border text-sm font-medium transition-all duration-200 ${String(selected) === String(n)
                                                                    ? 'bg-[#f17720] border-[#f17720] text-white scale-110 shadow-md'
                                                                    : 'border-gray-300 bg-white text-gray-600 hover:border-[#f17720] hover:text-[#f17720]'
                                                                    }`}
                                                            >
                                                                {n}
                                                            </button>
                                                        ))}
                                                    </div>
                                                    {(opts.min_label || opts.max_label) && (
                                                        <div className="flex justify-between text-xs text-gray-500">
                                                            <span>{opts.min_label || ''}</span>
                                                            <span>{opts.max_label || ''}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })()}

                                        {(errors as any)[`answers.${question.id}`] && (
                                            <p className="text-sm text-red-500">
                                                {t.required}
                                            </p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}

                        {/* Submit */}
                        <Button
                            type="submit"
                            disabled={processing || submitSuccess}
                            className={`w-full text-lg py-6 transition-all duration-500 hover:scale-[1.02] hover:shadow-lg active:scale-95 relative overflow-hidden ${submitSuccess
                                ? 'bg-green-500 hover:bg-green-500'
                                : 'bg-[#f17720] hover:bg-[#d96a1a]'
                                }`}
                        >
                            {/* Normal State: Text */}
                            <span className={`inline-flex items-center gap-2 transition-all duration-300 ${processing || submitSuccess ? 'opacity-0 scale-75' : 'opacity-100 scale-100'
                                }`}>
                                {editMode
                                    ? (locale === 'id' ? 'Simpan Perubahan' : 'Save Changes')
                                    : (locale === 'id' ? 'Kirim' : 'Submit')}
                            </span>

                            {/* Loading State: Spinner */}
                            <span className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${processing && !submitSuccess ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
                                }`}>
                                <Loader2 className="h-6 w-6 animate-spin" />
                            </span>

                            {/* Success State: Checkmark */}
                            <span className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ${submitSuccess ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
                                }`}>
                                <Check className="h-8 w-8 animate-in zoom-in-50 duration-300" />
                            </span>
                        </Button>
                    </form>

                    {/* Footer */}
                    <div className="mt-8 text-center">
                        <img
                            src="/images/logo-white.svg"
                            alt="DIGIOH"
                            className="h-6 mx-auto opacity-60"
                        />
                    </div>
                </div>

                {/* Image Lightbox */}
                {lightboxImage && (
                    <div
                        className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out"
                        onClick={() => setLightboxImage(null)}
                    >
                        <div className="relative max-w-5xl w-full h-full flex items-center justify-center">
                            <img
                                src={lightboxImage}
                                alt="Preview Full"
                                className="max-w-full max-h-full object-contain shadow-2xl rounded-lg animate-in zoom-in-95 duration-200"
                                onClick={(e) => e.stopPropagation()}
                            />
                            <button
                                onClick={() => setLightboxImage(null)}
                                className="absolute top-4 right-4 text-white hover:text-gray-300 p-2 bg-black/50 rounded-full transition-colors"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>
                    </div>
                )}
            </div >
        </>
    );
}
