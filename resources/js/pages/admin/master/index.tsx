/**
 * Remark page: Admin — hub master data BMD.
 */
import { Head, Link } from '@inertiajs/react';
import { ChevronRight, Database } from 'lucide-react';
import { dashboard } from '@/routes';

type MasterCard = {
    key: string;
    title: string;
    description: string;
    href: string;
    count: number;
};

type Props = {
    masters: MasterCard[];
};

/** Remark komponen: daftar pintu masuk master data. */
export default function AdminMasterIndex({ masters }: Props) {
    return (
        <>
            <Head title="Master Data" />
            <div className="bmd-page mx-auto flex w-full max-w-4xl flex-col gap-4 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-bold text-[#5a5c69]">
                            Master Data
                        </h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Kelola data referensi yang dipakai modul Toko,
                            Katalog, dan Branding.
                        </p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 rounded bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                        <Database className="size-3.5" />
                        {masters.length} master
                    </span>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                    {masters.map((master) => (
                        <Link
                            key={master.key}
                            href={master.href}
                            className="bmd-master-card group"
                        >
                            <div className="flex items-start justify-between gap-2">
                                <h2 className="bmd-master-card-title">
                                    {master.title}
                                </h2>
                                <ChevronRight className="bmd-master-card-chevron size-4 shrink-0" />
                            </div>
                            <p className="text-sm leading-relaxed text-slate-500">
                                {master.description}
                            </p>
                            <div className="mt-auto pt-2 text-xs font-semibold text-slate-400">
                                {master.count} data
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </>
    );
}

AdminMasterIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Master Data', href: '/admin/master' },
    ],
};
