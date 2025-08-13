import { z } from 'zod';

export const aadhaarSchema = z.string().regex(/^\d{12}$/);
export const nameSchema = z.string().regex(/^[A-Za-z ]{3,}$/);
export const panSchema = z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/);

export const validateAadhaar = (v) => aadhaarSchema.safeParse(String(v || '')).success;
export const validateName = (v) => nameSchema.safeParse(String(v || '')).success;
export const validatePAN = (v) => panSchema.safeParse(String(v || '').toUpperCase()).success;
export const normalizePAN = (v) => String(v || '').toUpperCase();
