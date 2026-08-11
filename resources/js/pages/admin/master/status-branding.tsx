/**
 * Remark page: Admin — master status branding + drag & drop urutan.
 */
import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    ArrowLeft,
    GripVertical,
    Pencil,
    Plus,
    Trash2,
    X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useFlashToast } from '@/hooks/use-flash-toast';
import { dashboard } from '@/routes';

type StatusRow = {
    id: number;
    nama: string;
    sort_order: number;
    is_active: boolean;
    usage_count: number;
};

type Props = { items: StatusRow[] };

/** Remark komponen: master status branding dengan reorder drag & drop. */
export default function AdminStatusBrandingIndex({ items }: Props) {
    const [rows, setRows] = useState(items);
    const rowsRef = useRef(items);
    const [editing, setEditing] = useState<StatusRow | null>(null);
    const [dragId, setDragId] = useState<number | null>(null);
    const [savingOrder, setSavingOrder] = useState(false);
    useFlashToast();

    const createForm = useForm({
        nama: '',
        is_active: true,
    });

    const editForm = useForm({
        nama: '',
        is_active: true,
    });

    useEffect(() => {
        setRows(items);
        rowsRef.current = items;
    }, [items]);

    /** Remark fungsi: buka form edit inline. */
    function startEdit(row: StatusRow) {
        setEditing(row);
        editForm.setData({
            nama: row.nama,
            is_active: row.is_active,
        });
    }

    function submitCreate(e: React.FormEvent) {
        e.preventDefault();
        createForm.post('/admin/master/status-branding', {
            preserveScroll: true,
            onSuccess: () => {
                createForm.reset();
                createForm.setData('is_active', true);
            },
        });
    }

    function submitEdit(e: React.FormEvent) {
        e.preventDefault();
        if (!editing) {
            return;
        }
        editForm.put(`/admin/master/status-branding/${editing.id}`, {
            preserveScroll: true,
            onSuccess: () => setEditing(null),
        });
    }

    /** Remark fungsi: mulai drag baris. */
    function onDragStart(id: number) {
        setDragId(id);
    }

    /** Remark fungsi: pindahkan baris saat drag over. */
    function onDragOver(e: React.DragEvent, overId: number) {
        e.preventDefault();
        if (dragId == null || dragId === overId) {
            return;
        }

        setRows((prev) => {
            const from = prev.findIndex((r) => r.id === dragId);
            const to = prev.findIndex((r) => r.id === overId);
            if (from < 0 || to < 0) {
                return prev;
            }
            const next = [...prev];
            const [moved] = next.splice(from, 1);
            next.splice(to, 0, moved);
            const ordered = next.map((row, index) => ({
                ...row,
                sort_order: index + 1,
            }));
            rowsRef.current = ordered;
            return ordered;
        });
    }

    /** Remark fungsi: simpan urutan ke server setelah drop. */
    function onDragEnd() {
        setDragId(null);
        const current = rowsRef.current;
        const order = current.map((r) => r.id);
        const unchanged =
            order.length === items.length &&
            order.every((id, i) => id === items[i]?.id);
        if (unchanged) {
            return;
        }

        setSavingOrder(true);
        router.post(
            '/admin/master/status-branding/reorder',
            { order },
            {
                preserveScroll: true,
                onFinish: () => setSavingOrder(false),
            },
        );
    }

    return (
        <>
            <Head title="Master Status Branding" />
            <div className="bmd-page mx-auto flex w-full max-w-4xl flex-col gap-4 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-bold text-[#5a5c69]">
                            Master Status Branding
                        </h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Sumber awal: status unik dari{' '}
                            <code className="rounded bg-slate-100 px-1 text-xs">
                                mab_log_status_branding.change_status
                            </code>
                            . Drag baris untuk mengubah urutan proses.
                        </p>
                    </div>
                    <Link
                        href="/admin/master"
                        className="inline-flex items-center gap-1 text-sm text-slate-600"
                    >
                        <ArrowLeft className="size-3.5" />
                        Master Data
                    </Link>
                </div>

                <form
                    onSubmit={submitCreate}
                    className="bmd-panel flex flex-wrap items-end gap-3 p-4"
                >
                    <label className="min-w-[14rem] flex-1 text-sm">
                        <span className="mb-1 block font-semibold text-slate-600">
                            Nama status baru
                        </span>
                        <input
                            className="bmd-admin-input"
                            value={createForm.data.nama}
                            onChange={(e) =>
                                createForm.setData('nama', e.target.value)
                            }
                            placeholder="Contoh: Cancel"
                            required
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
                    <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2 text-xs text-slate-500">
                        <span>Drag ikon ⋮⋮ untuk mengubah urutan</span>
                        {savingOrder && (
                            <span className="font-semibold text-[#4e73df]">
                                Menyimpan urutan…
                            </span>
                        )}
                    </div>
                    <table className="bmd-table">
                        <thead>
                            <tr>
                                <th className="w-12" />
                                <th>Urutan</th>
                                <th>Nama Status</th>
                                <th>Dipakai</th>
                                <th>Status</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row) => (
                                <tr
                                    key={row.id}
                                    draggable={editing?.id !== row.id}
                                    onDragStart={() => onDragStart(row.id)}
                                    onDragOver={(e) => onDragOver(e, row.id)}
                                    onDragEnd={onDragEnd}
                                    className={
                                        dragId === row.id
                                            ? 'bg-sky-50 opacity-80'
                                            : undefined
                                    }
                                >
                                    {editing?.id === row.id ? (
                                        <td colSpan={6}>
                                            <form
                                                onSubmit={submitEdit}
                                                className="flex flex-wrap items-end gap-3 py-1"
                                            >
                                                <label className="min-w-[14rem] flex-1 text-sm">
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
                                            <td className="cursor-grab text-slate-400 active:cursor-grabbing">
                                                <GripVertical className="size-4" />
                                            </td>
                                            <td className="font-mono text-sm">
                                                {row.sort_order}
                                            </td>
                                            <td className="font-semibold">
                                                {row.nama}
                                            </td>
                                            <td>{row.usage_count}</td>
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
                                                                    `Hapus status "${row.nama}"?`,
                                                                )
                                                            ) {
                                                                router.delete(
                                                                    `/admin/master/status-branding/${row.id}`,
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
                            {rows.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="py-6 text-center text-slate-500"
                                    >
                                        Belum ada status. Tambahkan di atas.
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

AdminStatusBrandingIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Master Data', href: '/admin/master' },
        {
            title: 'Status Branding',
            href: '/admin/master/status-branding',
        },
    ],
};
