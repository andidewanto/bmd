/**
 * Remark komponen: satu kartu item katalog (media + detail + add cart).
 */
import {
    KatalogM2Fields,
    type DimState,
} from '@/components/katalog/katalog-m2-fields';
import { formatDimensi, formatHargaAngka } from '@/lib/format';
import type { KatalogLightboxItem } from '@/components/katalog-lightbox';

export type KatalogCardItem = KatalogLightboxItem & {
    foto_url: string;
    is_m2: boolean;
};

type Props = {
    item: KatalogCardItem;
    qty: number;
    dim: DimState;
    onDimChange: (next: DimState) => void;
    onOpenLightbox: () => void;
    onAdd: () => void;
};

/** Remark komponen: kartu horizontal item katalog. */
export function KatalogCard({
    item,
    qty,
    dim,
    onDimChange,
    onOpenLightbox,
    onAdd,
}: Props) {
    return (
        <article className="katalog-card">
            <button
                type="button"
                className="katalog-card-media"
                aria-label={`Lihat detail ${item.kode}`}
                onClick={onOpenLightbox}
            >
                <img
                    src={item.foto_url}
                    alt={`${item.kode} - ${item.nama_branding}`}
                    className="katalog-card-img"
                    loading="lazy"
                    onError={(e) => {
                        (e.target as HTMLImageElement).src =
                            '/assets/katalog/placeholder.svg';
                    }}
                />
            </button>
            <div className="katalog-card-body">
                <div>
                    <h2 className="katalog-card-name">
                        {item.kode} - {item.nama_branding}
                    </h2>
                    {!item.is_m2 && (
                        <div className="katalog-card-detail-row">
                            <span className="katalog-card-detail-label">
                                Dimensi
                            </span>
                            <span>:</span>
                            <span>{formatDimensi(item.dim_cm)}</span>
                        </div>
                    )}
                    <div className="katalog-card-detail-row">
                        <span className="katalog-card-detail-label">Harga</span>
                        <span>:</span>
                        <span>
                            {formatHargaAngka(item.harga_min, item.harga_max)}
                        </span>
                    </div>
                    {item.is_m2 && (
                        <KatalogM2Fields
                            panjang={dim.panjang}
                            lebar={dim.lebar}
                            hargaMax={item.harga_max}
                            onChange={onDimChange}
                        />
                    )}
                </div>
                <div className="katalog-add-wrap">
                    <button
                        type="button"
                        className="katalog-add-pengajuan"
                        onClick={onAdd}
                    >
                        Tambahkan ke Pengajuan
                    </button>
                    {qty > 0 && (
                        <span className="katalog-add-badge">{qty}</span>
                    )}
                </div>
            </div>
        </article>
    );
}
