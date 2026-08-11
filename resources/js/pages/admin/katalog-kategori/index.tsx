/**
 * Remark page: Admin — master data kategori katalog.
 */
import { Head, Link, router, useForm } from '@inertiajs/react';
import { ArrowLeft, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useFlashToast } from '@/hooks/use-flash-toast';
import { dashboard } from '@/routes';

type Kategori = {
    id: number;
    nama: string;
    kode: string;
    sort_order: number;
    is_active: boolean;
    item_count: number;
};

type Props = { items: Kategori[] };

type EditFormData = {
    nama: string;
    kode: string;
    sort_order: number | '';
    is_active: boolean;
};

/** Remark komponen: form edit inline (komponen terpisah agar React Compiler track props). */
function KategoriEditRow({
    row,
    onCancel,
}: {
    row: Kategori;
    onCancel: () => void;
}) {
    const form = useForm<EditFormData>({
        nama: row.nama,
        kode: row.kode,
        sort_order: row.sort_order,
        is_active: row.is_active,
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        form.transform((data) => ({
            nama: data.nama.trim(),
            kode: data.kode.trim().toUpperCase(),
            sort_order:
                data.sort_order === '' || data.sort_order === null
                    ? null
                    : Number(data.sort_order),
            is_active: Boolean(data.is_active),
        }));
        form.put(`/admin/katalog/kategori/${row.id}`, {
            preserveScroll: true,
            onSuccess: () => onCancel(),
            onError: (errors) => {
                const first = Object.values(errors)[0];
                toast.error(
                    typeof first === 'string'
                        ? first
                        : 'Gagal menyimpan kategori.',
                );
            },
            onFinish: () => form.transform((d) => d),
        });
    }

    return (
        <td colSpan={6}>
            <form
                onSubmit={submit}
                className="flex flex-wrap items-end gap-3 py-1"
            >
                <label className="w-24 text-sm">
                    <span className="mb-1 block font-semibold">Urutan</span>
                    <input
                        type="number"
                        className="bmd-admin-input"
                        value={form.data.sort_order}
                        onChange={(e) =>
                            form.setData(
                                'sort_order',
                                e.target.value === ''
                                    ? ''
                                    : Number(e.target.value),
                            )
                        }
                    />
                    {form.errors.sort_order && (
                        <span className="mt-1 block text-xs text-red-600">
                            {form.errors.sort_order}
                        </span>
                    )}
                </label>
                <label className="w-24 text-sm">
                    <span className="mb-1 block font-semibold">Kode</span>
                    <input
                        className="bmd-admin-input uppercase"
                        value={form.data.kode}
                        onChange={(e) =>
                            form.setData(
                                'kode',
                                e.target.value.toUpperCase().replace(/[^A-Z0-9]/gi, ''),
                            )
                        }
                        maxLength={5}
                        required
                        title="Huruf/angka, diawali huruf (contoh: B, C, PT)"
                    />
                    {form.errors.kode && (
                        <span className="mt-1 block text-xs text-red-600">
                            {form.errors.kode}
                        </span>
                    )}
                </label>
                <label className="min-w-[12rem] flex-1 text-sm">
                    <span className="mb-1 block font-semibold">Nama</span>
                    <input
                        className="bmd-admin-input"
                        value={form.data.nama}
                        onChange={(e) => form.setData('nama', e.target.value)}
                        required
                    />
                    {form.errors.nama && (
                        <span className="mt-1 block text-xs text-red-600">
                            {form.errors.nama}
                        </span>
                    )}
                </label>
                <label className="flex items-center gap-2 pb-2 text-sm font-semibold">
                    <input
                        type="checkbox"
                        checked={form.data.is_active}
                        onChange={(e) =>
                            form.setData('is_active', e.target.checked)
                        }
                    />
                    Aktif
                </label>
                <button
                    type="submit"
                    className="bmd-btn-primary"
                    disabled={form.processing}
                >
                    Simpan
                </button>
                <button
                    type="button"
                    className="inline-flex items-center gap-1 rounded border px-2 py-1 text-sm"
                    onClick={onCancel}
                >
                    <X className="size-3.5" />
                    Batal
                </button>
            </form>
        </td>
    );
}

export default function AdminKatalogKategoriIndex({ items }: Props) {
    const [editingId, setEditingId] = useState<number | null>(null);
    useFlashToast();

    const createForm = useForm({
        nama: '',
        kode: '',
        sort_order: '' as number | '',
        is_active: true,
    });

    function submitCreate(e: React.FormEvent) {
        e.preventDefault();
        createForm.transform((data) => ({
            nama: data.nama.trim(),
            kode: data.kode.trim().toUpperCase(),
            sort_order:
                data.sort_order === '' || data.sort_order === null
                    ? null
                    : Number(data.sort_order),
            is_active: Boolean(data.is_active),
        }));
        createForm.post('/admin/katalog/kategori', {
            preserveScroll: true,
            onSuccess: () => {
                createForm.reset();
                createForm.setData('is_active', true);
            },
            onError: (errors) => {
                const first = Object.values(errors)[0];
                toast.error(
                    typeof first === 'string'
                        ? first
                        : 'Gagal menambah kategori.',
                );
            },
            onFinish: () => createForm.transform((d) => d),
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
                    <label className="w-24 text-sm">
                        <span className="mb-1 block font-semibold text-slate-600">
                            Kode
                        </span>
                        <input
                            className="bmd-admin-input uppercase"
                            value={createForm.data.kode}
                            onChange={(e) =>
                                createForm.setData(
                                    'kode',
                                    e.target.value
                                        .toUpperCase()
                                        .replace(/[^A-Z0-9]/gi, ''),
                                )
                            }
                            placeholder="B"
                            maxLength={5}
                            required
                            title="Huruf/angka, diawali huruf (contoh: B, C, PT)"
                        />
                        {createForm.errors.kode && (
                            <span className="mt-1 block text-xs text-red-600">
                                {createForm.errors.kode}
                            </span>
                        )}
                    </label>
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
                        {createForm.errors.nama && (
                            <span className="mt-1 block text-xs text-red-600">
                                {createForm.errors.nama}
                            </span>
                        )}
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
                                    e.target.value === ''
                                        ? ''
                                        : Number(e.target.value),
                                )
                            }
                            placeholder="Auto"
                        />
                        {createForm.errors.sort_order && (
                            <span className="mt-1 block text-xs text-red-600">
                                {createForm.errors.sort_order}
                            </span>
                        )}
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
                                <th>Kode</th>
                                <th>Nama</th>
                                <th>Item</th>
                                <th>Status</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((row) => (
                                <tr key={row.id}>
                                    {editingId === row.id ? (
                                        <KategoriEditRow
                                            row={row}
                                            onCancel={() => setEditingId(null)}
                                        />
                                    ) : (
                                        <>
                                            <td>{row.sort_order}</td>
                                            <td className="font-mono font-bold tracking-wide">
                                                {row.kode}
                                            </td>
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
                                                            setEditingId(
                                                                row.id,
                                                            )
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
                                                                    {
                                                                        onError:
                                                                            () =>
                                                                                toast.error(
                                                                                    'Gagal menghapus kategori.',
                                                                                ),
                                                                    },
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
                                        colSpan={6}
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
