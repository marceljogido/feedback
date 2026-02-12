import AdminLayout from '@/Layouts/AdminLayout';
import { PageProps } from '@/types';
import { Head } from '@inertiajs/react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';

export default function Edit({
    mustVerifyEmail,
    status,
}: PageProps<{ mustVerifyEmail: boolean; status?: string }>) {
    return (
        <AdminLayout header="Pengaturan Profil">
            <Head title="Profil" />

            <div className="space-y-6 max-w-7xl mx-auto">
                <div className="bg-white p-4 shadow sm:rounded-lg sm:p-8 border">
                    <UpdateProfileInformationForm
                        mustVerifyEmail={mustVerifyEmail}
                        status={status}
                        className="max-w-xl"
                    />
                </div>

                <div className="bg-white p-4 shadow sm:rounded-lg sm:p-8 border">
                    <UpdatePasswordForm className="max-w-xl" />
                </div>

                <div className="bg-white p-4 shadow sm:rounded-lg sm:p-8 border">
                    <DeleteUserForm className="max-w-xl" />
                </div>
            </div>
        </AdminLayout>
    );
}
