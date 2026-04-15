import LearningResource from '../models/LearningResource';
import { LearningResourceRoadmapDto } from '../types/careerRoadmap';
import { normalizeSkillTag } from '../utils/skillTagNormalize';

function buildSkillIndex(skills: string[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const s of skills) {
    const key = normalizeSkillTag(s);
    if (key.length > 0) map.set(key, s);
  }
  return map;
}

export type LeanLearningResource = {
  _id: unknown;
  title: string;
  description?: string | null;
  url?: string | null;
  tags: string[];
};

/** Матчинг в памяти: один список ресурсов на все карты одного ответа API */
export function mapLearningResourcesBySkillTags(
  skillsToDevelop: string[],
  resources: LeanLearningResource[]
): LearningResourceRoadmapDto[] {
  const skillIndex = buildSkillIndex(skillsToDevelop || []);
  if (skillIndex.size === 0) return [];

  const out: LearningResourceRoadmapDto[] = [];

  for (const r of resources) {
    const matchedKeys = new Set<string>();
    for (const t of r.tags || []) {
      const nt = normalizeSkillTag(t);
      if (skillIndex.has(nt)) matchedKeys.add(nt);
    }
    if (matchedKeys.size === 0) continue;

    const matchedSkills = [...matchedKeys].map((k) => skillIndex.get(k)!);

    out.push({
      id: String(r._id),
      title: r.title,
      description: r.description ?? null,
      url: r.url ?? null,
      tags: r.tags,
      matchedSkills,
    });
  }

  return out;
}

export async function loadActiveLearningResourcesLean(): Promise<LeanLearningResource[]> {
  return LearningResource.find({
    isActive: true,
    tags: { $exists: true, $ne: [] },
  })
    .sort({ sortOrder: 1, title: 1 })
    .lean();
}
