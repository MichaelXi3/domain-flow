import { calculateDomainStats, getTopSubtags, formatDuration } from '../lib/calc';
import { TimeSlot, Tag, DomainEntity } from '../lib/types';

describe('calc.ts', () => {
  const mockDomains: DomainEntity[] = [
    {
      id: 'domain_study',
      name: 'Study',
      color: '#3b82f6',
      order: 0,
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: 'domain_health',
      name: 'Health',
      color: '#10b981',
      order: 1,
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: 'domain_work',
      name: 'Work',
      color: '#f59e0b',
      order: 2,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
  ];

  const mockTags: Tag[] = [
    {
      id: 'tag_cfa',
      domainId: 'domain_study',
      name: 'CFA',
      color: '#3b82f6',
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: 'tag_run',
      domainId: 'domain_health',
      name: 'Run',
      color: '#10b981',
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: 'tag_meeting',
      domainId: 'domain_work',
      name: 'Meeting',
      color: '#f59e0b',
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
  ];

  describe('calculateDomainStats', () => {
    it('should calculate split attribution correctly', () => {
      const slots: TimeSlot[] = [
        {
          id: '1',
          start: Date.now(),
          end: Date.now() + 60 * 60 * 1000, // 1 hour
          tagIds: ['tag_cfa', 'tag_run'], // Split between 2 tags
          version: 1,
          createdAt: Date.now(),
          updatedAt: Date.now()
        }
      ];

      const stats = calculateDomainStats(slots, mockTags, mockDomains, 'split');

      expect(stats).toHaveLength(2);
      expect(stats.find((s) => s.domain === 'Study')?.minutes).toBe(30);
      expect(stats.find((s) => s.domain === 'Health')?.minutes).toBe(30);
    });

    it('should calculate primary attribution correctly', () => {
      const slots: TimeSlot[] = [
        {
          id: '1',
          start: Date.now(),
          end: Date.now() + 60 * 60 * 1000, // 1 hour
          tagIds: ['tag_cfa', 'tag_run'], // Primary: tag_cfa (Study)
          version: 1,
          createdAt: Date.now(),
          updatedAt: Date.now()
        }
      ];

      const stats = calculateDomainStats(slots, mockTags, mockDomains, 'primary');

      expect(stats).toHaveLength(1);
      expect(stats.find((s) => s.domain === 'Study')?.minutes).toBe(60);
    });

    it('should handle untagged slots', () => {
      const slots: TimeSlot[] = [
        {
          id: '1',
          start: Date.now(),
          end: Date.now() + 60 * 60 * 1000,
          tagIds: [],
          version: 1,
          createdAt: Date.now(),
          updatedAt: Date.now()
        }
      ];

      const stats = calculateDomainStats(slots, mockTags, mockDomains, 'split');
      expect(stats).toHaveLength(0);
    });

    it('should calculate percentages correctly', () => {
      const slots: TimeSlot[] = [
        {
          id: '1',
          start: Date.now(),
          end: Date.now() + 30 * 60 * 1000, // 30 min
          tagIds: ['tag_cfa'],
          version: 1,
          createdAt: Date.now(),
          updatedAt: Date.now()
        },
        {
          id: '2',
          start: Date.now(),
          end: Date.now() + 90 * 60 * 1000, // 90 min
          tagIds: ['tag_run'],
          version: 1,
          createdAt: Date.now(),
          updatedAt: Date.now()
        }
      ];

      const stats = calculateDomainStats(slots, mockTags, mockDomains, 'split');
      
      const studyStat = stats.find((s) => s.domain === 'Study');
      const healthStat = stats.find((s) => s.domain === 'Health');

      expect(studyStat?.percentage).toBe(25); // 30 / 120 * 100
      expect(healthStat?.percentage).toBe(75); // 90 / 120 * 100
    });
  });

  describe('getTopSubtags', () => {
    it('should return top N subtags sorted by minutes', () => {
      const domainStats = calculateDomainStats(
        [
          {
            id: '1',
            start: Date.now(),
            end: Date.now() + 90 * 60 * 1000,
            tagIds: ['tag_run'],
            version: 1,
            createdAt: Date.now(),
            updatedAt: Date.now()
          },
          {
            id: '2',
            start: Date.now(),
            end: Date.now() + 30 * 60 * 1000,
            tagIds: ['tag_cfa'],
            version: 1,
            createdAt: Date.now(),
            updatedAt: Date.now()
          },
          {
            id: '3',
            start: Date.now(),
            end: Date.now() + 60 * 60 * 1000,
            tagIds: ['tag_meeting'],
            version: 1,
            createdAt: Date.now(),
            updatedAt: Date.now()
          }
        ],
        mockTags,
        mockDomains,
        'split'
      );

      const topSubtags = getTopSubtags(domainStats, 2);
      expect(topSubtags).toHaveLength(2);
      expect(topSubtags[0].name).toBe('Run');
      expect(topSubtags[1].name).toBe('Meeting');
    });
  });

  describe('formatDuration', () => {
    it('should format minutes correctly', () => {
      expect(formatDuration(45)).toBe('45m');
      expect(formatDuration(30)).toBe('30m');
    });

    it('should format hours correctly', () => {
      expect(formatDuration(60)).toBe('1h');
      expect(formatDuration(120)).toBe('2h');
    });

    it('should format hours and minutes correctly', () => {
      expect(formatDuration(90)).toBe('1h 30m');
      expect(formatDuration(135)).toBe('2h 15m');
    });
  });
});

