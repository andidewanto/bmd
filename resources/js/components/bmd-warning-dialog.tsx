/**
 * Remark komponen: modal peringatan center-screen (shared BMD).
 */

type Props = {
    message: string | null;
    title?: string;
    onClose: () => void;
};

/** Remark komponen: dialog peringatan; null message → tidak render. */
export function BmdWarningDialog({
    message,
    title = 'Peringatan',
    onClose,
}: Props) {
    if (!message) {
        return null;
    }

    return (
        <div
            className="bmd-warning-overlay"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="bmd-warning-title"
            onClick={onClose}
        >
            <div
                className="bmd-warning-modal"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 id="bmd-warning-title">{title}</h3>
                <p>{message}</p>
                <button
                    type="button"
                    className="bmd-warning-ok"
                    onClick={onClose}
                >
                    Mengerti
                </button>
            </div>
        </div>
    );
}
