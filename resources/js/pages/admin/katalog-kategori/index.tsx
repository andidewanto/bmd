/**
 * Remark page: Admin — master data kategori katalog.
 */
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { dashboard } from '@/routes';

type Kategori = {
    id: number;
    nama: string;
    sort_order: number;
    is_active: boolean;
    item_count: number;
};

type Props = { items: Kategori[] };

export default function AdminKatalogKategoriIndex({ items }: Props) {
    const { flash } = usePage().props as {
        flash?: { success?: string; error?: string };
    };
    const [editing, setEditing] = useState<Kategori | null>(null);

    const createForm = useForm({
        nama: '',
        sort_order: '',
        is_active: true,
    });

    const editForm = useForm({
        nama: '',
        sort_order: 0,
        is_active: true,
    });

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash?.success, flash?.error]);

    /** Remark fungsi: buka form edit inline. */
    function startEdit(row: Kategori) {
        setEditing(row);
        editForm.setData({
            nama: row.nama,
            sort_order: row.sort_order,
            is_active: row.is_active,
        });
    }

    function submitCreate(e: React.FormEvent) {
        e.preventDefault();
        createForm.transform((data) => ({
            ...data,
            sort_order:
                data.sort_order === '' ? null : Number(data.sort_order),
        }));
        createForm.post('/admin/katalog/kategori', {
            preserveScroll: true,
            onSuccess: () => {
                createForm.reset();
                createForm.setData('is_active', true);
            },
            onFinish: () => createForm.transform((d) => d),
        });
    }

    function submitEdit(e: React.FormEvent) {
        e.preventDefault();
        if (!editing) {
            return;
        }
        editForm.put(`/admin/katalog/kategori/${editing.id}`, {
            preserveScroll: true,
            onSuccess: () => setEditing(null),
        });
    }

    return (
        <>
            <Head title="Master Kategori Katalog" />
            <div className="bmd-page mx-auto flex w-full max-w-4xl flex-col gap-4 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h1 className="text-xl font-bold text-[#5a5c69]">
                        Master Kategori Katalog
                    </h1>
                    <Link
                        href="/admin/katalog"
                        className="inline-flex items-center gap-1 text-sm text-slate-600"
                    >
                        <ArrowLeft className="size-3.5" />
                        Admin Katalog
                    </Link>
                </div>

                <form
                    onSubmit={submitCreate}
                    className="bmd-panel flex flex-wrap items-end gap-3 p-4"
                >
                    <label className="min-w-[12rem] flex-1 text-sm">
                        <span className="mb-1 block font-semibold text-slate-600">
                            Nama kategori baru
                        </span>
                        <input
                            className="bmd-admin-input"
                            value={createForm.data.nama}
                            onChange={(e) =>
                                createForm.setData('nama', e.target.value)
                            }
                            placeholder="Contoh: Booth"
                            required
                        />
                    </label>
                    <label className="w-28 text-sm">
                        <span className="mb-1 block font-semibold text-slate-600">
                            Urutan
                        </span>
                        <input
                            type="number"
                            className="bmd-admin-input"
                            value={createForm.data.sort_order}
                            onChange={(e) =>
                                createForm.setData(
                                    'sort_order',
                                    e.target.value,
                                )
                            }
                            placeholder="Auto"
                        />
                    </label>
                    <label className="flex items-center gap-2 pb-2 text-sm font-semibold text-slate-600">
                        <input
                            type="checkbox"
                            checked={createForm.data.is_active}
                            onChange={(e) =>
                                createForm.setData(
                                    'is_active',
                                    e.target.checked,
                                )
                            }
                        />
                        Aktif
                    </label>
                    <button
                        type="submit"
                        className="bmd-btn-primary"
                        disabled={createForm.processing}
                    >
                        <Plus className="size-3.5" />
                        Tambah
                    </button>
                </form>

                <div className="bmd-panel overflow-x-auto">
                    <table className="bmd-table">
                        <thead>
                            <tr>
                                <th>Urutan</th>
                                <th>Nama</th>
                                <th>Item</th>
                                <th>Status</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((row) => (
                                <tr key={row.id}>
                                    {editing?.id === row.id ? (
                                        <td colSpan={5}>
                                            <form
                                                onSubmit={submitEdit}
                                                className="flex flex-wrap items-end gap-3 py-1"
                                            >
                                                <label className="w-24 text-sm">
                                                    <span className="mb-1 block font-semibold">
                                                        Urutan
                                                    </span>
                                                    <input
                                                        type="number"
                                                        className="bmd-admin-input"
                                                        value={
                                                            editForm.data
                                                                .sort_order
                                                        }
                                                        onChange={(e) =>
                                                            editForm.setData(
                                                                'sort_order',
                                                                Number(
                                                                    e.target
                                                                        .value,
                                                                ),
                                                            )
                                                        }
                                                    />
                                                </label>
                                                <label className="min-w-[12rem] flex-1 text-sm">
                                                    <span className="mb-1 block font-semibold">
                                                        Nama
                                                    </span>
                                                    <input
                                                        className="bmd-admin-input"
                                                        value={
                                                            editForm.data.nama
                                                        }
                                                        onChange={(e) =>
                                                            editForm.setData(
                                                                'nama',
                                                                e.target.value,
                                                            )
                                                        }
                                                        required
                                                    />
                                                </label>
                                                <label className="flex items-center gap-2 pb-2 text-sm font-semibold">
                                                    <input
                                                        type="checkbox"
                                                        checked={
                                                            editForm.data
                                                                .is_active
                                                        }
                                                        onChange={(e) =>
                                                            editForm.setData(
                                                                'is_active',
                                                                e.target
                                                                    .checked,
                                                            )
                                                        }
                                                    />
                                                    Aktif
                                                </label>
                                                <button
                                                    type="submit"
                                                    className="bmd-btn-primary"
                                                    disabled={
                                                        editForm.processing
                                                    }
                                                >
                                                    Simpan
                                                </button>
                                                <button
                                                    type="button"
                                                    className="inline-flex items-center gap-1 rounded border px-2 py-1 text-sm"
                                                    onClick={() =>
                                                        setEditing(null)
                                                    }
                                                >
                                                    <X className="size-3.5" />
                                                    Batal
                                                </button>
                                            </form>
                                        </td>
                                    ) : (
                                        <>
                                            <td>{row.sort_order}</td>
                                            <td className="font-semibold">
                                                {row.nama}
                                            </td>
                                            <td>{row.item_count}</td>
                                            <td>
                                                {row.is_active ? (
                                                    <span className="rounded bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700">
                                                        Aktif
                                                    </span>
                                                ) : (
                                                    <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-500">
                                                        Nonaktif
                                                    </span>
                                                )}
                                            </td>
                                            <td>
                                                <div className="flex gap-2">
                                                    <button
                                                        type="button"
                                                        className="inline-flex items-center gap-1 text-sm text-[#4e73df]"
                                                        onClick={() =>
                                                            startEdit(row)
                                                        }
                                                    >
                                                        <Pencil className="size-3.5" />
                                                        Edit
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="inline-flex items-center gap-1 text-sm text-red-600"
                                                        onClick={() => {
                                                            if (
                                                                confirm(
                                                                    `Hapus kategori "${row.nama}"?`,
                                                                )
                                                            ) {
                                                                router.delete(
                                                                    `/admin/katalog/kategori/${row.id}`,
                                                                );
                                                            }
                                                        }}
                                                    >
                                                        <Trash2 className="size-3.5" />
                                                        Hapus
                                                    </button>
                                                </div>
                                            </td>
                                        </>
                                    )}
                                </tr>
                            ))}
                            {items.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={5}
                                        className="py-6 text-center text-slate-500"
                                    >
                                        Belum ada kategori. Tambahkan di atas.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}

AdminKatalogKategoriIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Admin Katalog', href: '/admin/katalog' },
        { title: 'Kategori', href: '/admin/katalog/kategori' },
    ],
};
