import { Head, usePage } from '@inertiajs/react';
import { CheckCircle, Pencil } from 'lucide-react';
import { Button } from '@/Components/ui/button';

interface Props {
    event: {
        title: string;
        logo_image: string | null;
    };
    form?: {
        name: string;
        slug: string;
        allow_edit: boolean;
        thank_you_title?: string;
        thank_you_message?: string;
        thank_you_button_text?: string;
        thank_you_button_url?: string;
    };
}

export default function ThankYou({ event, form }: Props) {
    const { props } = usePage();
    const flash = (props as any).flash || {};
    const editToken = flash.edit_token;
    const wasEdited = flash.edited;

    const editUrl = editToken && form?.slug
        ? `/form/${form.slug}/edit/${editToken}`
        : null;

    return (
        <>
            <Head title="Terima Kasih" />

            <div className="min-h-screen bg-gradient-to-br from-[#11224e] to-[#5c83c4] flex items-center justify-center px-4">
                <div className="text-center">
                    {event.logo_image && (
                        <img
                            src={event.logo_image}
                            alt="Logo"
                            className="h-20 w-20 mx-auto rounded-lg bg-white p-3 mb-8"
                        />
                    )}

                    <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 max-w-md">
                        <div className="mb-6">
                            <CheckCircle className="h-20 w-20 mx-auto text-green-500" />
                        </div>

                        <h1 className="text-3xl font-bold text-gray-900 mb-4">
                            {wasEdited
                                ? 'Berhasil Diperbarui!'
                                : (form?.thank_you_title || 'Terima Kasih!')}
                        </h1>

                        <p className="text-gray-600 text-lg whitespace-pre-wrap">
                            {wasEdited
                                ? <>Jawaban Anda untuk <strong>{event.title}</strong> telah berhasil diperbarui.</>
                                : (form?.thank_you_message || <>Testimoni Anda untuk <strong>{event.title}</strong> telah berhasil dikirim.</>)
                            }
                        </p>

                        {form?.thank_you_button_text && form?.thank_you_button_url && (
                            <div className="mt-8">
                                <a
                                    href={form.thank_you_button_url}
                                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-[#f17720] text-white hover:bg-[#d96a1a] h-10 px-4 py-2 w-full md:w-auto"
                                >
                                    {form.thank_you_button_text}
                                </a>
                            </div>
                        )}

                        <p className="text-gray-500 mt-4">
                            Kami sangat menghargai waktu dan masukan Anda.
                        </p>

                        {editUrl && (
                            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                                <p className="text-sm text-amber-800 mb-3">
                                    ✏️ Anda bisa mengedit jawaban Anda nanti lewat link ini:
                                </p>
                                <div className="flex gap-2">
                                    <input
                                        readOnly
                                        value={`${window.location.origin}${editUrl}`}
                                        className="flex-1 text-xs px-3 py-2 border rounded-lg bg-white text-gray-600 select-all"
                                        onClick={(e) => (e.target as HTMLInputElement).select()}
                                    />
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                            navigator.clipboard.writeText(`${window.location.origin}${editUrl}`);
                                        }}
                                    >
                                        📋
                                    </Button>
                                </div>
                                <p className="text-xs text-amber-600 mt-2">
                                    Simpan link ini! Link hanya berlaku untuk jawaban Anda.
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="mt-8">
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
