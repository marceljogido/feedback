import { Head } from '@inertiajs/react';
import { Lock, Clock } from 'lucide-react';

interface Props {
    event: {
        title: string;
        logo_image: string | null;
    };
    form?: {
        name: string;
    };
    message?: string;
    message_en?: string;
}

export default function Closed({ event, form, message }: Props) {
    const isScheduled = !!message;
    return (
        <>
            <Head title="Form Ditutup" />

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
                            {isScheduled ? (
                                <Clock className="h-20 w-20 mx-auto text-amber-400" />
                            ) : (
                                <Lock className="h-20 w-20 mx-auto text-gray-400" />
                            )}
                        </div>

                        <h1 className="text-3xl font-bold text-gray-900 mb-4">
                            {isScheduled ? 'Jadwal Form' : 'Form Ditutup'}
                        </h1>

                        <p className="text-gray-600 text-lg">
                            {message || <>Form testimoni untuk <strong>{event.title}</strong> sudah ditutup.</>}
                        </p>

                        <p className="text-gray-500 mt-4">
                            Silakan hubungi penyelenggara jika Anda memiliki pertanyaan.
                        </p>
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
