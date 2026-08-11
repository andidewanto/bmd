import type { ImgHTMLAttributes } from 'react';

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt'> & {
    /** Remark: pakai versi putih untuk background gelap */
    variant?: 'fc' | 'white';
};

/**
 * Remark komponen: ikon logo Avian Brands (vertikal) untuk sidebar collapsed / auth.
 */
export default function AppLogoIcon({
    variant = 'fc',
    className,
    ...props
}: Props) {
    const src =
        variant === 'white'
            ? '/images/branding/avian-vertical-white.png'
            : '/images/branding/avian-vertical-fc.png';

    return (
        <img
            src={src}
            alt="Avian Brands"
            className={className}
            draggable={false}
            {...props}
        />
    );
}
