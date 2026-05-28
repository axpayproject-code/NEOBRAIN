interface Props {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  showTagline?: boolean;
  variant?: "light" | "dark" | "sidebar";
  className?: string;
}

const CIRCLE: Record<string, string> = {
  xs: "h-4 w-4",
  sm: "h-5 w-5",
  md: "h-6 w-6",
  lg: "h-7 w-7",
  xl: "h-10 w-10",
};
const NAME_TEXT: Record<string, string> = {
  xs: "text-[11px]",
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
  xl: "text-2xl",
};
const TAG_TEXT: Record<string, string> = {
  xs: "text-[7px]",
  sm: "text-[8px]",
  md: "text-[9px]",
  lg: "text-[10px]",
  xl: "text-xs",
};
const GAP: Record<string, string> = {
  xs: "gap-0.5",
  sm: "gap-1",
  md: "gap-1",
  lg: "gap-1.5",
  xl: "gap-2",
};

const COLOR = {
  light:   { circle: "bg-primary",                  name: "text-primary",                tag: "text-primary/70"            },
  dark:    { circle: "bg-secondary",                 name: "text-background",             tag: "text-background/60"         },
  sidebar: { circle: "bg-sidebar-primary",           name: "text-sidebar-foreground",     tag: "text-sidebar-foreground/50" },
};

export default function NeoBrainLogo({ size = "md", showTagline = false, variant = "light", className = "" }: Props) {
  const c = COLOR[variant];
  return (
    <div className={`flex flex-col items-center ${GAP[size]} ${className}`}>
      <div className={`${CIRCLE[size]} ${c.circle} rounded-full shrink-0`} />
      <div className="flex flex-col items-center leading-none">
        <span
          className={`font-extrabold tracking-widest ${NAME_TEXT[size]} ${c.name}`}
          style={{ fontFamily: "var(--font-display, 'Syne', sans-serif)", letterSpacing: "0.12em" }}
        >
          NEOBRAIN
        </span>
        {showTagline && (
          <span className={`font-semibold tracking-[0.18em] uppercase mt-0.5 ${TAG_TEXT[size]} ${c.tag}`}>
            by AccentecxAI
          </span>
        )}
      </div>
    </div>
  );
}

export function BrainSvg({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M12 4.5C10 4.5 8.3 5.6 7.5 7.2C6.8 6.5 5.8 6.1 4.7 6.1C2.9 6.1 1.5 7.6 1.5 9.4C1.5 10.3 1.9 11.1 2.5 11.7C1.9 12.4 1.5 13.3 1.5 14.3C1.5 16.1 2.8 17.5 4.4 17.9C4.3 18.2 4.3 18.5 4.3 18.7C4.3 20.1 5.4 21.2 6.8 21.2C7.4 21.2 8 21 8.4 20.6C9 20.9 9.6 21.1 10.3 21.1H12"
        stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round"
      />
      <path
        d="M12 4.5C14 4.5 15.7 5.6 16.5 7.2C17.2 6.5 18.2 6.1 19.3 6.1C21.1 6.1 22.5 7.6 22.5 9.4C22.5 10.3 22.1 11.1 21.5 11.7C22.1 12.4 22.5 13.3 22.5 14.3C22.5 16.1 21.2 17.5 19.6 17.9C19.7 18.2 19.7 18.5 19.7 18.7C19.7 20.1 18.6 21.2 17.2 21.2C16.6 21.2 16 21 15.6 20.6C15 20.9 14.4 21.1 13.7 21.1H12"
        stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round"
      />
      <path d="M12 5.5V21" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" opacity="0.4" />
      <path d="M5.5 11C7.1 11 8.1 12.2 8.1 13.7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M5 16.8C6.6 16.8 7.6 17.8 7.6 19.2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M18.5 11C16.9 11 15.9 12.2 15.9 13.7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M19 16.8C17.4 16.8 16.4 17.8 16.4 19.2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}
