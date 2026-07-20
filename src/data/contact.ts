// src/data/contact.ts
// Canonical public contact + registration facts for CentuMania.
// Single source of truth — landing sections, footer and payment surfaces
// should import from here instead of hardcoding.

export const WHATSAPP_NUMBER_E164 = '917200132957'
export const WHATSAPP_DISPLAY = '+91 72001 32957'
export const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER_E164}`
export const WHATSAPP_HOURS = 'Mon–Sat · 9 AM – 8 PM IST'

// TODO(founder): set the real handle (e.g. 'centumania.official').
// While empty, Instagram chips auto-hide — never link to an unowned handle.
export const INSTAGRAM_HANDLE = ''
export const INSTAGRAM_LINK = INSTAGRAM_HANDLE ? `https://instagram.com/${INSTAGRAM_HANDLE}` : ''

export const MSME_REG_NO = 'UDYAM-TN-02-0479365'
export const MSME_LABEL = 'MSME (Udyam) Registered — Govt. of India'

export const FOUNDER_NAME = 'Prasanna Kumar'
export const FOUNDER_CREDENTIALS = 'B.Tech, Information Technology · M.Tech, Cloud Computing'
export const FOUNDER_CITY = 'Chennai, India'
