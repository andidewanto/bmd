/**
 * Remark komponen: filter search + kategori daftar katalog.
 */

type KategoriOption = { kategori: string; item_count: number };

type Props = {
    search: string;
    kategori: string;
    kategoriList: KategoriOption[];
    onSearchChange: (value: string) => void;
    onSearchSubmit: () => void;
    onKategoriChange: (value: string) => void;
};

/** Remark komponen: kontrol filter di header panel katalog. */
export function KatalogFilters({
    search,
    kategori,
    kategoriList,
    onSearchChange,
    onSearchSubmit,
    onKategoriChange,
}: Props) {
    return (
        <div className="bmd-filters">
            <input
                type="search"
                placeholder="Cari kode / nama / spek… (Enter)"
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        onSearchSubmit();
                    }
                }}
            />
            <select
                value={kategori}
                onChange={(e) => onKategoriChange(e.target.value)}
                aria-label="Filter kategori"
            >
                <option value="">Semua kategori</option>
                {kategoriList.map((k) => (
                    <option key={k.kategori} value={k.kategori}>
                        {k.kategori} ({k.item_count})
                    </option>
                ))}
            </select>
        </div>
    );
}
