// Simple MVP Profanity Filter
const BANNED_WORDS = [
  '씨발', '개새끼', '존나', '좆', '병신', '지랄', '미친',
  'fuck', 'shit', 'bitch', 'asshole'
];

export function containsProfanity(text: string): boolean {
  if (!text) return false;
  const lowerText = text.toLowerCase();
  for (const word of BANNED_WORDS) {
    if (lowerText.includes(word)) {
      return true;
    }
  }
  return false;
}

export function maskProfanity(text: string): string {
  if (!text) return text;
  let masked = text;
  for (const word of BANNED_WORDS) {
    const regex = new RegExp(word, 'gi');
    masked = masked.replace(regex, '*'.repeat(word.length));
  }
  return masked;
}
