import { Head } from '@inertiajs/react';
import { CheckCircle } from 'lucide-react';

interface Props {
    event: {
        title: string;
        logo_image: string | null;
    };
}

export default function ThankYou({ event }: Props) {
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
                            Terima Kasih!
                        </h1>

                        <p className="text-gray-600 text-lg">
                            Testimoni Anda untuk <strong>{event.title}</strong> telah berhasil dikirim.
                        </p>

                        <p className="text-gray-500 mt-4">
                            Kami sangat menghargai waktu dan masukan Anda.
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
