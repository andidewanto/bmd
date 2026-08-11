/**
 * Remark hook: tampilkan flash success/error Inertia sebagai toast Sonner.
 */
import { usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import { toast } from 'sonner';

type FlashProps = {
    flash?: { success?: string; error?: string };
};

type Options = {
    /** Remark: dipanggil setelah toast success (mis. clear cart pengajuan). */
    onSuccess?: (message: string) => void;
    /** Remark: error tambahan dari form errors. */
    extraError?: string | null;
};

/** Remark fungsi: subscribe flash session → toast. */
export function useFlashToast(options: Options = {}): void {
    const { flash } = usePage().props as FlashProps;
    const onSuccess = options.onSuccess;
    const extraError = options.extraError;

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
            onSuccess?.(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
        if (extraError) {
            toast.error(extraError);
        }
        // Remark: sengaja tidak depend onSuccess agar tidak re-toast saat callback re-create
        // eslint-disable-next-line react-hooks/exhaustive-deps -- flash keys only
    }, [flash?.success, flash?.error, extraError]);
}
