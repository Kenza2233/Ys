export function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:v=|\/v\/|embed\/|shorts\/|youtu\.be\/|watch\?v=)([^#&?]*)/,
    /youtube\.com\/watch\?v=([^#&?]*)/,
    /youtu\.be\/([^#&?]*)/,
    /youtube\.com\/shorts\/([^#&?]*)/,
    /youtube\.com\/embed\/([^#&?]*)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}
