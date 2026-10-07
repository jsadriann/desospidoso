// Ícones em SVG inline (traço), no estilo das telas.
const Svg = ({ size = 24, children, strokeWidth = 2, ...rest }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...rest}
  >
    {children}
  </svg>
);

export const IconArrowLeft = (p) => (
  <Svg {...p}><path d="M19 12H5" /><path d="M12 19l-7-7 7-7" /></Svg>
);
export const IconChevronRight = (p) => (
  <Svg {...p}><path d="M9 6l6 6-6 6" /></Svg>
);
export const IconSearch = (p) => (
  <Svg {...p}><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></Svg>
);
export const IconHelp = (p) => (
  <Svg strokeWidth={1.6} {...p}>
    <circle cx="12" cy="12" r="10.5" />
    <path d="M9.3 9a2.8 2.8 0 0 1 5.4 1c0 2-2.7 2.6-2.7 4" />
    <path d="M12 17.6h.01" />
  </Svg>
);
export const IconTrash = (p) => (
  <Svg {...p}>
    <path d="M4 7h16" /><path d="M10 11v6" /><path d="M14 11v6" />
    <path d="M6 7l1 13h10l1-13" /><path d="M9 7V4h6v3" />
  </Svg>
);
export const IconPlus = (p) => (
  <Svg {...p}><path d="M12 5v14" /><path d="M5 12h14" /></Svg>
);
export const IconEye = (p) => (
  <Svg {...p}><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></Svg>
);
export const IconEyeOff = (p) => (
  <Svg {...p}>
    <path d="M10.6 5.1A10.4 10.4 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-2.5 3.4" />
    <path d="M6.6 6.6C3.8 8.4 2 12 2 12s3.6 7 10 7a9.8 9.8 0 0 0 5.4-1.6" />
    <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" /><path d="M2 2l20 20" />
  </Svg>
);
export const IconCheckCircle = (p) => (
  <Svg {...p}>
    <path d="M21.5 10.6V12a9.5 9.5 0 1 1-5.6-8.7" />
    <path d="M21.5 4L12 13.5l-2.8-2.8" />
  </Svg>
);
export const IconCircle = (p) => (
  <Svg {...p}><circle cx="12" cy="12" r="9" /></Svg>
);
export const IconInfo = (p) => (
  <Svg {...p}><circle cx="12" cy="12" r="10" /><path d="M12 16v-5" /><path d="M12 8h.01" /></Svg>
);
export const IconAlert = (p) => (
  <Svg {...p}><circle cx="12" cy="12" r="10" /><path d="M12 7v6" /><path d="M12 16.5h.01" /></Svg>
);
export const IconUser = (p) => (
  <Svg {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></Svg>
);
export const IconLogout = (p) => (
  <Svg {...p}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" />
  </Svg>
);
export const IconRestore = (p) => (
  <Svg {...p}>
    <path d="M3 12a9 9 0 1 0 2.6-6.4L3 8" /><path d="M3 3v5h5" />
  </Svg>
);
export const IconCamera = (p) => (
  <Svg {...p}>
    <path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" />
    <circle cx="12" cy="13.5" r="3.5" />
  </Svg>
);
export const IconClose = (p) => (
  <Svg {...p}><path d="M6 6l12 12" /><path d="M18 6L6 18" /></Svg>
);
export const IconFile = (p) => (
  <Svg {...p}><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5" /></Svg>
);
export const IconClipboard = (p) => (
  <Svg {...p}>
    <rect x="5" y="4" width="14" height="17" rx="2" /><rect x="9" y="2.5" width="6" height="3.5" rx="1" />
  </Svg>
);
export const IconDash = (p) => (
  <Svg {...p}><path d="M5 12h14" /></Svg>
);
