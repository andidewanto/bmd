/**
 * Remark komponen: logo aplikasi di sidebar (Avian Brands).
 * Expanded = horizontal; collapsed = vertikal. Light = FC; dark = white.
 */
export default function AppLogo() {
    return (
        <div className="flex items-center overflow-hidden">
            <img
                src="/images/branding/avian-horizontal-fc.png"
                alt="Avian Brands"
                className="h-8 w-auto max-w-[9.5rem] object-contain object-left group-data-[collapsible=icon]:hidden dark:hidden"
                draggable={false}
            />
            <img
                src="/images/branding/avian-horizontal-white.png"
                alt="Avian Brands"
                className="hidden h-8 w-auto max-w-[9.5rem] object-contain object-left group-data-[collapsible=icon]:hidden dark:block"
                draggable={false}
            />
            <img
                src="/images/branding/avian-vertical-fc.png"
                alt="Avian Brands"
                className="hidden size-8 object-contain group-data-[collapsible=icon]:block dark:hidden"
                draggable={false}
            />
            <img
                src="/images/branding/avian-vertical-white.png"
                alt="Avian Brands"
                className="hidden size-8 object-contain dark:group-data-[collapsible=icon]:block"
                draggable={false}
            />
        </div>
    );
}
