/**
 * Integration tests for database cache behavior
 * Tests the caching logic patterns used in db.ts
 */

import { dataCache } from '../lib/cache';

describe('Database Cache Integration', () => {
  beforeEach(() => {
    // Clear cache before each test
    dataCache.invalidateAll();
  });

  describe('cache patterns for domain queries', () => {
    const mockDomains = [
      {
        id: '1',
        name: 'Work',
        color: '#ff0000',
        order: 1,
        createdAt: 1000,
        updatedAt: 1000,
        deletedAt: undefined,
        archivedAt: undefined,
      },
      {
        id: '2',
        name: 'Personal',
        color: '#00ff00',
        order: 2,
        createdAt: 2000,
        updatedAt: 2000,
        deletedAt: undefined,
        archivedAt: undefined,
      },
    ];

    it('should cache domain data with correct key', () => {
      const cacheKey = 'domains:all:active';

      // Simulate what getAllDomains does
      dataCache.set(cacheKey, mockDomains);

      // Retrieve from cache
      const cached = dataCache.get(cacheKey);
      expect(cached).toEqual(mockDomains);
    });

    it('should simulate cache hit on subsequent queries', () => {
      const cacheKey = 'domains:all:active';
      let dbQueryCount = 0;

      // Simulate getAllDomains function
      const getAllDomains = () => {
        const cached = dataCache.get(cacheKey);
        if (cached) return cached;

        // Simulate DB query
        dbQueryCount++;
        const result = mockDomains;
        dataCache.set(cacheKey, result);
        return result;
      };

      // First call - cache miss
      const result1 = getAllDomains();
      expect(dbQueryCount).toBe(1);
      expect(result1).toEqual(mockDomains);

      // Second call - cache hit
      const result2 = getAllDomains();
      expect(dbQueryCount).toBe(1); // Should still be 1
      expect(result2).toEqual(mockDomains);
    });

    it('should invalidate cache after domain mutations', () => {
      const cacheKey = 'domains:all:active';
      dataCache.set(cacheKey, mockDomains);

      // Verify data is cached
      expect(dataCache.get(cacheKey)).toEqual(mockDomains);

      // Simulate createDomain/updateDomain/deleteDomain
      dataCache.invalidatePattern('domains:');

      // Cache should be cleared
      expect(dataCache.get(cacheKey)).toBeNull();
    });
  });

  describe('cache patterns for tag queries', () => {
    const mockTags = [
      {
        id: '1',
        domainId: 'd1',
        name: 'Project A',
        createdAt: 1000,
        updatedAt: 1000,
        deletedAt: undefined,
        archivedAt: undefined,
      },
      {
        id: '2',
        domainId: 'd1',
        name: 'Project B',
        createdAt: 2000,
        updatedAt: 2000,
        deletedAt: undefined,
        archivedAt: undefined,
      },
    ];

    it('should cache tag data with correct key', () => {
      const cacheKey = 'tags:all:active';

      dataCache.set(cacheKey, mockTags);

      const cached = dataCache.get(cacheKey);
      expect(cached).toEqual(mockTags);
    });

    it('should simulate cache hit behavior for tags', () => {
      const cacheKey = 'tags:all:active';
      let dbQueryCount = 0;

      const getAllTags = () => {
        const cached = dataCache.get(cacheKey);
        if (cached) return cached;

        dbQueryCount++;
        const result = mockTags;
        dataCache.set(cacheKey, result);
        return result;
      };

      // First call
      getAllTags();
      expect(dbQueryCount).toBe(1);

      // Second call
      getAllTags();
      expect(dbQueryCount).toBe(1); // Still 1
    });

    it('should invalidate cache after tag mutations', () => {
      const cacheKey = 'tags:all:active';
      dataCache.set(cacheKey, mockTags);

      // Simulate createTag/updateTag/deleteTag/archiveTag
      dataCache.invalidatePattern('tags:');

      expect(dataCache.get(cacheKey)).toBeNull();
    });
  });

  describe('cache invalidation patterns', () => {
    it('should invalidate domains cache pattern', () => {
      dataCache.set('domains:all:active', []);
      dataCache.set('domains:archived', []);
      dataCache.set('domains:custom', []);

      dataCache.invalidatePattern('domains:');

      expect(dataCache.get('domains:all:active')).toBeNull();
      expect(dataCache.get('domains:archived')).toBeNull();
      expect(dataCache.get('domains:custom')).toBeNull();
    });

    it('should invalidate tags cache pattern', () => {
      dataCache.set('tags:all:active', []);
      dataCache.set('tags:by-domain:1', []);
      dataCache.set('tags:recent', []);

      dataCache.invalidatePattern('tags:');

      expect(dataCache.get('tags:all:active')).toBeNull();
      expect(dataCache.get('tags:by-domain:1')).toBeNull();
      expect(dataCache.get('tags:recent')).toBeNull();
    });

    it('should not invalidate other patterns', () => {
      dataCache.set('domains:all:active', []);
      dataCache.set('tags:all:active', []);
      dataCache.set('timeslots:recent', []);

      // Invalidate only domains
      dataCache.invalidatePattern('domains:');

      expect(dataCache.get('domains:all:active')).toBeNull();
      expect(dataCache.get('tags:all:active')).toEqual([]);
      expect(dataCache.get('timeslots:recent')).toEqual([]);
    });

    it('should invalidate all caches after sync', () => {
      dataCache.set('domains:all:active', []);
      dataCache.set('tags:all:active', []);
      dataCache.set('custom:data', []);

      // Simulate syncPull completing
      dataCache.invalidateAll();

      expect(dataCache.get('domains:all:active')).toBeNull();
      expect(dataCache.get('tags:all:active')).toBeNull();
      expect(dataCache.get('custom:data')).toBeNull();
    });
  });

  describe('performance characteristics', () => {
    it('should demonstrate cache benefits', () => {
      let expensiveQueryCount = 0;

      const expensiveQuery = () => {
        expensiveQueryCount++;
        // Simulate expensive operation
        return Array.from({ length: 1000 }, (_, i) => ({ id: i }));
      };

      const cachedQuery = () => {
        const cached = dataCache.get('expensive:data');
        if (cached) return cached;

        const result = expensiveQuery();
        dataCache.set('expensive:data', result);
        return result;
      };

      // Run query 10 times
      for (let i = 0; i < 10; i++) {
        cachedQuery();
      }

      // Expensive query should only run once
      expect(expensiveQueryCount).toBe(1);
    });

    it('should handle rapid consecutive queries', () => {
      const data = { value: 'test' };
      const key = 'rapid:test';

      // Simulate rapid queries
      for (let i = 0; i < 100; i++) {
        if (i === 0) {
          dataCache.set(key, data);
        }
        const result = dataCache.get(key);
        expect(result).toEqual(data);
      }
    });
  });

  describe('TTL behavior in db context', () => {
    it('should expire after TTL forcing db refresh', async () => {
      const cacheKey = 'domains:all:active';
      const initialData = [{ id: '1', name: 'Initial' }];

      dataCache.set(cacheKey, initialData);
      expect(dataCache.get(cacheKey)).toEqual(initialData);

      // Wait for TTL (5+ seconds)
      await new Promise(resolve => setTimeout(resolve, 5100));

      // Cache should be expired
      expect(dataCache.get(cacheKey)).toBeNull();
    }, 10000); // Increase timeout for this test

    it('should serve from cache within TTL window', async () => {
      const cacheKey = 'tags:all:active';
      const data = [{ id: '1', name: 'Tag1' }];

      dataCache.set(cacheKey, data);

      // Wait 2 seconds (less than TTL)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Should still be cached
      expect(dataCache.get(cacheKey)).toEqual(data);
    }, 5000);
  });
});
