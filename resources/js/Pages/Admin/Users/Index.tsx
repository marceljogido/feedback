import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Plus, User as UserIcon, Settings, Trash2 } from 'lucide-react';

interface User {
    id: number;
    name: string;
    email: string;
    roles: { id: number; name: string }[];
}

interface PaginatedData<T> {
    data: T[];
}

interface Props {
    users: PaginatedData<User>;
}

export default function UserIndex({ users }: Props) {
    const deleteUser = (id: number) => {
        if (confirm('Apakah Anda yakin ingin menghapus user ini?')) {
            router.delete(route('admin.users.destroy', id), {
                onSuccess: () => {
                    // Success handling if needed
                }
            });
        }
    };

    return (
        <AdminLayout header="Manajemen User">
            <Head title="Manajemen User" />

            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <p className="text-gray-500">Kelola user admin dan manager di sini.</p>
                    <Link href={route('admin.users.create')}>
                        <Button className="bg-[#f17720] hover:bg-[#d96a1a]">
                            <Plus className="h-4 w-4 mr-2" /> Tambah User
                        </Button>
                    </Link>
                </div>

                <div className="grid gap-4">
                    {users.data.map((user) => (
                        <Card key={user.id}>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                                            <UserIcon className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-lg">{user.name}</h3>
                                            <p className="text-sm text-gray-500">{user.email}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="flex gap-2">
                                            {user.roles.map((role) => (
                                                <Badge key={role.id} variant="secondary" className="capitalize">
                                                    {role.name.replace('_', ' ')}
                                                </Badge>
                                            ))}
                                        </div>
                                        <div className="flex items-center gap-2 border-l pl-3 ml-3">
                                            <Link href={route('admin.users.edit', user.id)}>
                                                <Button variant="ghost" size="sm" title="Edit User">
                                                    <Settings className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                                onClick={() => deleteUser(user.id)}
                                                title="Hapus User"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </AdminLayout>
    );
}
