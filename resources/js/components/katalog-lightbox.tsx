/**
 * Remark komponen: lightbox detail item katalog + slide foto.
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
    photos: { id: number; url: string; is_thumbnail?: boolean }[];
};

type Props = {
    item: KatalogLightboxItem | null;
    onClose: () => void;
};

/** Remark komponen: modal lightbox di tengah layar. */
export function KatalogLightbox({ item, onClose }: Props) {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        setIndex(0);
    }, [item?.id]);

    useEffect(() => {
        if (!item) {
            return;
        }
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
            if (e.key === 'ArrowLeft') {
                setIndex((i) =>
                    item.photos.length
                        ? (i - 1 + item.photos.length) % item.photos.length
                        : 0,
                );
            }
            if (e.key === 'ArrowRight') {
                setIndex((i) =>
                    item.photos.length ? (i + 1) % item.photos.length : 0,
                );
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [item, onClose]);

    if (!item) {
        return null;
    }

    const photos = item.photos.length
        ? item.photos
        : [{ id: 0, url: '/assets/katalog/placeholder.svg' }];
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
                    <img
                        src={current.url}
                        alt={`${item.kode} foto ${index + 1}`}
                        onError={(e) => {
                            (e.target as HTMLImageElement).src =
                                '/assets/katalog/placeholder.svg';
                        }}
                    />
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
                            {item.kode} - {item.nama_branding}
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
                            <dd>{item.no}</dd>
                        </div>
                        <div className="bmd-lightbox-row">
                            <dt>Kode</dt>
                            <dd>{item.kode}</dd>
                        </div>
                        <div className="bmd-lightbox-row">
                            <dt>Kategori</dt>
                            <dd>{item.kategori}</dd>
                        </div>
                        <div className="bmd-lightbox-row">
                            <dt>Nama</dt>
                            <dd>{item.nama_branding}</dd>
                        </div>
                        <div className="bmd-lightbox-row">
                            <dt>Dimensi</dt>
                            <dd>{formatDimensi(item.dim_cm)}</dd>
                        </div>
                        <div className="bmd-lightbox-row">
                            <dt>Satuan</dt>
                            <dd>{item.satuan || '—'}</dd>
                        </div>
                        <div className="bmd-lightbox-row">
                            <dt>Tipe toko</dt>
                            <dd>{item.tipe_toko || '—'}</dd>
                        </div>
                        <div className="bmd-lightbox-row">
                            <dt>Lifetime</dt>
                            <dd>
                                {item.lifetime != null
                                    ? `${item.lifetime} bulan`
                                    : '—'}
                            </dd>
                        </div>
                        <div className="bmd-lightbox-row">
                            <dt>Harga</dt>
                            <dd>
                                {formatHargaAngka(
                                    item.harga_min,
                                    item.harga_max,
                                )}
                            </dd>
                        </div>
                        <div className="bmd-lightbox-row">
                            <dt>Spek</dt>
                            <dd>{item.spek_branding || '—'}</dd>
                        </div>
                    </dl>
                </div>
            </div>
        </div>
    );
}
