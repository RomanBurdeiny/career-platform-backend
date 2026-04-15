/** Нормализация тега навыка для сопоставления карта ↔ learning_resources */
export function normalizeSkillTag(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, ' ');
}
