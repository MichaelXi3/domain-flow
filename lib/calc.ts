import { TimeSlot, Tag, DomainStat, SubtagStat, Domain, DomainEntity } from './types';
import { getDurationMinutes } from './utils/date';

/**
 * Calculate domain and subtag statistics from time slots
 * Implements split attribution: duration divided evenly across all tags
 */
export function calculateDomainStats(
  slots: TimeSlot[],
  allTags: Tag[],
  allDomains: DomainEntity[],
  attributionMode: 'split' | 'primary' = 'split'
): DomainStat[] {
  // Build tag lookup
  const tagMap = new Map<string, Tag>();
  allTags.forEach((tag) => tagMap.set(tag.id, tag));

  // Build domain lookup (domainId -> domain name)
  const domainMap = new Map<string, string>();
  allDomains.forEach((d) => domainMap.set(d.id, d.name));

  // Accumulate minutes per domain name and per tag
  const domainMinutes = new Map<string, number>();
  const tagMinutes = new Map<string, number>();

  for (const slot of slots) {
    const duration = getDurationMinutes(slot.start, slot.end);

    if (slot.tagIds.length === 0) {
      // Untagged slots don't contribute to any domain
      continue;
    }

    // Determine minutes to attribute per tag
    let minutesPerTag: number;
    if (attributionMode === 'split') {
      minutesPerTag = duration / slot.tagIds.length;
    } else {
      // Primary mode: first tag gets 100%
      minutesPerTag = duration;
    }

    const tagsToProcess = attributionMode === 'split' ? slot.tagIds : [slot.tagIds[0]];

    for (const tagId of tagsToProcess) {
      const tag = tagMap.get(tagId);
      if (!tag) continue;

      const domainName = domainMap.get(tag.domainId);
      if (!domainName) continue;

      // Add to domain
      const currentDomain = domainMinutes.get(domainName) || 0;
      domainMinutes.set(domainName, currentDomain + minutesPerTag);

      // Add to tag
      const currentTag = tagMinutes.get(tagId) || 0;
      tagMinutes.set(tagId, currentTag + minutesPerTag);
    }
  }

  // Calculate total for percentages
  const totalMinutes = Array.from(domainMinutes.values()).reduce((sum, m) => sum + m, 0);

  // Build domain stats
  const domainStats: DomainStat[] = [];

  for (const [domainName, minutes] of domainMinutes.entries()) {
    // Get all tags for this domain
    const domainEntity = allDomains.find((d) => d.name === domainName);
    if (!domainEntity) continue;

    const domainTagIds = allTags.filter((t) => t.domainId === domainEntity.id).map((t) => t.id);

    // Filter tag minutes for this domain and sort by minutes desc
    const subtags: SubtagStat[] = domainTagIds
      .map((tagId) => {
        const tag = tagMap.get(tagId)!;
        return {
          tagId,
          name: tag.name,
          minutes: tagMinutes.get(tagId) || 0,
        };
      })
      .filter((st) => st.minutes > 0)
      .sort((a, b) => b.minutes - a.minutes);

    domainStats.push({
      domain: domainName,
      minutes,
      percentage: totalMinutes > 0 ? (minutes / totalMinutes) * 100 : 0,
      subtags,
    });
  }

  // Sort by minutes desc
  return domainStats.sort((a, b) => b.minutes - a.minutes);
}

/**
 * Get top N subtags across all domains
 */
export function getTopSubtags(domainStats: DomainStat[], count: number = 3): SubtagStat[] {
  const allSubtags: SubtagStat[] = [];

  for (const domain of domainStats) {
    allSubtags.push(...domain.subtags);
  }

  return allSubtags.sort((a, b) => b.minutes - a.minutes).slice(0, count);
}

/**
 * Format minutes to human-readable string
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${Math.round(minutes)}m`;
  }

  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);

  if (mins === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${mins}m`;
}

/**
 * Generate daily summary text for markdown template
 */
export function generateDailySummary(
  domainStats: DomainStat[],
  date: string,
  slots?: TimeSlot[],
  allTags?: Tag[]
): string {
  const topSubtags = getTopSubtags(domainStats, 3);

  let summary = `## ${date}\n\n`;

  if (domainStats.length === 0) {
    summary += '_No time slots recorded for this day._\n\n';
    return summary;
  }

  summary += '### Time Allocation\n\n';

  for (const domain of domainStats) {
    summary += `- **${domain.domain}**: ${formatDuration(domain.minutes)} (${domain.percentage.toFixed(1)}%)\n`;

    // Show top 2 subtags per domain
    const topTwo = domain.subtags.slice(0, 2);
    for (const subtag of topTwo) {
      summary += `  - ${subtag.name}: ${formatDuration(subtag.minutes)}\n`;
    }
  }

  summary += '\n### Top Activities\n\n';
  for (let i = 0; i < topSubtags.length; i++) {
    const subtag = topSubtags[i];
    summary += `${i + 1}. ${subtag.name}: ${formatDuration(subtag.minutes)}\n`;
  }

  // Add Day Flow section
  if (slots && slots.length > 0 && allTags) {
    summary += '\n### Day Flow\n\n';
    
    // Sort slots by start time
    const sortedSlots = [...slots].sort((a, b) => a.start - b.start);
    
    for (const slot of sortedSlots) {
      const startTime = new Date(slot.start);
      const endTime = new Date(slot.end);
      const duration = Math.round((slot.end - slot.start) / (1000 * 60)); // minutes
      
      // Format time as HH:MM AM/PM
      const formatTime = (date: Date) => {
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
      };
      
      // Get tag names
      const tagNames = slot.tagIds
        .map(tagId => {
          const tag = allTags.find(t => t.id === tagId);
          return tag ? tag.name : null;
        })
        .filter(Boolean)
        .join(', ');
      
      const timeRange = `${formatTime(startTime)} - ${formatTime(endTime)}`;
      const durationText = formatDuration(duration);
      
      if (tagNames) {
        summary += `- ${timeRange} (${durationText}): ${tagNames}`;
        if (slot.note) {
          summary += ` — _${slot.note}_`;
        }
        summary += '\n';
      }
    }
  }

  summary += '\n### Reflection\n\n';
  summary += '_[Write your thoughts here...]_\n\n';

  return summary;
}
