export const SALES_WHATSAPP = (import.meta.env.VITE_SALES_WHATSAPP || '').trim();

export const isSalesWhatsAppValid = /^\d+$/.test(SALES_WHATSAPP);
