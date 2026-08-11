/**
 * Remark page: Admin — daftar item katalog.
 */
import { Head, Link, router } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useFlashToast } from '@/hooks/use-flash-toast';
import { formatHargaAngka } from '@/lib/format';
import { dashboard } from '@/routes';

type Item = {
    id: number;
    no: number;
    kode: string;
    kategori: string;
    nama_branding: string;
    foto_url: string;
    harga_min: number | null;
    harga_max: number | null;
    photos: { id: number }[];
};

type Props = { items: Item[] };

export default function AdminKatalogIndex({ items }: Props) {
    useFlashToast();

    return (
        <>
            <Head title="Admin Katalog" />
            <div className="bmd-page flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h1 className="text-xl font-bold text-[#5a5c69]">
                        Admin Katalog
                    </h1>
                    <div className="flex flex-wrap gap-2">
                        <Link
                            href="/admin/katalog/kategori"
                            className="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700"
                        >
                            Master Kategori
                        </Link>
                        <Link
                            href="/admin/katalog/create"
                            className="bmd-btn-primary"
                        >
                            <Plus className="size-3.5" />
                            Tambah Item
                        </Link>
                    </div>
                </div>

                <div className="bmd-panel overflow-x-auto">
                    <table className="bmd-table">
                        <thead>
                            <tr>
                                <th>No</th>
                                <th>Thumb</th>
                                <th>Kode</th>
                                <th>Nama</th>
                                <th>Kategori</th>
                                <th>Harga</th>
                                <th>Foto</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item) => (
                                <tr key={item.id}>
                                    <td>{item.no}</td>
                                    <td>
                                        <img
                                            src={item.foto_url}
                                            alt={item.kode}
                                            className="size-12 rounded border object-cover"
                                        />
                                    </td>
                                    <td className="font-semibold">{item.kode}</td>
                                    <td>{item.nama_branding}</td>
                                    <td>{item.kategori}</td>
                                    <td>
                                        {formatHargaAngka(
                                            item.harga_min,
                                            item.harga_max,
                                        )}
                                    </td>
                                    <td>{item.photos?.length ?? 0}</td>
                                    <td>
                                        <div className="flex gap-2">
                                            <Link
                                                href={`/admin/katalog/${item.id}/edit`}
                                                className="inline-flex items-center gap-1 text-sm text-[#4e73df]"
                                            >
                                                <Pencil className="size-3.5" />
                                                Edit
                                            </Link>
                                            <button
                                                type="button"
                                                className="inline-flex items-center gap-1 text-sm text-red-600"
                                                onClick={() => {
                                                    if (
                                                        confirm(
                                                            `Hapus ${item.kode}?`,
                                                        )
                                                    ) {
                                                        router.delete(
                                                            `/admin/katalog/${item.id}`,
                                                        );
                                                    }
                                                }}
                                            >
                                                <Trash2 className="size-3.5" />
                                                Hapus
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}

AdminKatalogIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Admin Katalog', href: '/admin/katalog' },
    ],
};
