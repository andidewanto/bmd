/**
 * Remark komponen: input dimensi m² + estimasi harga.
 */
import { formatRp } from '@/lib/format';
import { calcM2Price } from '@/lib/pengajuan-rules';

export type DimState = { panjang: string; lebar: string };

type Props = {
    panjang: string;
    lebar: string;
    hargaMax: number | null | undefined;
    onChange: (next: DimState) => void;
};

/** Remark fungsi: update satu field dimensi tanpa nested setState di parent. */
export function patchDim(
    prev: DimState | undefined,
    field: keyof DimState,
    value: string,
): DimState {
    return {
        panjang: field === 'panjang' ? value : (prev?.panjang ?? ''),
        lebar: field === 'lebar' ? value : (prev?.lebar ?? ''),
    };
}

/** Remark komponen: form tinggi/lebar + estimasi. */
export function KatalogM2Fields({
    panjang,
    lebar,
    hargaMax,
    onChange,
}: Props) {
    const estimasi = calcM2Price(Number(panjang), Number(lebar), hargaMax);

    return (
        <div className="katalog-m2-form">
            <p className="katalog-m2-form-title">Dimensi branding</p>
            <div className="katalog-m2-fields">
                <input
                    type="number"
                    min={0.01}
                    step={0.01}
                    placeholder="Tinggi (cm)"
                    value={panjang}
                    onChange={(e) =>
                        onChange(patchDim({ panjang, lebar }, 'panjang', e.target.value))
                    }
                />
                <input
                    type="number"
                    min={0.01}
                    step={0.01}
                    placeholder="Lebar (cm)"
                    value={lebar}
                    onChange={(e) =>
                        onChange(patchDim({ panjang, lebar }, 'lebar', e.target.value))
                    }
                />
            </div>
            {estimasi != null && (
                <p className="katalog-m2-estimasi">
                    Estimasi Harga : <strong>{formatRp(estimasi)}</strong>
                </p>
            )}
        </div>
    );
}
