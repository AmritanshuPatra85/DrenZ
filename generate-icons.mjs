import sharp from 'sharp';
import fs from 'fs';

fs.mkdirSync('public/icons', { recursive: true });

const svg192 = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="192" height="192"><rect width="192" height="192" rx="32" fill="#0d0d08"/><text x="96" y="120" font-family="Arial Black" font-size="80" font-weight="900" fill="#F5A623" text-anchor="middle">D</text></svg>`);

const svg512 = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512"><rect width="512" height="512" rx="80" fill="#0d0d08"/><text x="256" y="320" font-family="Arial Black" font-size="220" font-weight="900" fill="#F5A623" text-anchor="middle">D</text></svg>`);

await sharp(svg192).png().toFile('public/icons/icon-192.png');
console.log('icon-192.png done');

await sharp(svg512).png().toFile('public/icons/icon-512.png');
console.log('icon-512.png done');