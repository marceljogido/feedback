import { Link, usePage } from '@inertiajs/react';
import { PropsWithChildren, ReactNode, useState } from 'react';
import {
    Settings,
    Menu,
    X,
    LogOut,
    ChevronDown,
    ChevronRight,
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
    emoji: string;
    current: boolean;
    children?: NavItem[];
}

interface CurrentEvent {
    id: number;
    title: string;
}

interface CurrentForm {
    id: number;
    name: string;
}

export default function AdminLayout({
    header,
    children,
}: PropsWithChildren<{ header?: ReactNode }>) {
    const pageProps = usePage().props as any;
    const { auth } = pageProps;
    const user = auth.user;
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);

    // Get current context from page props (if available)
    const currentEvent: CurrentEvent | null = pageProps.event || null;
    const currentForm: CurrentForm | null = pageProps.form || null;

    // Check which route we're on
    const isOnEventForms = route().current('admin.events.forms') || route().current('admin.events.forms.create');
    const isOnFormPages = route().current('admin.forms.*');
    const isInEventContext = isOnEventForms || isOnFormPages;

    const navigation: NavItem[] = [
        {
            name: 'Dashboard',
            href: route('admin.dashboard'),
            emoji: '📊',
            current: route().current('admin.dashboard*'),
        },
        {
            name: 'Acara',
            href: route('admin.events.index'),
            emoji: '📅',
            current: route().current('admin.events.index') || route().current('admin.events.create') || route().current('admin.events.edit'),
        },
        {
            name: 'Semua Jawaban',
            href: route('admin.responses.index'),
            emoji: '💬',
            current: route().current('admin.responses.*'),
        },
        {
            name: 'Manajemen User',
            href: route('admin.users.index'),
            emoji: '👤',
            current: route().current('admin.users.*'),
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
                className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-[#11224e] transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    } ${desktopSidebarOpen ? 'lg:translate-x-0' : 'lg:-translate-x-full'}`}
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
                    {navigation
                        .filter(item => {
                            if (item.name === 'Manajemen User') {
                                return user.roles?.includes('super_admin');
                            }
                            return true;
                        })
                        .map((item) => (
                            <div key={item.name}>
                                <Link
                                    href={item.href}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${item.current
                                        ? 'bg-white/10 text-white'
                                        : 'text-gray-300 hover:bg-white/5 hover:text-white'
                                        }`}
                                >
                                    <span className="text-xl">{item.emoji}</span>
                                    {item.name}
                                </Link>

                                {/* Show submenu for Acara when in event/form context */}
                                {item.name === 'Acara' && isInEventContext && currentEvent && (
                                    <div className="ml-4 mt-1 pl-4 border-l-2 border-white/20">
                                        {/* Current Event */}
                                        <Link
                                            href={route('admin.events.forms', currentEvent.id)}
                                            className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium transition-colors ${isOnEventForms && !isOnFormPages
                                                ? 'bg-[#f17720] text-white'
                                                : 'text-gray-300 hover:bg-white/5 hover:text-white'
                                                }`}
                                        >
                                            <span>📋</span>
                                            <span className="truncate">{currentEvent.title}</span>
                                        </Link>

                                        {/* Current Form (if on form page) */}
                                        {isOnFormPages && currentForm && (
                                            <div className="ml-3 mt-1 pl-3 border-l border-white/10">
                                                <div className="flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium bg-[#f17720] text-white">
                                                    <span>📝</span>
                                                    <span className="truncate">{currentForm.name}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                </nav>
            </aside>

            {/* Main content */}
            <div className={`transition-all duration-300 ${desktopSidebarOpen ? 'lg:pl-64' : 'lg:pl-0'}`}>
                {/* Top bar */}
                <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-white px-4 lg:px-8">
                    <div className="flex items-center gap-4">
                        <button
                            className="lg:hidden"
                            onClick={() => setSidebarOpen(true)}
                        >
                            <Menu className="h-6 w-6 text-gray-600" />
                        </button>

                        <button
                            className="hidden lg:block text-gray-600 hover:text-gray-900"
                            onClick={() => setDesktopSidebarOpen(!desktopSidebarOpen)}
                        >
                            <Menu className="h-6 w-6" />
                        </button>

                        <div className="hidden lg:block">
                            {header && (
                                <h1 className="text-xl font-semibold text-gray-900">
                                    {header}
                                </h1>
                            )}
                        </div>
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
