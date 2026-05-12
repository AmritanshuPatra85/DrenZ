export function generateHandoffCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function validateHandoffCode(code: string): boolean {
  return /^\d{6}$/.test(code);
}