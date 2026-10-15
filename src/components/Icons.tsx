import type { SVGProps } from 'react';

const base: SVGProps<SVGSVGElement> = {
  className: 'icon',
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2.2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
};

export const RobotIcon = () => (
  <svg {...base}>
    <rect x="4" y="7" width="16" height="12" rx="3" />
    <circle cx="9" cy="13" r="1.6" />
    <circle cx="15" cy="13" r="1.6" />
    <path d="M12 7V3" />
    <path d="M8 21v-2" />
    <path d="M16 21v-2" />
  </svg>
);

export const PeopleIcon = () => (
  <svg {...base}>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
    <circle cx="17" cy="9" r="3" />
    <path d="M15.5 14.5a5.5 5.5 0 0 1 6 5.5" />
  </svg>
);

export const PlayIcon = () => (
  <svg {...base} stroke="none">
    <path d="M7 5v14l11-7z" fill="currentColor" />
  </svg>
);

export const FlagIcon = () => (
  <svg {...base}>
    <path d="M5 21V4" />
    <path d="M5 4h12l-2 4 2 4H5" />
  </svg>
);

export const HalfIcon = () => <span className="icon half">½</span>;

export const UndoIcon = () => (
  <svg {...base}>
    <path d="M9 14L4 9l5-5" />
    <path d="M4 9h11a5 5 0 0 1 0 10h-3" />
  </svg>
);

export const HomeIcon = () => (
  <svg {...base}>
    <path d="M3 11l9-8 9 8" />
    <path d="M5 10v10h5v-6h4v6h5V10" />
  </svg>
);

export const RestartIcon = () => (
  <svg {...base}>
    <path d="M3 12a9 9 0 1 0 3-6.7" />
    <path d="M3 4v5h5" />
  </svg>
);

export const PaletteIcon = () => (
  <svg {...base}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="8.5" cy="10" r="1.3" fill="currentColor" />
    <circle cx="12" cy="7.5" r="1.3" fill="currentColor" />
    <circle cx="15.5" cy="10" r="1.3" fill="currentColor" />
    <path d="M12 21a3 3 0 0 1-3-3 2 2 0 0 0-2-2H6" />
  </svg>
);

export const SpeakerIcon = ({ muted = false }: { muted?: boolean }) => (
  <svg {...base}>
    <path d="M3 10v4h4l5 4V6L7 10H3z" />
    {muted ? (
      <>
        <path d="M16 9l5 6" />
        <path d="M21 9l-5 6" />
      </>
    ) : (
      <>
        <path d="M16 9a4 4 0 0 1 0 6" />
        <path d="M18.5 6.5a8 8 0 0 1 0 11" />
      </>
    )}
  </svg>
);

export const FullscreenIcon = () => (
  <svg {...base}>
    <path d="M4 9V4h5" />
    <path d="M20 9V4h-5" />
    <path d="M4 15v5h5" />
    <path d="M20 15v5h-5" />
  </svg>
);

export const LogoIcon = () => (
  <svg className="icon logo" viewBox="0 0 24 24" aria-hidden="true">
    <rect x="2" y="2" width="10" height="10" rx="2" fill="#f1efe9" />
    <rect x="12" y="2" width="10" height="10" rx="2" fill="#81b64c" />
    <rect x="2" y="12" width="10" height="10" rx="2" fill="#81b64c" />
    <rect x="12" y="12" width="10" height="10" rx="2" fill="#f1efe9" />
  </svg>
);
