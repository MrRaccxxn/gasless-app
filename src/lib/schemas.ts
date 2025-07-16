import { z } from 'zod';

// MetaTransfer struct validation
export const MetaTransferSchema = z.object({
  owner: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid owner address'),
  token: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid token address'),
  recipient: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid recipient address'),
  amount: z.string().regex(/^\d+$/, 'Invalid amount'),
  fee: z.string().regex(/^\d+$/, 'Invalid fee'),
  deadline: z.string().regex(/^\d+$/, 'Invalid deadline'),
  nonce: z.string().regex(/^\d+$/, 'Invalid nonce'),
});

// PermitData struct validation
export const PermitDataSchema = z.object({
  value: z.string().regex(/^\d+$/, 'Invalid permit value'),
  deadline: z.string().regex(/^\d+$/, 'Invalid permit deadline'),
  v: z.number().min(27).max(28),
  r: z.string().regex(/^0x[a-fA-F0-9]{64}$/, 'Invalid r signature'),
  s: z.string().regex(/^0x[a-fA-F0-9]{64}$/, 'Invalid s signature'),
});

// Main request schema
export const RelayRequestSchema = z.object({
  metaTransfer: MetaTransferSchema,
  permitData: PermitDataSchema,
  signature: z.string().regex(/^0x[a-fA-F0-9]+$/, 'Invalid signature'),
  recaptchaToken: z.string().min(1, 'reCAPTCHA token required'),
});

// Response schemas
export const RelayResponseSchema = z.object({
  success: z.boolean(),
  txHash: z.string().optional(),
  error: z.string().optional(),
});

// Types derived from schemas
export type MetaTransfer = z.infer<typeof MetaTransferSchema>;
export type PermitData = z.infer<typeof PermitDataSchema>;
export type RelayRequest = z.infer<typeof RelayRequestSchema>;
export type RelayResponse = z.infer<typeof RelayResponseSchema>;