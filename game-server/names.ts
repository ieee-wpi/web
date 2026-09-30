import crypto from "node:crypto";
import { RegExpMatcher, englishDataset, englishRecommendedTransformers } from "obscenity";

const matcher = new RegExpMatcher({ ...englishDataset.build(), ...englishRecommendedTransformers });

export const MAX_NAME_LEN = 16;

// Trim, normalize lookalikes, and strip control / zero-width / bidi characters
// so two names that render the same compare equal.
export function normalizeName(raw: string) {
  return raw
    .normalize("NFKC")
    .replace(/[\p{Cc}\p{Cf}]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function nameKey(name: string) {
  return name.toLocaleLowerCase("en-US");
}

export type NameCheck = { ok: true; name: string } | { ok: false; reason: string };

export function checkName(raw: unknown): NameCheck {
  if (typeof raw !== "string") return { ok: false, reason: "Enter a nickname." };
  const name = normalizeName(raw);
  if (!name) return { ok: false, reason: "Enter a nickname." };
  if ([...name].length > MAX_NAME_LEN) return { ok: false, reason: `Nicknames are at most ${MAX_NAME_LEN} characters.` };
  if (matcher.hasMatch(name)) return { ok: false, reason: "Please pick a different nickname." };
  return { ok: true, name };
}

const ADJECTIVES = [
  "Amped", "Analog", "Binary", "Bold", "Bright", "Brisk", "Charged", "Clever", "Cosmic", "Crisp",
  "Digital", "Dynamic", "Electric", "Epic", "Fast", "Fuzzy", "Glowing", "Grounded", "Humble", "Hyper",
  "Jolly", "Kinetic", "Linear", "Lucky", "Magnetic", "Mighty", "Neon", "Nimble", "Ohmic", "Optical",
  "Parallel", "Plucky", "Quantum", "Quick", "Radiant", "Rapid", "Shiny", "Sonic", "Speedy", "Static",
  "Steady", "Sunny", "Swift", "Turbo", "Vivid", "Wired", "Witty", "Zappy", "Zen", "Zesty",
];
const ANIMALS = [
  "Axolotl", "Badger", "Beaver", "Bison", "Capybara", "Cheetah", "Corgi", "Coyote", "Dolphin", "Eagle",
  "Falcon", "Ferret", "Gecko", "Goat", "Hawk", "Hedgehog", "Heron", "Ibex", "Koala", "Lemur",
  "Llama", "Lynx", "Manatee", "Marmot", "Moose", "Narwhal", "Newt", "Ocelot", "Octopus", "Otter",
  "Owl", "Panda", "Pangolin", "Parrot", "Penguin", "Puffin", "Quokka", "Raccoon", "Raven", "Salmon",
  "Seal", "Sloth", "Squid", "Tapir", "Toucan", "Turtle", "Walrus", "Wombat", "Yak", "Zebra",
];

export function isGeneratedName(name: unknown) {
  if (typeof name !== "string") return false;
  const [adj, animal, ...rest] = name.split(" ");
  return rest.length === 0 && ADJECTIVES.includes(adj) && ANIMALS.includes(animal);
}

// Every generated name fits MAX_NAME_LEN (longest pair is 8 + 8 + 1).
export function generateName(taken: (name: string) => boolean) {
  for (let i = 0; i < 50; i++) {
    const name = `${ADJECTIVES[crypto.randomInt(ADJECTIVES.length)]} ${ANIMALS[crypto.randomInt(ANIMALS.length)]}`;
    if (!taken(name)) return name;
  }
  return `Player ${crypto.randomInt(1000, 10000)}`;
}
