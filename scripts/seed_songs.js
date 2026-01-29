
const SONGS_KEY = 'lumina_songs';

const dummySongs = Array.from({ length: 20 }, (_, i) => ({
    id: `song-${Date.now()}-${i}`,
    title: `Test Song ${i + 1}`,
    lyrics: `Verse 1\nThis is a test song about scrolling.\nWe need to make sure the list overflows.\n\nChorus\nScrolling, scrolling, scrolling,\nKeep that lists a-rolling!`
}));

const current = JSON.parse(localStorage.getItem(SONGS_KEY) || '[]');
const next = [...current, ...dummySongs];
localStorage.setItem(SONGS_KEY, JSON.stringify(next));

console.log(`Added ${dummySongs.length} songs. Total: ${next.length}`);
