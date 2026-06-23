import { randomUUID } from "crypto";

type VerificationRecord = {
  email: string;
  name: string;
  password: string;
  token: string;
  expiresAt: number;
  verified: boolean;
};

const globalForVerification = globalThis as typeof globalThis & {
  verificationStore?: Map<string, VerificationRecord>;
  verificationTokensByEmail?: Map<string, string>;
};

const verificationStore = globalForVerification.verificationStore ?? new Map<string, VerificationRecord>();
const verificationTokensByEmail = globalForVerification.verificationTokensByEmail ?? new Map<string, string>();

globalForVerification.verificationStore = verificationStore;
globalForVerification.verificationTokensByEmail = verificationTokensByEmail;

export function createVerificationRecord(email: string, name: string, password: string) {
  const previousToken = verificationTokensByEmail.get(email.toLowerCase());

  if (previousToken) {
    verificationStore.delete(previousToken);
  }

  // Generate 6-digit OTP
  const token = Math.floor(100000 + Math.random() * 900000).toString();
  const record: VerificationRecord = {
    email,
    name,
    password,
    token,
    expiresAt: Date.now() + 15 * 60 * 1000,
    verified: false,
  };

  verificationStore.set(token, record);
  verificationTokensByEmail.set(email.toLowerCase(), token);

  return record;
}

export function getVerificationRecord(token: string) {
  const record = verificationStore.get(token);

  if (!record) {
    return null;
  }

  if (record.expiresAt < Date.now()) {
    verificationStore.delete(token);
    if (verificationTokensByEmail.get(record.email.toLowerCase()) === token) {
      verificationTokensByEmail.delete(record.email.toLowerCase());
    }
    return null;
  }

  return record;
}

export function getVerificationRecordByEmail(email: string) {
  const token = verificationTokensByEmail.get(email.toLowerCase());

  if (!token) {
    return null;
  }

  return getVerificationRecord(token);
}

export function markVerificationUsed(token: string) {
  const record = getVerificationRecord(token);

  if (!record) {
    return null;
  }

  record.verified = true;
  verificationStore.set(token, record);

  return record;
}
