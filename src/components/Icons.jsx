export const Icon = {
  Plus: ({ s = 16 }) => (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none">
      <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  Close: ({ s = 12 }) => (
    <svg width={s} height={s} viewBox="0 0 12 12" fill="none">
      <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  ),
  Check: ({ s = 16 }) => (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none">
      <path d="M3 8.5l3 3L13 4.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  X: ({ s = 16 }) => (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none">
      <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  ),
  Arrow: ({ s = 16, dir = 'right' }) => (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none" style={{ transform: dir === 'left' ? 'rotate(180deg)' : '' }}>
      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Undo: ({ s = 14 }) => (
    <svg width={s} height={s} viewBox="0 0 14 14" fill="none">
      <path d="M3 4h6a3 3 0 0 1 0 6H6M3 4l2.5-2.5M3 4l2.5 2.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Trash: ({ s = 14 }) => (
    <svg width={s} height={s} viewBox="0 0 14 14" fill="none">
      <path d="M2.5 4h9M5.5 4V2.5h3V4M4 4l.5 7.5h5L10 4M6 6.5v3M8 6.5v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Sparkle: ({ s = 18 }) => (
    <svg width={s} height={s} viewBox="0 0 18 18" fill="none">
      <path d="M9 2l1.6 4.4L15 8l-4.4 1.6L9 14l-1.6-4.4L3 8l4.4-1.6L9 2z" fill="currentColor" />
    </svg>
  ),
  Pencil: ({ s = 32 }) => (
    <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
      <path d="M22 4l6 6-16 16H6v-6L22 4z" fill="white" stroke="white" strokeWidth="2" strokeLinejoin="round" opacity=".95" />
      <path d="M19 7l6 6" stroke="rgba(255,255,255,.5)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
};
