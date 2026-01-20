
export interface Song {
    id: string;
    title: string;
    lyrics: string;
    author?: string;
}

const STORAGE_KEY = 'lumina_songs';

export const getSongs = (): Song[] => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [
        {
            id: '1',
            title: 'Amazing Grace',
            lyrics: 'Amazing grace! How sweet the sound\nThat saved a wretch like me!\nI once was lost, but now am found;\nWas blind, but now I see.',
            author: 'John Newton'
        },
        {
            id: '2',
            title: 'How Great Thou Art',
            lyrics: 'O Lord, my God, when I in awesome wonder\nConsider all the worlds Thy Hands have made\nI see the stars, I hear the rolling thunder\nThy power throughout the universe displayed',
            author: 'Stuart K. Hine'
        }
    ];
};

export const saveSong = (song: Song) => {
    const songs = getSongs();
    const index = songs.findIndex(s => s.id === song.id);
    if (index >= 0) {
        songs[index] = song;
    } else {
        songs.push(song);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(songs));
};

export const deleteSong = (id: string) => {
    const songs = getSongs().filter(s => s.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(songs));
};

export const searchSongs = (query: string): Song[] => {
    const cleanQuery = query.toLowerCase().trim();
    if (!cleanQuery) return [];

    const songs = getSongs();
    const matches = songs.map(song => {
        let score = 0;
        const cleanTitle = song.title.toLowerCase();
        const cleanLyrics = song.lyrics.toLowerCase();

        // 1. Exact Title Match
        if (cleanTitle === cleanQuery) score += 100;
        // 2. Title includes Query ("Grace" -> "Amazing Grace")
        else if (cleanTitle.includes(cleanQuery)) score += 50;
        // 2.5 Query includes Title ("Sing Amazing Grace" -> "Amazing Grace")
        else if (cleanQuery.includes(cleanTitle) && cleanTitle.length > 3) score += 80;

        // 3. Lyrics Lines Match
        // Check if query appears in lyrics (substring)
        if (cleanLyrics.includes(cleanQuery)) {
            score += 20;
            // Bonus if it matches a whole line start
            if (cleanLyrics.includes(`\n${cleanQuery}`)) score += 10;
        }

        return { song, score };
    });

    // Filter and Sort
    return matches
        .filter(m => m.score > 0)
        .sort((a, b) => b.score - a.score)
        .map(m => m.song);
};
