
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
        },
        {
            id: '3',
            title: 'Way Maker',
            lyrics: 'You are here, moving in our midst\nI worship You, I worship You\nYou are here, working in this place\nI worship You, I worship You\n\nWay Maker, Miracle Worker, Promise Keeper\nLight in the darkness\nMy God, that is who You are',
            author: 'Sinach'
        },
        {
            id: '4',
            title: 'Goodness of God',
            lyrics: 'I love You, Lord\nFor Your mercy never fails me\nAll my days, I’ve been held in Your hands\nFrom the moment that I wake up\nUntil I lay my head\nOh, I will sing of the goodness of God\n\nAnd all my life You have been faithful\nAnd all my life You have been so, so good\nWith every breath that I am able\nOh, I will sing of the goodness of God',
            author: 'Bethel Music'
        },
        {
            id: '5',
            title: '10,000 Reasons (Bless the Lord)',
            lyrics: 'Bless the Lord, O my soul\nO my soul\nWorship His holy name\nSing like never before\nO my soul\nI’ll worship Your holy name\n\nThe sun comes up, it’s a new day dawning\nIt’s time to sing Your song again\nWhatever may pass, and whatever lies before me\nLet me be singing when the evening comes',
            author: 'Matt Redman'
        },
        {
            id: '6',
            title: 'Jireh',
            lyrics: 'I’ll never be more loved than I am right now\nWasn’t holding You up\nSo there’s nothing I can do to let You down\nDoesn’t take a trophy to make You proud\nI’ll never be more loved than I am right now\n\nJireh, You are enough\nJireh, You are enough\nAnd I will be content in every circumstance\nJireh, You are enough',
            author: 'Elevation Worship'
        },
        {
            id: '7',
            title: 'What A Beautiful Name',
            lyrics: 'You were the Word at the beginning\nOne with God the Lord Most High\nYour hidden glory in creation\nNow revealed in You our Christ\n\nWhat a beautiful Name it is\nWhat a beautiful Name it is\nThe Name of Jesus Christ my King\nWhat a beautiful Name it is\nNothing compares to this\nWhat a beautiful Name it is\nThe Name of Jesus',
            author: 'Hillsong Worship'
        },
        {
            id: '8',
            title: 'Worthy Is The Lamb',
            lyrics: 'Thank you for the cross Lord\nThank you for the price You paid\nBearing all my sin and shame\nIn love You came\nAnd gave Amazing Grace\n\nWorthy is the Lamb\nSeated on the throne\nCrown You now with many crowns\nYou reign victorious',
            author: 'Hillsong Worship'
        },
        {
            id: '9',
            title: 'Imela',
            lyrics: 'Imela, Imela\nOkaka, Onyekeruwa\nImela, Imela\nEze mo, Onye nwe anyi\n\nWhen I think upon Your goodness\nAnd Your faithfulness each day\nI’m convinced it’s not because I am worthy\nBut for Your Love and for Your Grace',
            author: 'Nathaniel Bassey'
        },
        {
            id: '10',
            title: 'Excess Love',
            lyrics: 'Your love is kind\nYour love is patient\nYou fill my heart\nWith so much peace and joy\nYou’re amazing\nYou make my life feel brand new\nJesus You’re amazing\nYou make my life feel brand new\n\nJesus You love me too much o\nToo much o, too much o, excess love o',
            author: 'Mercy Chinwo'
        },
        {
            id: '11',
            title: 'You Are Great',
            lyrics: 'You are great, yes You are holy\nYou are great, yes You are holy\nYou are great, yes You are holy\nYou are great, yes You are holy\n\nMighty God, Hallowed be Thy Name\nFaithful God, Hallowed be Thy Name',
            author: 'Steve Crown'
        },
        {
            id: '12',
            title: 'Ekwueme',
            lyrics: 'Ekwueme! Ekwueme!\nYou are the Living God o!\nEze no one like You\n\nYou are the Living God o!\nEze no one like You\n\nYou have done me well\nYou have done me well\nYou have done me well\nJesus',
            author: 'Prospa Ochimana'
        },
        {
            id: '13',
            title: 'Fragrance to Fire',
            lyrics: 'The fragrance of my worship\nRose up to the Father\nNo longer a sweet smelling savour\nBut it turned into fire\n\nFirst it was fragrance\nThen it turned to fire\nMy worship is my weapon\nThis is how I win my battles',
            author: 'Dunsin Oyekan'
        },
        {
            id: '14',
            title: 'Nara',
            lyrics: 'Nara ekele mo\nNara otito mo\nNara ekele mo\nNara otito mo\n\nWhat shall I render to Jehovah?\nFor He has done so very much for me\nWhat shall I render to Jehovah?\nFor He has done so very much for me',
            author: 'Tim Godfrey'
        },
        {
            id: '15',
            title: 'Onise Iyanu',
            lyrics: 'Onise Iyanu\nYou are the God of awesome wonders\nI’ve tasted of Your power\nOnise Iyanu\nYou have shown me so much mercy\nMuch more than I deserve\n\nMy eyes have seen, my ears have heard\nThe wonders of Your praise',
            author: 'Nathaniel Bassey'
        },
        {
            id: '16',
            title: 'Omemma',
            lyrics: 'Omemma, Omemma\nOmemma, Omemma\nImela o, Chim o\n\nYou have done what no man can do\nYou have done what no man can do\nJesus, You have done what no man can do\n\nOmemma, Imela',
            author: 'Sinach'
        },
        {
            id: '17',
            title: 'Obinasom',
            lyrics: 'See what the Lord has done\nSee what the Lord has done\nWhat we waited for has come to pass\nSee what the Lord has done\n\nCan you see it? Can you see it?\nCan you see it? Can you see it?\nObinasom, Obinasom\nYou make me cry, You make me laugh\nYou make me smile, Obinasom',
            author: 'Mercy Chinwo'
        },
        {
            id: '18',
            title: 'Covenant Keeping God',
            lyrics: 'You are a Covenant Keeping God\nYou are a Covenant Keeping God\nYou are a Covenant Keeping God\nYou are a Covenant Keeping God\n\nNo matter what I face\nYou are a Covenant Keeping God\nYour word will never fail\nYou are a Covenant Keeping God',
            author: 'Victoria Orenze'
        },
        {
            id: '19',
            title: 'Tobechukwu',
            lyrics: 'Tobechukwu, Tobechukwu\nHe has done it for me\nTobechukwu, Tobechukwu\nHe has done it for me\n\nEven what no man can do\nYou have done it for me\nEven what no man can do\nYou have done it for me',
            author: 'Nathaniel Bassey ft. Mercy Chinwo'
        },
        {
            id: '20',
            title: 'Miracle No Dey Tire Jesus',
            lyrics: 'Miracle no dey tire Jesus\nMiracle no dey tire Jesus\nMiracle no dey tire Jesus\nHe is the Miracle Worker\n\nHe has done it for me\nHe has done it for me\nHe has done it for me\nHe is the Miracle Worker',
            author: 'Moses Bliss'
        },
        {
            id: '21',
            title: 'Daddy Wey Pamper',
            lyrics: 'Even when I fall Your hand\nYou still dey hold my hand\nLover of my soul\nYou no dey break my heart\nI will sing about Your mercy\nI will sing about Your grace\nNara ekele mo',
            author: 'Moses Bliss'
        },
        {
            id: '22',
            title: 'Olorun Agbaye',
            lyrics: 'Olorun Agbaye o\nYou are mighty o\nOlorun Agbaye o\nYou are mighty o\n\nSe bi iwo lo foju orun se aso bora\nOlorun Agbaye o\nYou are mighty o',
            author: 'Nathaniel Bassey'
        },
        {
            id: '23',
            title: 'Too Faithful',
            lyrics: 'You are too faithful to fail me\nYou are too faithful to disappoint me\nYou’ve proven Yourself in my life\nAnd I’ve come to realize\nYou are too faithful to fail me',
            author: 'Moses Bliss'
        },
        {
            id: '24',
            title: 'Kumama Papa',
            lyrics: 'Azua n’a lobiko\nKumama Papa eh\nAzua n’a lobiko\nKumama Papa eh\n\nKumama, Yahweh Kumama\nKumama, Yahweh Kumama\nKumama, Yahweh Kumama',
            author: 'Grace Lokwa'
        },
        {
            id: '25',
            title: 'Firm Foundation',
            lyrics: 'Christ is my firm foundation\nThe rock on which I stand\nWhen everything around me is shaken\nI’ve never been more glad\nThat I put my faith in Jesus\nHe’s never let me down',
            author: 'Maverick City Music'
        },
        {
            id: '26',
            title: 'I Will Wait',
            lyrics: 'I will wait for You\nI will wait for You\nI will wait for You\nTill You come\n\nSpirit break out\nBreak our walls down\nSpirit break out',
            author: 'Dunsin Oyekan'
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

export const normalizeForSearch = (text: string) => {
    return text.toLowerCase().replace(/[^a-z0-9]/g, '');
};

export const searchSongs = (query: string): Song[] => {
    const rawQuery = query.toLowerCase().trim();
    const normalizedQuery = normalizeForSearch(query);

    if (!rawQuery) return [];

    const songs = getSongs();
    const matches = songs.map(song => {
        let score = 0;
        const normalizedTitle = normalizeForSearch(song.title);
        const normalizedLyrics = normalizeForSearch(song.lyrics);

        // 1. Title Match
        if (normalizedTitle === normalizedQuery) score += 100;
        else if (normalizedTitle.includes(normalizedQuery)) score += 50;
        else if (normalizedQuery.includes(normalizedTitle) && normalizedTitle.length > 3) score += 80;

        // 2. Lyrics Match (Fuzzy)
        if (normalizedLyrics.includes(normalizedQuery)) {
            score += 30;
        } else {
            // Fallback: Check for raw substring (sometimes punctuation matters for short phrases?) 
            // - actually fuzzy is better.
        }

        return { song, score };
    });

    // Filter and Sort
    return matches
        .filter(m => m.score > 0)
        .sort((a, b) => b.score - a.score)
        .map(m => m.song);
};
