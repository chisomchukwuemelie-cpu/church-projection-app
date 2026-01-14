
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
