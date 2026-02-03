import { Head, useForm } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Textarea } from '@/Components/ui/textarea';
import { Label } from '@/Components/ui/label';
import { Card, CardContent } from '@/Components/ui/card';
import { Star, Upload, Globe } from 'lucide-react';
import { useState } from 'react';

interface Question {
    id: number;
    text_id: string;
    text_en: string;
    type: 'text' | 'textarea' | 'rating' | 'file' | 'multiple_choice';
    is_required: boolean;
    options: string[] | null;
}

interface Event {
    id: number;
    title: string;
    description: string | null;
    default_locale: string;
    banner_image: string | null;
    logo_image: string | null;
    theme_config: any;
}

interface Props {
    event: Event;
    questions: Question[];
}

const translations = {
    id: {
        name: 'Nama Anda',
        email: 'Email (Opsional)',
        submit: 'Kirim Testimoni',
        submitting: 'Mengirim...',
        required: 'Wajib diisi',
        switchLang: 'English',
    },
    en: {
        name: 'Your Name',
        email: 'Email (Optional)',
        submit: 'Submit Testimonial',
        submitting: 'Submitting...',
        required: 'Required',
        switchLang: 'Indonesia',
    },
};

function StarRatingInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
    const [hover, setHover] = useState(0);

    return (
        <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    className="focus:outline-none transition-transform hover:scale-110"
                    onMouseEnter={() => setHover(star)}
                    onMouseLeave={() => setHover(0)}
                    onClick={() => onChange(star)}
                >
                    <Star
                        className={`h-8 w-8 ${star <= (hover || value)
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                            }`}
                    />
                </button>
            ))}
        </div>
    );
}

export default function Form({ event, questions }: Props) {
    const [locale, setLocale] = useState<'id' | 'en'>(event.default_locale as 'id' | 'en');

    const { data, setData, post, processing, errors } = useForm<{
        name: string;
        email: string;
        answers: { [key: number]: any };
    }>({
        name: '',
        email: '',
        answers: {},
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('form.submit', window.location.pathname.split('/').pop()));
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
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={toggleLocale}
                        className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                    >
                        <Globe className="h-4 w-4 mr-2" />
                        {t.switchLang}
                    </Button>
                </div>

                {/* Banner */}
                <div className="relative">
                    {event.banner_image ? (
                        <img
                            src={event.banner_image}
                            alt={event.title}
                            className="w-full h-48 md:h-64 object-cover"
                        />
                    ) : (
                        <div className="w-full h-48 md:h-64 bg-gradient-to-r from-[#11224e] to-[#5c83c4]" />
                    )}
                    <div className="absolute inset-0 bg-black/30" />
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                        <div className="max-w-2xl mx-auto flex items-center gap-4">
                            {event.logo_image && (
                                <img
                                    src={event.logo_image}
                                    alt="Logo"
                                    className="h-16 w-16 rounded-lg bg-white p-2"
                                />
                            )}
                            <div>
                                <h1 className="text-2xl md:text-3xl font-bold text-white">
                                    {event.title}
                                </h1>
                                {event.description && (
                                    <p className="text-white/80 mt-1">{event.description}</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Form */}
                <div className="max-w-2xl mx-auto px-4 py-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Name & Email */}
                        <Card>
                            <CardContent className="pt-6 space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">{t.name}</Label>
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        className={errors.name ? 'border-red-500' : ''}
                                    />
                                    {errors.name && (
                                        <p className="text-sm text-red-500">{errors.name}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">{t.email}</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Questions */}
                        {questions.map((question) => (
                            <Card key={question.id}>
                                <CardContent className="pt-6">
                                    <div className="space-y-3">
                                        <Label className="text-base">
                                            {getQuestionText(question)}
                                            {question.is_required && (
                                                <span className="text-red-500 ml-1">*</span>
                                            )}
                                        </Label>

                                        {question.type === 'text' && (
                                            <Input
                                                value={data.answers[question.id] || ''}
                                                onChange={(e) => updateAnswer(question.id, e.target.value)}
                                                className={(errors as any)[`answers.${question.id}`] ? 'border-red-500' : ''}
                                            />
                                        )}

                                        {question.type === 'textarea' && (
                                            <Textarea
                                                value={data.answers[question.id] || ''}
                                                onChange={(e) => updateAnswer(question.id, e.target.value)}
                                                rows={4}
                                                className={(errors as any)[`answers.${question.id}`] ? 'border-red-500' : ''}
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

                                        {question.type === 'multiple_choice' && question.options && (
                                            <div className="space-y-2">
                                                {question.options.map((option, index) => (
                                                    <label
                                                        key={index}
                                                        className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-gray-50"
                                                    >
                                                        <input
                                                            type="radio"
                                                            name={`question_${question.id}`}
                                                            value={option}
                                                            checked={data.answers[question.id] === option}
                                                            onChange={(e) => updateAnswer(question.id, e.target.value)}
                                                            className="h-4 w-4 text-[#f17720]"
                                                        />
                                                        <span>{option}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        )}

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
                            disabled={processing}
                            className="w-full bg-[#f17720] hover:bg-[#d96a1a] text-lg py-6"
                        >
                            {processing ? t.submitting : t.submit}
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
            </div>
        </>
    );
}
