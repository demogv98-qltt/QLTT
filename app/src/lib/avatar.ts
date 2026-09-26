/** A stable, deterministic "cute" emoji per student — same id always gets the same icon, no
 * network call or stored field needed. Purely cosmetic (roster/list readability). */
const ANIMAL_EMOJIS = [
  '🐱', '🐶', '🐰', '🦊', '🐻', '🐼', '🐨', '🦁', '🐯', '🐮',
  '🐷', '🐸', '🐵', '🦄', '🐔', '🐧', '🐦', '🦉', '🦋', '🐢',
  '🐳', '🐬', '🦈', '🐙', '🦀', '🐝', '🐞', '🦕', '🦖', '🌟',
]

export function studentAvatar(id: string): string {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0
  return ANIMAL_EMOJIS[hash % ANIMAL_EMOJIS.length]
}
