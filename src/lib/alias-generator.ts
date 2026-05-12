const ADJECTIVES = [
  "Crimson",
  "Silent",
  "Swift",
  "Nebula",
  "Vintage",
  "Arc",
  "Solar",
  "Echo",
  "Cobalt",
  "Mellow",
  "Nova",
  "Urban",
];

const NOUNS = [
  "Falcon",
  "Thread",
  "Rider",
  "Atlas",
  "Pixel",
  "Voyager",
  "Cipher",
  "Comet",
  "Scout",
  "Groove",
  "Orbit",
  "Pulse",
];

function pickRandom(items: string[]) {
  return items[Math.floor(Math.random() * items.length)];
}

export function generateAliases(count = 3): string[] {
  const unique = new Set<string>();

  while (unique.size < count) {
    const adjective = pickRandom(ADJECTIVES);
    const noun = pickRandom(NOUNS);
    const suffix = Math.floor(10 + Math.random() * 90);
    unique.add(`${adjective}${noun}${suffix}`);
  }

  return Array.from(unique);
}
