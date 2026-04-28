export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export function checkUploadSize(file: File): string | null {
  if (file.size <= MAX_UPLOAD_BYTES) return null;
  const mb = (file.size / 1024 / 1024).toFixed(1);
  const limit = MAX_UPLOAD_BYTES / 1024 / 1024;
  return `File too large (${mb} MB). Max ${limit} MB.`;
}
