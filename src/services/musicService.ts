// src/services/musicService.ts

export interface TrackResult {
  trackId: number;
  trackName: string;
  artistName: string;
  albumName: string;
  artworkUrl: string;
  previewUrl: string; // File MP3/M4A 30 detik dari iTunes
}

/**
 * Mencari lagu di iTunes Search API berdasarkan kata kunci.
 * Mengombinasikan katalog Indonesia (ID) & US agar musik lokal dan global tercover lengkap.
 */
export async function searchTracks(query: string, limit: number = 8): Promise<TrackResult[]> {
  if (!query || query.trim().length < 2) return [];

  try {
    const encodedQuery = encodeURIComponent(query.trim());

    // Fetch paralel dari region Indonesia (ID) & US
    const [responseID, responseUS] = await Promise.all([
      fetch(`https://itunes.apple.com/search?term=${encodedQuery}&entity=song&country=id&limit=${limit}`),
      fetch(`https://itunes.apple.com/search?term=${encodedQuery}&entity=song&country=us&limit=${limit}`),
    ]);

    const dataID = responseID.ok ? await responseID.json() : { results: [] };
    const dataUS = responseUS.ok ? await responseUS.json() : { results: [] };

    // Gabungkan hasil dari kedua region (Utamakan katalog ID untuk lagu lokal)
    const rawCombined = [...(dataID.results || []), ...(dataUS.results || [])];

    // Filter duplikat berdasarkan trackId
    const uniqueTracksMap = new Map<number, any>();
    for (const item of rawCombined) {
      if (item.trackId && !uniqueTracksMap.has(item.trackId)) {
        uniqueTracksMap.set(item.trackId, item);
      }
    }

    const mappedResults: TrackResult[] = Array.from(uniqueTracksMap.values()).map((item: any) => ({
      trackId: item.trackId,
      trackName: item.trackName,
      artistName: item.artistName,
      albumName: item.collectionName || '',
      // Mengubah gambar cover ke ukuran lebih tinggi (300x300) agar jernih
      artworkUrl: item.artworkUrl100 ? item.artworkUrl100.replace('100x100bb', '300x300bb') : '',
      previewUrl: item.previewUrl,
    }));

    return mappedResults.slice(0, limit);
  } catch (error) {
    console.error('[MusicService] Error searching tracks:', error);
    return [];
  }
}