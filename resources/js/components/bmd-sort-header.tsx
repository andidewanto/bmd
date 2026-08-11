/**
 * Remark komponen: header kolom tabel dengan tombol sort ASC / DESC.
 */
import { ChevronDown, ChevronUp } from 'lucide-react';

type Props<T extends string> = {
    label: string;
    column: T;
    sort: T;
    order: 'asc' | 'desc';
    align?: 'left' | 'right';
    onSort: (column: T, order: 'asc' | 'desc') => void;
};

/** Remark komponen: th + kontrol sort (reusable Toko / Dashboard / dll). */
export function BmdSortHeader<T extends string>({
    label,
    column,
    sort,
    order,
    align = 'left',
    onSort,
}: Props<T>) {
    const activeAsc = sort === column && order === 'asc';
    const activeDesc = sort === column && order === 'desc';

    return (
        <th className={align === 'right' ? 'text-right' : undefined}>
            <div
                className={`bmd-th-sort ${align === 'right' ? 'justify-end' : ''}`}
            >
                <span>{label}</span>
                <span className="bmd-sort-btns">
                    <button
                        type="button"
                        className={`bmd-sort-btn ${activeAsc ? 'is-active' : ''}`}
                        title={`${label} naik (ASC)`}
                        aria-label={`${label} ascending`}
                        onClick={() => onSort(column, 'asc')}
                    >
                        <ChevronUp className="size-3.5" />
                    </button>
                    <button
                        type="button"
                        className={`bmd-sort-btn ${activeDesc ? 'is-active' : ''}`}
                        title={`${label} turun (DESC)`}
                        aria-label={`${label} descending`}
                        onClick={() => onSort(column, 'desc')}
                    >
                        <ChevronDown className="size-3.5" />
                    </button>
                </span>
            </div>
        </th>
    );
}
