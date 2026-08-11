/**
 * Remark komponen: lightbox detail item katalog + slide foto (lazy-load gallery).
 */
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { formatDimensi, formatHargaAngka } from '@/lib/format';

export type KatalogLightboxItem = {
    id: number;
    no: number;
    kode: string;
    kategori: string;
    nama_branding: string;
    spek_branding?: string | null;
    satuan?: string | null;
    tipe_toko?: string | null;
    lifetime?: number | null;
    dim_cm?: string | null;
    harga_min?: number | null;
    harga_max?: number | null;
    foto_url?: string;
    photos?: { id: number; url: string; is_thumbnail?: boolean }[];
};

type Props = {
    item: KatalogLightboxItem | null;
    onClose: () => void;
};

type DetailPayload = KatalogLightboxItem & {
    photos: { id: number; url: string; is_thumbnail?: boolean }[];
};

/** Remark komponen: modal lightbox di tengah layar. */
export function KatalogLightbox({ item, onClose }: Props) {
    const [index, setIndex] = useState(0);
    const [detail, setDetail] = useState<DetailPayload | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setIndex(0);
        setDetail(null);

        if (!item) {
            return;
        }

        // Remark: jika photos sudah lengkap dari parent, pakai langsung
        if (item.photos && item.photos.length > 0) {
            setDetail({ ...item, photos: item.photos });
            return;
        }

        // Remark: lazy-load gallery dari endpoint detail
        let cancelled = false;
        setLoading(true);
        fetch(`/katalog/${item.id}/detail`, {
            headers: { Accept: 'application/json' },
            credentials: 'same-origin',
        })
            .then(async (res) => {
                if (!res.ok) {
                    throw new Error('Gagal memuat detail');
                }
                return res.json() as Promise<DetailPayload>;
            })
            .then((data) => {
                if (!cancelled) {
                    setDetail(data);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setDetail({
                        ...item,
                        photos: [
                            {
                                id: 0,
                                url:
                                    item.foto_url ||
                                    '/assets/katalog/placeholder.svg',
                                is_thumbnail: true,
                            },
                        ],
                    });
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [item]);

    useEffect(() => {
        if (!item) {
            return;
        }
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
            const len = detail?.photos?.length ?? 0;
            if (e.key === 'ArrowLeft' && len > 0) {
                setIndex((i) => (i - 1 + len) % len);
            }
            if (e.key === 'ArrowRight' && len > 0) {
                setIndex((i) => (i + 1) % len);
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [item, onClose, detail?.photos?.length]);

    if (!item) {
        return null;
    }

    const view = detail ?? item;
    const photos =
        view.photos && view.photos.length > 0
            ? view.photos
            : [
                  {
                      id: 0,
                      url:
                          item.foto_url ||
                          '/assets/katalog/placeholder.svg',
                  },
              ];
    const current = photos[Math.min(index, photos.length - 1)];

    return (
        <div
            className="bmd-lightbox-overlay"
            role="dialog"
            aria-modal="true"
            aria-label="Detail katalog"
            onClick={onClose}
        >
            <div
                className="bmd-lightbox"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="bmd-lightbox-gallery">
                    {loading && !detail ? (
                        <p className="text-sm text-white/80">Memuat foto…</p>
                    ) : (
                        <img
                            src={current.url}
                            alt={`${view.kode} foto ${index + 1}`}
                            onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                    '/assets/katalog/placeholder.svg';
                            }}
                        />
                    )}
                    {photos.length > 1 && (
                        <>
                            <button
                                type="button"
                                className="bmd-lightbox-nav prev"
                                aria-label="Foto sebelumnya"
                                onClick={() =>
                                    setIndex(
                                        (i) =>
                                            (i - 1 + photos.length) %
                                            photos.length,
                                    )
                                }
                            >
                                <ChevronLeft className="mx-auto size-5" />
                            </button>
                            <button
                                type="button"
                                className="bmd-lightbox-nav next"
                                aria-label="Foto berikutnya"
                                onClick={() =>
                                    setIndex((i) => (i + 1) % photos.length)
                                }
                            >
                                <ChevronRight className="mx-auto size-5" />
                            </button>
                            <div className="absolute bottom-3 left-0 right-0 text-center text-xs font-semibold text-white/90">
                                {index + 1} / {photos.length}
                            </div>
                        </>
                    )}
                </div>
                <div className="bmd-lightbox-detail">
                    <div className="mb-3 flex items-start justify-between gap-2">
                        <h3>
                            {view.kode} - {view.nama_branding}
                        </h3>
                        <button
                            type="button"
                            className="rounded p-1 text-slate-500 hover:bg-slate-100"
                            aria-label="Tutup"
                            onClick={onClose}
                        >
                            <X className="size-5" />
                        </button>
                    </div>
                    <dl>
                        <div className="bmd-lightbox-row">
                            <dt>No</dt>
                            <dd>{view.no}</dd>
                        </div>
                        <div className="bmd-lightbox-row">
                            <dt>Kode</dt>
                            <dd>{view.kode}</dd>
                        </div>
                        <div className="bmd-lightbox-row">
                            <dt>Kategori</dt>
                            <dd>{view.kategori}</dd>
                        </div>
                        <div className="bmd-lightbox-row">
                            <dt>Nama</dt>
                            <dd>{view.nama_branding}</dd>
                        </div>
                        <div className="bmd-lightbox-row">
                            <dt>Dimensi</dt>
                            <dd>{formatDimensi(view.dim_cm)}</dd>
                        </div>
                        <div className="bmd-lightbox-row">
                            <dt>Satuan</dt>
                            <dd>{view.satuan || '—'}</dd>
                        </div>
                        <div className="bmd-lightbox-row">
                            <dt>Tipe toko</dt>
                            <dd>{view.tipe_toko || '—'}</dd>
                        </div>
                        <div className="bmd-lightbox-row">
                            <dt>Lifetime</dt>
                            <dd>
                                {view.lifetime != null
                                    ? `${view.lifetime} bulan`
                                    : '—'}
                            </dd>
                        </div>
                        <div className="bmd-lightbox-row">
                            <dt>Harga</dt>
                            <dd>
                                {formatHargaAngka(
                                    view.harga_min,
                                    view.harga_max,
                                )}
                            </dd>
                        </div>
                        <div className="bmd-lightbox-row">
                            <dt>Spek</dt>
                            <dd>{view.spek_branding || '—'}</dd>
                        </div>
                    </dl>
                </div>
            </div>
        </div>
    );
}
