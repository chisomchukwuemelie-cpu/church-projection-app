
export interface Song {
    id: string;
    title: string;
    lyrics: string;
    author?: string;
}

const STORAGE_KEY = 'lumina_songs_v2'; // Version 2 to force refresh

export const getSongs = (): Song[] => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [
        { id: '1', title: 'Way Maker', lyrics: 'You are here, moving in our midst\nI worship You, I worship You\nYou are here, working in this place\nI worship You, I worship You\n\nWay Maker, Miracle Worker, Promise Keeper\nLight in the darkness\nMy God, that is who You are', author: 'Sinach' },
        { id: '2', title: 'Excess Love', lyrics: 'Your love is kind\nYour love is patient\nYou fill my heart\nWith so much peace and joy\nYou’re amazing\nYou make my life feel brand new\nJesus You’re amazing\nYou make my life feel brand new\n\nJesus You love me too much o\nToo much o, too much o, excess love o', author: 'Mercy Chinwo' },
        { id: '3', title: 'Imela', lyrics: 'Imela, Imela\nOkaka, Onyekeruwa\nImela, Imela\nEze mo, Onye nwe anyi\n\nWhen I think upon Your goodness\nAnd Your faithfulness each day\nI’m convinced it’s not because I am worthy\nBut for Your Love and for Your Grace', author: 'Nathaniel Bassey' },
        { id: '4', title: 'Nara', lyrics: 'Nara ekele mo\nNara otito mo\nNara ekele mo\nNara otito mo\n\nWhat shall I render to Jehovah?\nFor He has done so very much for me\nWhat shall I render to Jehovah?\nFor He has done so very much for me', author: 'Tim Godfrey' },
        { id: '5', title: 'You Are Great', lyrics: 'You are great, yes You are holy\nYou are great, yes You are holy\nYou are great, yes You are holy\nYou are great, yes You are holy\n\nMighty God, Hallowed be Thy Name\nFaithful God, Hallowed be Thy Name', author: 'Steve Crown' },
        { id: '6', title: 'Ekwueme', lyrics: 'Ekwueme! Ekwueme!\nYou are the Living God o!\nEze no one like You\n\nYou are the Living God o!\nEze no one like You\n\nYou have done me well\nYou have done me well\nYou have done me well\nJesus', author: 'Prospa Ochimana' },
        { id: '7', title: 'Fragrance to Fire', lyrics: 'The fragrance of my worship\nRose up to the Father\nNo longer a sweet smelling savour\nBut it turned into fire\n\nFirst it was fragrance\nThen it turned to fire\nMy worship is my weapon\nThis is how I win my battles', author: 'Dunsin Oyekan' },
        { id: '8', title: 'Onise Iyanu', lyrics: 'Onise Iyanu\nYou are the God of awesome wonders\nI’ve tasted of Your power\nOnise Iyanu\nYou have shown me so much mercy\nMuch more than I deserve\n\nMy eyes have seen, my ears have heard\nThe wonders of Your praise', author: 'Nathaniel Bassey' },
        { id: '9', title: 'Omemma', lyrics: 'Omemma, Omemma\nOmemma, Omemma\nImela o, Chim o\n\nLook at what the Lord has done\nHe turned my mourning into dancing', author: 'Sinach' },
        { id: '10', title: 'Obinasom', lyrics: 'See what the Lord has done\nSee what the Lord has done\nWhat we waited for has come to pass\nSee what the Lord has done\n\nCan you see it? Can you see it?\nCan you see it? Can you see it?\nObinasom, Obinasom\nYou make me cry, You make me laugh\nYou make me smile, Obinasom', author: 'Mercy Chinwo' },
        { id: '11', title: 'Miracle No Dey Tire Jesus', lyrics: 'Miracle no dey tire Jesus\nMiracle no dey tire Jesus\nMiracle no dey tire Jesus\nHe is the Miracle Worker\n\nHe has done it for me\nHe has done it for me\nHe has done it for me\nHe is the Miracle Worker', author: 'Moses Bliss' },
        { id: '12', title: 'Too Faithful', lyrics: 'You are too faithful to fail me\nYou are too faithful to disappoint me\nYou’ve proven Yourself in my life\nAnd I’ve come to realize\nYou are too faithful to fail me', author: 'Moses Bliss' },
        { id: '13', title: 'Olowogbogboro', lyrics: 'Olowogbogboro is turning things around\nOlowogbogboro is turning things around\nOlowogbogboro is turning things around\nFor my good\n\nFor my good\nFor my good\nHe’s turning things around for my good', author: 'Nathaniel Bassey' },
        { id: '14', title: 'Wonderful Wonder', lyrics: 'You are a wonderful wonder\nYour name is a wonderful wonder\nJesus, wonderful wonder\n\nSummer and winter\nAutumn and spring\nMountains and blue skies\nAnd the seas', author: 'Nathaniel Bassey' },
        { id: '15', title: 'Oniduro Mi', lyrics: 'E je ki n ma so ti Oniduro mi\nE je ki n ma so ti Oniduro mi\nTalo so pe o ti tan?\nTalo so pe ko see se?\nOniduro mi e seun o', author: 'Adeyinka Alaseyori' },
        { id: '16', title: 'Bigger Everyday', lyrics: 'You are bigger than what people say\nYou are bigger than what people say\nYou are bigger than what people say\nJehovah, You are bigger than what people say\n\nI’m getting bigger everyday\nBigger everyday\nNo limitations\nWe taking over', author: 'Moses Bliss' },
        { id: '17', title: 'Trust in You', lyrics: 'You did not create me to worry\nYou did not create me to fear\nBut You created me to worship daily\nSo I will leave it all right here\n\nI will trust in You\nI will trust in You', author: 'Anthony Brown' },
        { id: '18', title: 'Logan Ti Ode', lyrics: 'Logan ti o de\nIwoluloke\nIwoluloke\nLogan ti o de\n\nThe moment He steps in\nEverything changes\nThe moment He steps in\nMiracles happen', author: 'Tope Alabi' },
        { id: '19', title: 'Ijoya', lyrics: 'Ijoya, Ijoya\nIjoya, Ijoya\n\nIt is time to dance\nIt is time to praise\nMake we dance\nMake we praise the Lord', author: 'Weird MC' },
        { id: '20', title: 'Hallelujah Challenge Praise', lyrics: 'Olowogbogboro\nOlowogbogboro\nNathaniel Bassey lead us in praise\nWe lift our hands\nWe shout for joy', author: 'Nathaniel Bassey' },
        { id: '21', title: 'Chinedum', lyrics: 'Chinedum o\nChinedum o\nAnywhere I go\nWhatever I do\nChinedum o\n\nHe is leading me\nHe is guiding me\nHe is watching over me', author: 'Mercy Chinwo' },
        { id: '22', title: 'Aka Akaya', lyrics: 'Aka Akaya\nNa emere m ihe oma\nAka Akaya\nNa agworo m oria\n\nThe hand of the Lord\nIs doing good things for me', author: 'Gabriel Eziashi' },
        { id: '23', title: 'Capable God', lyrics: 'You are the Capable God o\nWhat You cannot do does not exist o\nCapable God o\nWhat You cannot do does not exist o', author: 'Judikay' },
        { id: '24', title: 'Firm Foundation', lyrics: 'Christ is my firm foundation\nThe rock on which I stand\nWhen everything around me is shaken\nI’ve never been more glad\nThat I put my faith in Jesus\nHe’s never let me down', author: 'Maverick City Music' },
        { id: '25', title: 'I Will Wait', lyrics: 'I will wait for You\nI will wait for You\nI will wait for You\nTill You come\n\nSpirit break out\nBreak our walls down\nSpirit break out', author: 'Dunsin Oyekan' },
        { id: '26', title: 'Breathe', lyrics: 'Breathe on me\nBreathe on me\nBreath of God\nBreathe on me\n\nYesterday’s gone\nToday is here\nEmpty me now\nFill me again', author: 'Dunsin Oyekan' },
        { id: '27', title: 'Open Up', lyrics: 'Open up the floodgates\nOpen up the floodgates\nOf heaven\nLet it rain\nLet it rain', author: 'Dunsin Oyekan' },
        { id: '28', title: 'Victory Belongs to Jesus', lyrics: 'Victory belongs to Jesus\nVictory belongs to Him\nVictory belongs to Jesus\nVictory belongs to Him', author: 'Todd Dulaney' },
        { id: '29', title: 'You Are Yahweh', lyrics: 'You are Yahweh\nEh eh eh\nYou are Yahweh\n\nYou are Yahweh\nAlpha and Omega\nYou are Yahweh\nAlpha and Omega', author: 'Steve Crown' },
        { id: '30', title: 'Awesome God', lyrics: 'You are an awesome God\nYou are an awesome God\nYou are an awesome God\nYou are an awesome God\n\nMighty God\nAgeless One\nAncient of Days\nYou are an awesome God', author: 'Sinach' },
        { id: '31', title: 'My Daddy My Daddy', lyrics: 'My Daddy My Daddy\nYour baby is singing\nI will be singing and dancing and shouting\nFor the rest of eternity\n\nMy Daddy My Daddy\nYour baby is singing', author: 'Lawrence Oyor' },
        { id: '32', title: 'Igbo Praise Medley', lyrics: 'Chukwu na-eme mma\nEkele diri gi\nChukwu na-eme mma\nEkele diri gi', author: 'Public Domain' }
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
    const queryTokens = rawQuery.split(/\s+/).filter(t => t.length > 2);

    if (!rawQuery) return [];

    const songs = getSongs();
    const matches = songs.map(song => {
        let score = 0;
        const normalizedTitle = normalizeForSearch(song.title);
        const normalizedLyrics = normalizeForSearch(song.lyrics);
        const rawLyrics = song.lyrics.toLowerCase();

        // 1. Title Match (High Priority)
        if (normalizedTitle === normalizedQuery) score += 100;
        else if (normalizedTitle.includes(normalizedQuery)) score += 50;

        // 2. Exact Phrase Match in Lyrics
        if (rawLyrics.includes(rawQuery)) score += 40;

        // 3. Token Match (for misheard words)
        let matchedTokens = 0;
        queryTokens.forEach(token => {
            if (rawLyrics.includes(token)) matchedTokens++;
        });

        if (queryTokens.length > 0) {
            score += (matchedTokens / queryTokens.length) * 30;
        }

        return { song, score };
    });

    // Filter and Sort
    return matches
        .filter(m => m.score > 10) // Min score threshold
        .sort((a, b) => b.score - a.score)
        .map(m => m.song);
};
