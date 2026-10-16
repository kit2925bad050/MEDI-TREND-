/**
 * Generates dynamic patient initials based on medical naming conventions.
 * Examples:
 *  - "S. Gurumurthy" -> "SG"
 *  - "Arun Kumar" -> "AK"
 *  - "Priya" -> "P"
 *  - "Sridharan Kumar" -> "SK"
 *  - "Dr. Arvind Kumar" -> "AK"
 *  - "S" -> "S"
 */
export function getPatientInitials(name: string): string {
  if (!name || typeof name !== 'string') return 'PT';

  // Remove common medical prefixes / titles
  const cleanName = name
    .replace(/^(Dr\.|Dr|Mr\.|Mr|Mrs\.|Mrs|Ms\.|Ms|Prof\.|Prof)\s+/i, '')
    .trim();

  // Split on spaces and dots
  const parts = cleanName
    .split(/[\s.]+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  if (parts.length === 0) return 'PT';
  if (parts.length === 1) {
    return parts[0].substring(0, Math.min(2, parts[0].length)).toUpperCase();
  }

  // First letter of first name + First letter of last name
  const firstInitial = parts[0][0];
  const lastInitial = parts[parts.length - 1][0];

  return (firstInitial + lastInitial).toUpperCase();
}

/**
 * Compresses and resizes an uploaded profile photo before sending to Supabase Storage.
 * Ensures fast upload, consistent square aspect ratio, and avoids bloated payloads.
 */
export function compressAndResizeImage(
  file: File,
  maxDimension: number = 400,
  quality: number = 0.88
): Promise<File> {
  return new Promise((resolve, reject) => {
    // Validate format
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      reject(new Error('Invalid format. Please upload JPG, PNG, or WebP.'));
      return;
    }

    // Validate size (< 5MB)
    if (file.size > 5 * 1024 * 1024) {
      reject(new Error('File size exceeds 5MB limit.'));
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Crop to centered square
        const minDim = Math.min(width, height);
        const startX = (width - minDim) / 2;
        const startY = (height - minDim) / 2;

        const targetDim = Math.min(minDim, maxDimension);

        const canvas = document.createElement('canvas');
        canvas.width = targetDim;
        canvas.height = targetDim;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        ctx.drawImage(
          img,
          startX,
          startY,
          minDim,
          minDim,
          0,
          0,
          targetDim,
          targetDim
        );

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], `avatar_${Date.now()}.webp`, {
                type: 'image/webp',
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          'image/webp',
          quality
        );
      };
      img.onerror = (e) => reject(e);
    };
    reader.onerror = (e) => reject(e);
  });
}
