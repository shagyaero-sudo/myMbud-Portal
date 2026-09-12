// src/services/musicService.ts

export interface TrackResult {
  trackId: number;
  trackName: string;
  artistName: string;
  albumName: string;
  artworkUrl: string;
  previewUrl: string; // File MP3 30 detik dari iTunes
}

/**
 * Mencari lagu di iTunes Search API berdasarkan kata kunci
 */
export async function searchTracks(query: string, limit: number = 8): Promise<TrackResult[]> {
  if (!query || query.trim().length < 2) return [];

  try {
    const encodedQuery = encodeURIComponent(query.trim());
    const response = await fetch(
      `https://itunes.apple.com/search?term=${encodedQuery}&entity=song&limit=${limit}`
    );

    if (!response.ok) {
      throw new Error('Gagal mengambil data dari iTunes API');
    }

    const data = await response.json();

    return data.results.map((item: any) => ({
      trackId: item.trackId,
      trackName: item.trackName,
      artistName: item.artistName,
      albumName: item.collectionName,
      // Mengubah gambar cover ke ukuran lebih tinggi (300x300)
      artworkUrl: item.artworkUrl100 ? item.artworkUrl100.replace('100x100bb', '300x300bb') : '',
      previewUrl: item.previewUrl,
    }));
  } catch (error) {
    console.error('[MusicService] Error searching tracks:', error);
    return [];
  }
}