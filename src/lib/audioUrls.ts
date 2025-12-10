// Google Drive audio URLs
// Format: https://drive.google.com/uc?export=download&id=FILE_ID

const GDRIVE_BASE = 'https://drive.google.com/uc?export=download&id=';

// Extract file ID from Google Drive share link
function gdriveUrl(fileId: string): string {
  return `${GDRIVE_BASE}${fileId}`;
}

export const AUDIO_URLS = {
  happy: {
    track1: gdriveUrl('1wcxAZQIc73mhsUAN5LXlO-wddiFc0EDF'),
    track2: gdriveUrl('1tiv1hhfASupR-4tCOBIsPLNbiuwchgON'),
    track3: gdriveUrl('1yD_KMUONapGTvoHh5aTH5pXMyWyff53W'),
  },
  neutral: {
    track1: gdriveUrl('180ijtC0Oc2oLzxuvdcemPykHJukiu-NR'),
    track2: gdriveUrl('1IWZF3d0ny5V0I0hIDb8Nq_S10LD5pf5o'),
    track3: gdriveUrl('1rPf0ZQr-t162IMFjs3HwTUScx46vdOGR'),
  },
  sad: {
    track1: gdriveUrl('1ZQgbjOyWDoGbHXHejh1trgPBiTZMkJGL'),
    track2: gdriveUrl('1_yP3Q3LH6gg9G9cU8RzlxGCKZtaEeFlh'),
    track3: gdriveUrl('1ULF2sN2B7YxoBepGpqhOx_pR4JzNJzWq'),
  },
  covid: {
    track1: gdriveUrl('1YBDU3ki-5WpG3N5v8YQcWbBcFFtcAhQY'),
    track2: gdriveUrl('1Fu0FXZO--1jVIF_JYIfrvo-wsLT463qx'),
    track3: gdriveUrl('1hczHRHo6ZtqTPZLOK0vFVEH02viO4P70'),
    track4: gdriveUrl('17vZr6qJbMbulHI7B4ekOHE-fm6w7628W'),
    track5: gdriveUrl('1FnGZxhX9ughgY49xt1pHz9r8hiQhs8_o'),
    track6: gdriveUrl('1Iixt649udj1gmblQAoinc2PTbisRZMYd'),
    track7: gdriveUrl('10zgKT1OlNqIjVIN3WYztCCgIZSIDrtdy'),
    track8: gdriveUrl('1yCLu_ByIfE-On8O2HF35slJoFxz23KXZ'),
    track9: gdriveUrl('1xRfQGEpLeup1kdm8ck8RMnocPwiNRrVl'),
    track10: gdriveUrl('1QWs0f0ZdfFv-sYSjbGpOFY5AoaviXd_N'),
    track11: gdriveUrl('1dp5PtjZ46JiC_yF_gPnlnteA_WLo7DSA'),
    track12: gdriveUrl('1MOYeOr5ibomiAT54BSecw1sAS4MZfQgi'),
    track13: gdriveUrl('1BmTzbpfIOz9BjnJbYagQyWqRkLqtZKje'),
    track14: gdriveUrl('1LJWWvHOwzJu99VE8eO0OP5HXGvHWy8E2'),
    track15: gdriveUrl('1TBwj5deED6XECI70AroLp0QcdPLspHrl'),
    track16: gdriveUrl('1e9mHDwWeMGRnRmWrhJYPvXmskeVmynCe'),
    track17: gdriveUrl('1FldMwFAYWOXlVYfOSQW6JJrBuonxuV4E'),
    track18: gdriveUrl('1xNdvOHCtv1h9ZThqXl6YYV59OYicf8Jx'),
    track19: gdriveUrl('10ncVS-eOB2v8bqIaIz6rhUTcxTQjTyI4'),
    track20: gdriveUrl('1bTcikHcXhZLR4aEYZQS4GdiWsRLibJMa'),
    track21: gdriveUrl('14MuL2QVPfkyHNEqsoLvyoO7kuujDXIO7'),
    track22: gdriveUrl('1KqFJpx4sfOm0LJ06pDk8EoB_qow0f-mP'),
    track23: gdriveUrl('1nOX5NZk98di2fYSyPNgDX2QuxaxRGsMc'),
    track24: gdriveUrl('1-SItnOIpxXxmQCTzgwD1pYpbPFN3m4fw'),
    track25: gdriveUrl('1cOibuSkQZ15bVCdj9Y9k7FYKlGR8-sWd'),
    track26: gdriveUrl('1er9frHVfKNwRJcn5zm5d3JSo30Q0z4BA'),
    track27: gdriveUrl('1Czax9Td7q1G1N3kjODPaeEuRmm_7MfbF'),
    track28: gdriveUrl('1AfkIAFFN3w2h7elrlFMe9otTGV4rxc8M'),
  },
} as const;

// Helper to get all covid tracks as array
export function getCovidTracks(): string[] {
  return Object.values(AUDIO_URLS.covid);
}

// Helper to get mood tracks as array
export function getMoodTracks(mood: 'happy' | 'neutral' | 'sad'): string[] {
  return Object.values(AUDIO_URLS[mood]);
}

export default AUDIO_URLS;
