interface Props {
  size?: "xs" | "sm" | "md" | "lg";
  showTagline?: boolean;
  variant?: "light" | "dark" | "sidebar";
  className?: string;
}

const SIZE = {
  xs: { box: "h-6 w-6 rounded-lg",   icon: "h-3.5 w-3.5", text: "text-xs",   tag: "text-[8px]",  gap: "gap-1.5" },
  sm: { box: "h-7 w-7 rounded-lg",   icon: "h-4 w-4",     text: "text-sm",   tag: "text-[9px]",  gap: "gap-2"   },
  md: { box: "h-8 w-8 rounded-xl",   icon: "h-4.5 w-4.5", text: "text-base", tag: "text-[10px]", gap: "gap-2.5" },
  lg: { box: "h-10 w-10 rounded-xl", icon: "h-5.5 w-5.5", text: "text-lg",   tag: "text-xs",     gap: "gap-3"   },
};

const VARIANT = {
  light:   { box: "bg-primary",      icon: "text-secondary",         name: "text-foreground",        tag: "text-muted-foreground" },
  dark:    { box: "bg-secondary/25", icon: "text-secondary",         name: "text-background",        tag: "text-background/50"    },
  sidebar: { box: "bg-sidebar-primary/20", icon: "text-sidebar-primary", name: "text-sidebar-foreground", tag: "text-sidebar-foreground/40" },
};

export default function NeoBrainLogo({ size = "md", showTagline = false, variant = "light", className = "" }: Props) {
  const s = SIZE[size];
  const v = VARIANT[variant];
  return (
    <div className={`flex items-center ${s.gap} ${className}`}>
      <div className={`${s.box} ${v.box} flex items-center justify-center shrink-0`}>
        <BrainSvg className={`${s.icon} ${v.icon}`} />
      </div>
      <div className="flex flex-col leading-none">
        <span className={`font-bold tracking-tight ${s.text} ${v.name}`} style={{ fontFamily: "var(--font-display, 'Syne', sans-serif)" }}>
          NEOBRAIN
        </span>
        {showTagline && (
          <span className={`font-normal tracking-wide mt-0.5 ${s.tag} ${v.tag}`}>by ACCENTECX AI</span>
        )}
      </div>
    </div>
  );
}

export function BrainSvg({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* Left hemisphere */}
      <path
        d="M12 4.5C10 4.5 8.3 5.6 7.5 7.2C6.8 6.5 5.8 6.1 4.7 6.1C2.9 6.1 1.5 7.6 1.5 9.4C1.5 10.3 1.9 11.1 2.5 11.7C1.9 12.4 1.5 13.3 1.5 14.3C1.5 16.1 2.8 17.5 4.4 17.9C4.3 18.2 4.3 18.5 4.3 18.7C4.3 20.1 5.4 21.2 6.8 21.2C7.4 21.2 8 21 8.4 20.6C9 20.9 9.6 21.1 10.3 21.1H12"
        stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round"
      />
      {/* Right hemisphere */}
      <path
        d="M12 4.5C14 4.5 15.7 5.6 16.5 7.2C17.2 6.5 18.2 6.1 19.3 6.1C21.1 6.1 22.5 7.6 22.5 9.4C22.5 10.3 22.1 11.1 21.5 11.7C22.1 12.4 22.5 13.3 22.5 14.3C22.5 16.1 21.2 17.5 19.6 17.9C19.7 18.2 19.7 18.5 19.7 18.7C19.7 20.1 18.6 21.2 17.2 21.2C16.6 21.2 16 21 15.6 20.6C15 20.9 14.4 21.1 13.7 21.1H12"
        stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round"
      />
      {/* Center groove */}
      <path d="M12 5.5V21" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" opacity="0.4" />
      {/* Left folds */}
      <path d="M5.5 11C7.1 11 8.1 12.2 8.1 13.7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M5 16.8C6.6 16.8 7.6 17.8 7.6 19.2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      {/* Right folds */}
      <path d="M18.5 11C16.9 11 15.9 12.2 15.9 13.7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M19 16.8C17.4 16.8 16.4 17.8 16.4 19.2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}
