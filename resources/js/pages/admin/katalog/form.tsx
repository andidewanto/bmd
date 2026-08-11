/**
 * Remark page: Admin — form create/edit item katalog + kelola foto/thumbnail.
 */
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import type { PendingVisit } from '@inertiajs/core';
import {
    ArrowLeft,
    ChevronDown,
    ImagePlus,
    Star,
    Trash2,
    Upload,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { dashboard } from '@/routes';

type Photo = {
    id: number;
    url: string;
    is_thumbnail: boolean;
};

type Item = {
    id: number;
    no: number;
    kode: string;
    kategori: string;
    nama_branding: string;
    spek_branding: string | null;
    satuan: string | null;
    tipe_toko: string | null;
    lifetime: number | null;
    dim_cm: string | null;
    harga_min: number | null;
    harga_max: number | null;
    photos: Photo[];
};

type Props = {
    item: Item | null;
    kategoriOptions: string[];
    satuanOptions: string[];
};

/** Remark fungsi: normalisasi satuan legacy → Unit | m2. */
function normalizeSatuan(value: string | null | undefined): 'Unit' | 'm2' {
    const s = (value || '').trim().toLowerCase().replace('²', '2');
    return s === 'm2' ? 'm2' : 'Unit';
}

export default function AdminKatalogForm({
    item,
    kategoriOptions,
    satuanOptions = ['Unit', 'm2'],
}: Props) {
    const isEdit = item != null;
    const { flash } = usePage().props as {
        flash?: { success?: string; error?: string };
    };
    const [asThumbnail, setAsThumbnail] = useState(false);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const [createPreview, setCreatePreview] = useState<string | null>(null);
    const [leaveVisit, setLeaveVisit] = useState<PendingVisit | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const bypassLeaveRef = useRef(false);
    const isDirtyRef = useRef(false);

    const form = useForm({
        no: item?.no ?? 1,
        kode: item?.kode ?? '',
        kategori: item?.kategori ?? kategoriOptions[0] ?? '',
        nama_branding: item?.nama_branding ?? '',
        spek_branding: item?.spek_branding ?? '',
        satuan: normalizeSatuan(item?.satuan),
        tipe_toko: item?.tipe_toko ?? 'ALL',
        lifetime: item?.lifetime ?? '',
        dim_cm: item?.dim_cm ?? '',
        harga_min: item?.harga_min ?? '',
        harga_max: item?.harga_max ?? '',
        foto: null as File | null,
    });

    isDirtyRef.current = form.isDirty;

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash?.success, flash?.error]);

    useEffect(() => {
        return () => {
            if (createPreview) {
                URL.revokeObjectURL(createPreview);
            }
        };
    }, [createPreview]);

    // Remark: blok navigasi Inertia bila form kotor (GET page change saja)
    useEffect(() => {
        return router.on('before', (event) => {
            if (bypassLeaveRef.current) {
                return;
            }
            const visit = event.detail.visit as PendingVisit;
            if (visit.method !== 'get') {
                return;
            }
            if (!isDirtyRef.current) {
                return;
            }
            event.preventDefault();
            setLeaveVisit(visit);
        });
    }, []);

    // Remark: peringatan refresh/tutup tab browser
    useEffect(() => {
        const onBeforeUnload = (e: BeforeUnloadEvent) => {
            if (!isDirtyRef.current || bypassLeaveRef.current) {
                return;
            }
            e.preventDefault();
            e.returnValue = '';
        };
        window.addEventListener('beforeunload', onBeforeUnload);
        return () => window.removeEventListener('beforeunload', onBeforeUnload);
    }, []);

    /** Remark fungsi: normalisasi angka kosong → null sebelum submit. */
    function payload() {
        return {
            ...form.data,
            lifetime:
                form.data.lifetime === '' || form.data.lifetime === null
                    ? null
                    : Number(form.data.lifetime),
            harga_min:
                form.data.harga_min === '' || form.data.harga_min === null
                    ? null
                    : Number(form.data.harga_min),
            harga_max:
                form.data.harga_max === '' || form.data.harga_max === null
                    ? null
                    : Number(form.data.harga_max),
        };
    }

    /** Remark fungsi: submit create/update field item. */
    function submit(e: React.FormEvent) {
        e.preventDefault();
        const data = payload();
        bypassLeaveRef.current = true;
        const opts = {
            forceFormData: !isEdit && data.foto != null,
            onStart: () => setSaving(true),
            onFinish: () => setSaving(false),
            onError: () => {
                bypassLeaveRef.current = false;
            },
        };
        if (isEdit) {
            router.put(`/admin/katalog/${item.id}`, data, opts);
            return;
        }
        router.post('/admin/katalog', data, opts);
    }

    /** Remark fungsi: batalkan perubahan field ke nilai awal. */
    function discardChanges() {
        form.reset();
        setCreateFoto(null);
        toast.message('Perubahan dibatalkan');
    }

    /** Remark fungsi: tutup modal, tetap di halaman (review). */
    function stayOnPage() {
        setLeaveVisit(null);
    }

    /** Remark fungsi: buang perubahan lalu lanjut navigasi tertunda. */
    function discardAndLeave() {
        if (!leaveVisit) {
            return;
        }
        const visit = leaveVisit;
        form.reset();
        setCreateFoto(null);
        setLeaveVisit(null);
        bypassLeaveRef.current = true;
        router.visit(visit.url, {
            method: visit.method,
            data: visit.data,
            replace: visit.replace,
            preserveScroll: visit.preserveScroll,
            preserveState: visit.preserveState,
            onFinish: () => {
                bypassLeaveRef.current = false;
            },
        });
    }

    /** Remark fungsi: filter hanya file gambar. */
    function imageFilesFromList(list: FileList | File[] | null): File[] {
        if (!list) {
            return [];
        }
        return Array.from(list).filter((f) => f.type.startsWith('image/'));
    }

    /** Remark fungsi: upload foto galeri (edit) — auto WebP di server. */
    function uploadGalleryFiles(files: File[]) {
        if (!item || files.length === 0 || uploading) {
            return;
        }
        setUploading(true);
        router.post(
            `/admin/katalog/${item.id}/photos`,
            {
                fotos: files,
                as_thumbnail: asThumbnail,
            },
            {
                forceFormData: true,
                onFinish: () => {
                    setUploading(false);
                    setAsThumbnail(false);
                    if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                    }
                },
            },
        );
    }

    /** Remark fungsi: pilih foto awal saat create. */
    function setCreateFoto(file: File | null) {
        if (createPreview) {
            URL.revokeObjectURL(createPreview);
        }
        if (!file) {
            form.setData('foto', null);
            setCreatePreview(null);
            return;
        }
        form.setData('foto', file);
        setCreatePreview(URL.createObjectURL(file));
    }

    function onDropZoneDrop(e: React.DragEvent) {
        e.preventDefault();
        setDragOver(false);
        const files = imageFilesFromList(e.dataTransfer.files);
        if (files.length === 0) {
            toast.error('Hanya file gambar yang diterima.');
            return;
        }
        if (isEdit) {
            uploadGalleryFiles(files);
            return;
        }
        setCreateFoto(files[0]);
    }

    function onFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
        const files = imageFilesFromList(e.target.files);
        if (files.length === 0) {
            return;
        }
        if (isEdit) {
            uploadGalleryFiles(files);
            return;
        }
        setCreateFoto(files[0]);
    }

    return (
        <>
            <Head title={isEdit ? `Edit ${item.kode}` : 'Tambah Katalog'} />
            <div className="bmd-page mx-auto flex w-full max-w-4xl flex-col gap-4 p-4">
                <div className="flex items-center justify-between gap-3">
                    <h1 className="text-xl font-bold text-[#5a5c69]">
                        {isEdit
                            ? `Edit ${item.kode} - ${item.nama_branding}`
                            : 'Tambah Item Katalog'}
                    </h1>
                    <Link
                        href="/admin/katalog"
                        className="inline-flex items-center gap-1 text-sm text-slate-600"
                    >
                        <ArrowLeft className="size-3.5" />
                        Kembali
                    </Link>
                </div>

                {/* Remark: field data item */}
                <form
                    id="katalog-item-form"
                    onSubmit={submit}
                    className="bmd-panel space-y-3 p-4"
                >
                    <div className="grid gap-3 md:grid-cols-2">
                        <Field label="No">
                            <input
                                type="number"
                                className="bmd-admin-input"
                                value={form.data.no}
                                onChange={(e) =>
                                    form.setData('no', Number(e.target.value))
                                }
                                required
                            />
                        </Field>
                        <Field label="Kode">
                            <input
                                className="bmd-admin-input"
                                value={form.data.kode}
                                onChange={(e) =>
                                    form.setData('kode', e.target.value)
                                }
                                required
                            />
                        </Field>
                        <Field label="Kategori">
                            <AdminSelect
                                value={form.data.kategori}
                                onChange={(v) => form.setData('kategori', v)}
                                required
                            >
                                <option value="" disabled>
                                    Pilih kategori
                                </option>
                                {kategoriOptions.map((k) => (
                                    <option key={k} value={k}>
                                        {k}
                                    </option>
                                ))}
                            </AdminSelect>
                            {kategoriOptions.length === 0 && (
                                <p className="mt-1 text-xs text-amber-700">
                                    Belum ada master kategori.{' '}
                                    <Link
                                        href="/admin/katalog/kategori"
                                        className="underline"
                                    >
                                        Kelola kategori
                                    </Link>
                                </p>
                            )}
                        </Field>
                        <Field label="Nama branding">
                            <input
                                className="bmd-admin-input"
                                value={form.data.nama_branding}
                                onChange={(e) =>
                                    form.setData(
                                        'nama_branding',
                                        e.target.value,
                                    )
                                }
                                required
                            />
                        </Field>
                        <Field label="Satuan">
                            <AdminSelect
                                value={form.data.satuan}
                                onChange={(v) =>
                                    form.setData(
                                        'satuan',
                                        normalizeSatuan(v),
                                    )
                                }
                                required
                            >
                                {satuanOptions.map((s) => (
                                    <option key={s} value={s}>
                                        {s}
                                    </option>
                                ))}
                            </AdminSelect>
                        </Field>
                        <Field label="Tipe toko">
                            <input
                                className="bmd-admin-input"
                                value={form.data.tipe_toko}
                                onChange={(e) =>
                                    form.setData('tipe_toko', e.target.value)
                                }
                            />
                        </Field>
                        <Field label="Lifetime (bulan)">
                            <input
                                type="number"
                                className="bmd-admin-input"
                                value={form.data.lifetime}
                                onChange={(e) =>
                                    form.setData('lifetime', e.target.value)
                                }
                            />
                        </Field>
                        <Field label="Dimensi (cm)">
                            <input
                                className="bmd-admin-input"
                                value={form.data.dim_cm}
                                onChange={(e) =>
                                    form.setData('dim_cm', e.target.value)
                                }
                            />
                        </Field>
                        <Field label="Harga min">
                            <input
                                type="number"
                                className="bmd-admin-input"
                                value={form.data.harga_min}
                                onChange={(e) =>
                                    form.setData('harga_min', e.target.value)
                                }
                            />
                        </Field>
                        <Field label="Harga max">
                            <input
                                type="number"
                                className="bmd-admin-input"
                                value={form.data.harga_max}
                                onChange={(e) =>
                                    form.setData('harga_max', e.target.value)
                                }
                            />
                        </Field>
                    </div>
                    <Field label="Spek branding">
                        <textarea
                            className="bmd-admin-input min-h-28"
                            value={form.data.spek_branding}
                            onChange={(e) =>
                                form.setData('spek_branding', e.target.value)
                            }
                        />
                    </Field>
                </form>

                {/* Remark: galeri + dropzone (edit) / foto awal (create) */}
                <div className="bmd-panel space-y-4 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <h2 className="bmd-panel-title">
                            {isEdit ? 'Galeri foto' : 'Foto awal (opsional)'}
                        </h2>
                        <p className="text-xs text-slate-500">
                            Otomatis dikonversi & dioptimasi ke WebP
                        </p>
                    </div>

                    {isEdit && (
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                            {item.photos.map((photo) => (
                                <div
                                    key={photo.id}
                                    className="relative overflow-hidden rounded border"
                                >
                                    <img
                                        src={photo.url}
                                        alt=""
                                        className="aspect-square w-full object-cover"
                                    />
                                    {photo.is_thumbnail && (
                                        <span className="absolute top-1 left-1 rounded bg-[#1cc88a] px-1.5 py-0.5 text-[10px] font-bold text-white">
                                            Thumbnail
                                        </span>
                                    )}
                                    <div className="flex gap-1 p-1">
                                        {!photo.is_thumbnail && (
                                            <button
                                                type="button"
                                                className="inline-flex flex-1 items-center justify-center gap-1 rounded bg-slate-100 px-1 py-1 text-[11px] font-semibold"
                                                onClick={() =>
                                                    router.post(
                                                        `/admin/katalog/${item.id}/photos/${photo.id}/thumbnail`,
                                                    )
                                                }
                                            >
                                                <Star className="size-3" />
                                                Jadikan thumb
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            className="inline-flex items-center justify-center rounded bg-red-50 px-2 py-1 text-red-600"
                                            onClick={() => {
                                                if (
                                                    confirm('Hapus foto ini?')
                                                ) {
                                                    router.delete(
                                                        `/admin/katalog/${item.id}/photos/${photo.id}`,
                                                    );
                                                }
                                            }}
                                        >
                                            <Trash2 className="size-3.5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {item.photos.length === 0 && (
                                <p className="col-span-full text-sm text-slate-500">
                                    Belum ada foto. Unggah di bawah.
                                </p>
                            )}
                        </div>
                    )}

                    {!isEdit && createPreview && (
                        <div className="relative w-40 overflow-hidden rounded border">
                            <img
                                src={createPreview}
                                alt="Preview"
                                className="aspect-square w-full object-cover"
                            />
                            <button
                                type="button"
                                className="absolute top-1 right-1 rounded bg-white/90 px-1.5 py-0.5 text-[11px] font-semibold text-red-600"
                                onClick={() => setCreateFoto(null)}
                            >
                                Hapus
                            </button>
                        </div>
                    )}

                    {/* Remark: drag & drop / klik upload */}
                    <div
                        className={`bmd-dropzone ${dragOver ? 'is-dragover' : ''} ${uploading ? 'is-busy' : ''}`}
                        onDragEnter={(e) => {
                            e.preventDefault();
                            setDragOver(true);
                        }}
                        onDragOver={(e) => {
                            e.preventDefault();
                            setDragOver(true);
                        }}
                        onDragLeave={(e) => {
                            e.preventDefault();
                            if (
                                e.currentTarget.contains(
                                    e.relatedTarget as Node,
                                )
                            ) {
                                return;
                            }
                            setDragOver(false);
                        }}
                        onDrop={onDropZoneDrop}
                        onClick={() => {
                            if (!uploading) {
                                fileInputRef.current?.click();
                            }
                        }}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                fileInputRef.current?.click();
                            }
                        }}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            multiple={isEdit}
                            className="sr-only"
                            onChange={onFileInputChange}
                        />
                        <Upload className="bmd-dropzone-icon" />
                        <p className="bmd-dropzone-title">
                            {uploading
                                ? 'Mengunggah & mengoptimasi WebP…'
                                : dragOver
                                  ? 'Lepaskan foto di sini'
                                  : 'Seret foto ke sini, atau klik untuk memilih'}
                        </p>
                        <p className="bmd-dropzone-hint">
                            {isEdit
                                ? 'JPG, PNG, WebP, GIF — bisa beberapa sekaligus (maks. 10 MB/file)'
                                : 'JPG, PNG, WebP, GIF — maks. 10 MB'}
                        </p>
                        {isEdit && (
                            <label
                                className="bmd-dropzone-thumb-opt"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <input
                                    type="checkbox"
                                    checked={asThumbnail}
                                    onChange={(e) =>
                                        setAsThumbnail(e.target.checked)
                                    }
                                />
                                Jadikan thumbnail (foto pertama)
                            </label>
                        )}
                        {!uploading && (
                            <span className="bmd-dropzone-cta">
                                <ImagePlus className="size-3.5" />
                                Pilih foto
                            </span>
                        )}
                    </div>
                </div>

                {/* Remark: aksi bawah — batalkan + simpan (lebih besar) */}
                <div className="bmd-admin-actions">
                    <button
                        type="button"
                        className="bmd-btn-cancel"
                        disabled={saving || uploading || !form.isDirty}
                        onClick={discardChanges}
                    >
                        Batalkan Perubahan
                    </button>
                    <button
                        type="submit"
                        form="katalog-item-form"
                        className="bmd-btn-save"
                        disabled={saving || uploading}
                    >
                        {saving
                            ? 'Menyimpan…'
                            : isEdit
                              ? 'Simpan Perubahan'
                              : 'Buat item'}
                    </button>
                </div>
            </div>

            {/* Remark: popup pindah halaman saat data belum tersimpan */}
            {leaveVisit && (
                <div
                    className="bmd-leave-overlay"
                    role="alertdialog"
                    aria-modal="true"
                    aria-labelledby="leave-title"
                >
                    <div className="bmd-leave-modal">
                        <h3 id="leave-title">Perubahan belum disimpan</h3>
                        <p>
                            Ada perubahan yang belum disimpan. Review kembali
                            untuk melanjutkan edit, atau batalkan perubahan
                            untuk meninggalkan halaman.
                        </p>
                        <div className="bmd-leave-actions">
                            <button
                                type="button"
                                className="bmd-btn-save"
                                onClick={stayOnPage}
                            >
                                Review Kembali
                            </button>
                            <button
                                type="button"
                                className="bmd-btn-cancel"
                                onClick={discardAndLeave}
                            >
                                Batalkan Perubahan
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

/** Remark komponen: select dengan ikon chevron rapi (tanpa panah native). */
function AdminSelect({
    value,
    onChange,
    required,
    children,
}: {
    value: string;
    onChange: (value: string) => void;
    required?: boolean;
    children: React.ReactNode;
}) {
    return (
        <div className="bmd-admin-select-wrap">
            <select
                className="bmd-admin-input bmd-admin-select"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                required={required}
            >
                {children}
            </select>
            <ChevronDown className="bmd-admin-select-icon" aria-hidden />
        </div>
    );
}

function Field({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) {
    return (
        <label className="block text-sm">
            <span className="mb-1 block font-semibold text-slate-600">
                {label}
            </span>
            {children}
        </label>
    );
}

AdminKatalogForm.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Admin Katalog', href: '/admin/katalog' },
        { title: 'Form', href: '#' },
    ],
};
