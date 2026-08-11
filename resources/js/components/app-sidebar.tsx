import { Link } from '@inertiajs/react';
import {
    BookOpen,
    Database,
    FolderGit2,
    LayoutGrid,
    Package,
    Settings2,
    ShoppingCart,
    Store,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import type { NavItem } from '@/types';

/**
 * Remark komponen: sidebar utama BMD.
 * Modul: Dashboard, Toko, Katalog, Pengajuan, Admin Katalog, Master Data.
 */
const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },
    {
        title: 'Toko',
        href: '/toko',
        icon: Store,
    },
    {
        title: 'Katalog',
        href: '/katalog',
        icon: Package,
    },
    {
        title: 'Pengajuan',
        href: '/pengajuan',
        icon: ShoppingCart,
    },
    {
        title: 'Admin Katalog',
        href: '/admin/katalog',
        icon: Settings2,
    },
    {
        title: 'Master Data',
        href: '/admin/master',
        icon: Database,
    },
];

const footerNavItems: NavItem[] = [
    {
        title: 'Repository',
        href: 'https://github.com/laravel/react-starter-kit',
        icon: FolderGit2,
    },
    {
        title: 'Documentation',
        href: 'https://laravel.com/docs/starter-kits#react',
        icon: BookOpen,
    },
];

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
