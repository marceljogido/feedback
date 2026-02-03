import { Link, usePage } from '@inertiajs/react';
import { PropsWithChildren, ReactNode, useState } from 'react';
import {
    LayoutDashboard,
    Calendar,
    Users,
    Settings,
    Menu,
    X,
    LogOut,
    ChevronDown,
    FileText,
    MessageSquare,
} from 'lucide-react';
import { Button } from '@/Components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/Components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/Components/ui/avatar';

interface NavItem {
    name: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    current: boolean;
}

export default function AdminLayout({
    header,
    children,
}: PropsWithChildren<{ header?: ReactNode }>) {
    const { auth } = usePage().props as any;
    const user = auth.user;
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const navigation: NavItem[] = [
        {
            name: 'Dashboard',
            href: route('admin.dashboard'),
            icon: LayoutDashboard,
            current: route().current('admin.dashboard*'),
        },
        {
            name: 'Events',
            href: route('admin.events.index'),
            icon: Calendar,
            current: route().current('admin.events.index') || route().current('admin.events.create'),
        },
        {
            name: 'Kelola Form',
            href: route('admin.forms.index'),
            icon: FileText,
            current: route().current('admin.forms.index'),
        },
        {
            name: 'Respons',
            href: route('admin.responses.index'),
            icon: MessageSquare,
            current: route().current('admin.responses.index'),
        },
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-[#11224e] transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                <div className="flex h-16 items-center justify-between px-4">
                    <Link href={route('admin.dashboard')} className="flex items-center">
                        <img
                            src="/images/logo-white.svg"
                            alt="DIGIOH"
                            className="h-8 w-auto"
                        />
                    </Link>
                    <button
                        className="lg:hidden text-white"
                        onClick={() => setSidebarOpen(false)}
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <nav className="mt-8 px-4 space-y-1">
                    {navigation.map((item) => (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${item.current
                                ? 'bg-white/10 text-white'
                                : 'text-gray-300 hover:bg-white/5 hover:text-white'
                                }`}
                        >
                            <item.icon className="h-5 w-5" />
                            {item.name}
                        </Link>
                    ))}
                </nav>
            </aside>

            {/* Main content */}
            <div className="lg:pl-64">
                {/* Top bar */}
                <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-white px-4 lg:px-8">
                    <button
                        className="lg:hidden"
                        onClick={() => setSidebarOpen(true)}
                    >
                        <Menu className="h-6 w-6 text-gray-600" />
                    </button>

                    <div className="flex-1 lg:hidden" />

                    <div className="hidden lg:block">
                        {header && (
                            <h1 className="text-xl font-semibold text-gray-900">
                                {header}
                            </h1>
                        )}
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                    <AvatarFallback className="bg-[#11224e] text-white">
                                        {user.name.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <span className="hidden md:block text-sm font-medium">
                                    {user.name}
                                </span>
                                <ChevronDown className="h-4 w-4 text-gray-500" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem asChild>
                                <Link href={route('profile.edit')}>
                                    <Settings className="mr-2 h-4 w-4" />
                                    Profil
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <Link href={route('logout')} method="post" as="button" className="w-full">
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Keluar
                                </Link>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </header>

                {/* Page header for mobile */}
                {header && (
                    <div className="lg:hidden border-b bg-white px-4 py-4">
                        <h1 className="text-xl font-semibold text-gray-900">{header}</h1>
                    </div>
                )}

                {/* Page content */}
                <main className="p-4 lg:p-8">{children}</main>
            </div>
        </div>
    );
}
