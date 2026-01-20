import fs from 'fs';
import https from 'https';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const bibles = [
    { name: 'kjv', url: 'https://raw.githubusercontent.com/thiagobodruk/bible/master/json/en_kjv.json' },
    { name: 'asv', url: 'https://raw.githubusercontent.com/thiagobodruk/bible/master/json/en_asv.json' },
    { name: 'bbe', url: 'https://raw.githubusercontent.com/thiagobodruk/bible/master/json/en_bbe.json' }
];

const download = (url, dest) => {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, (response) => {
            if (response.statusCode !== 200) {
                return reject(`Failed to download: ${response.statusCode}`);
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close(resolve);
            });
        }).on('error', (err) => {
            fs.unlink(dest, () => reject(err));
        });
    });
};

const main = async () => {
    const dir = path.join(__dirname, '../public/bibles');
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    for (const bible of bibles) {
        console.log(`Downloading ${bible.name}...`);
        try {
            await download(bible.url, path.join(dir, `${bible.name}.json`));
            console.log(`Downloaded ${bible.name}.json`);
        } catch (e) {
            console.error(`Failed to download ${bible.name} from ${bible.url}:`, e);
        }
    }
};

main();
