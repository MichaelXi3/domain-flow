/**
 * Tests for in-memory cache functionality
 */

import { dataCache } from '../lib/cache';

describe('DataCache', () => {
  beforeEach(() => {
    // Clear cache before each test
    dataCache.invalidateAll();
  });

  describe('basic operations', () => {
    it('should store and retrieve data', () => {
      const testData = { id: '1', name: 'Test' };
      dataCache.set('test-key', testData);
      
      const retrieved = dataCache.get('test-key');
      expect(retrieved).toEqual(testData);
    });

    it('should return null for non-existent keys', () => {
      const result = dataCache.get('non-existent');
      expect(result).toBeNull();
    });

    it('should handle different data types', () => {
      // String
      dataCache.set('string', 'hello');
      expect(dataCache.get('string')).toBe('hello');

      // Number
      dataCache.set('number', 42);
      expect(dataCache.get('number')).toBe(42);

      // Array
      const arr = [1, 2, 3];
      dataCache.set('array', arr);
      expect(dataCache.get('array')).toEqual(arr);

      // Object
      const obj = { a: 1, b: { c: 2 } };
      dataCache.set('object', obj);
      expect(dataCache.get('object')).toEqual(obj);
    });
  });

  describe('TTL (Time To Live)', () => {
    it('should expire data after TTL', async () => {
      const testData = { id: '1', name: 'Test' };
      dataCache.set('ttl-test', testData);
      
      // Should be available immediately
      expect(dataCache.get('ttl-test')).toEqual(testData);
      
      // Wait for TTL to expire (5 seconds + buffer)
      await new Promise(resolve => setTimeout(resolve, 5100));
      
      // Should be expired now
      expect(dataCache.get('ttl-test')).toBeNull();
    }, 10000); // Increase timeout to 10 seconds

    it('should not expire data before TTL', async () => {
      const testData = { id: '1', name: 'Test' };
      dataCache.set('ttl-test-2', testData);
      
      // Wait for 2 seconds (less than TTL)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Should still be available
      expect(dataCache.get('ttl-test-2')).toEqual(testData);
    }, 5000); // Increase timeout
  });

  describe('invalidation', () => {
    it('should invalidate specific key', () => {
      dataCache.set('key1', 'value1');
      dataCache.set('key2', 'value2');
      
      dataCache.invalidate('key1');
      
      expect(dataCache.get('key1')).toBeNull();
      expect(dataCache.get('key2')).toBe('value2');
    });

    it('should invalidate all keys', () => {
      dataCache.set('key1', 'value1');
      dataCache.set('key2', 'value2');
      dataCache.set('key3', 'value3');
      
      dataCache.invalidateAll();
      
      expect(dataCache.get('key1')).toBeNull();
      expect(dataCache.get('key2')).toBeNull();
      expect(dataCache.get('key3')).toBeNull();
    });

    it('should invalidate by pattern', () => {
      dataCache.set('tags:all', []);
      dataCache.set('tags:active', []);
      dataCache.set('domains:all', []);
      dataCache.set('domains:active', []);
      dataCache.set('other:data', []);
      
      dataCache.invalidatePattern('tags:');
      
      expect(dataCache.get('tags:all')).toBeNull();
      expect(dataCache.get('tags:active')).toBeNull();
      expect(dataCache.get('domains:all')).toEqual([]);
      expect(dataCache.get('domains:active')).toEqual([]);
      expect(dataCache.get('other:data')).toEqual([]);
    });

    it('should invalidate multiple patterns', () => {
      dataCache.set('tags:all', []);
      dataCache.set('tags:active', []);
      dataCache.set('domains:all', []);
      dataCache.set('domains:active', []);
      
      dataCache.invalidatePattern('tags:');
      dataCache.invalidatePattern('domains:');
      
      expect(dataCache.get('tags:all')).toBeNull();
      expect(dataCache.get('tags:active')).toBeNull();
      expect(dataCache.get('domains:all')).toBeNull();
      expect(dataCache.get('domains:active')).toBeNull();
    });
  });

  describe('cache performance', () => {
    it('should handle large datasets efficiently', () => {
      const largeData = Array.from({ length: 1000 }, (_, i) => ({
        id: `id-${i}`,
        name: `Item ${i}`,
        value: Math.random(),
      }));

      const start = performance.now();
      dataCache.set('large-dataset', largeData);
      const setTime = performance.now() - start;

      const getStart = performance.now();
      const retrieved = dataCache.get('large-dataset');
      const getTime = performance.now() - getStart;

      expect(retrieved).toEqual(largeData);
      expect(setTime).toBeLessThan(10); // Should be very fast
      expect(getTime).toBeLessThan(1); // Getting should be instant
    });

    it('should handle many keys efficiently', () => {
      const keyCount = 100;
      
      const start = performance.now();
      for (let i = 0; i < keyCount; i++) {
        dataCache.set(`key-${i}`, { id: i, data: `value-${i}` });
      }
      const setTime = performance.now() - start;

      const getStart = performance.now();
      for (let i = 0; i < keyCount; i++) {
        dataCache.get(`key-${i}`);
      }
      const getTime = performance.now() - getStart;

      expect(setTime).toBeLessThan(50);
      expect(getTime).toBeLessThan(50);
    });
  });

  describe('edge cases', () => {
    it('should handle null values', () => {
      dataCache.set('null-value', null);
      expect(dataCache.get('null-value')).toBeNull();
    });

    it('should handle undefined values', () => {
      dataCache.set('undefined-value', undefined);
      // Cache should store undefined, but get returns null for expired/missing
      const result = dataCache.get('undefined-value');
      expect(result === null || result === undefined).toBe(true);
    });

    it('should handle empty strings', () => {
      dataCache.set('empty-string', '');
      expect(dataCache.get('empty-string')).toBe('');
    });

    it('should handle empty arrays', () => {
      dataCache.set('empty-array', []);
      expect(dataCache.get('empty-array')).toEqual([]);
    });

    it('should handle empty objects', () => {
      dataCache.set('empty-object', {});
      expect(dataCache.get('empty-object')).toEqual({});
    });

    it('should overwrite existing keys', () => {
      dataCache.set('overwrite', 'original');
      expect(dataCache.get('overwrite')).toBe('original');

      dataCache.set('overwrite', 'updated');
      expect(dataCache.get('overwrite')).toBe('updated');
    });
  });

  describe('realistic usage scenarios', () => {
    it('should cache domain queries effectively', () => {
      const mockDomains = [
        { id: '1', name: 'Work', color: '#ff0000', order: 1 },
        { id: '2', name: 'Personal', color: '#00ff00', order: 2 },
      ];

      // Simulate first query (cache miss)
      let cached = dataCache.get<typeof mockDomains>('domains:all:active');
      expect(cached).toBeNull();

      // Store in cache
      dataCache.set('domains:all:active', mockDomains);

      // Simulate subsequent queries (cache hit)
      cached = dataCache.get<typeof mockDomains>('domains:all:active');
      expect(cached).toEqual(mockDomains);
      expect(cached?.length).toBe(2);
    });

    it('should cache tag queries effectively', () => {
      const mockTags = [
        { id: '1', domainId: 'd1', name: 'Project A', createdAt: 1000 },
        { id: '2', domainId: 'd1', name: 'Project B', createdAt: 2000 },
        { id: '3', domainId: 'd2', name: 'Exercise', createdAt: 3000 },
      ];

      dataCache.set('tags:all:active', mockTags);
      
      const cached = dataCache.get<typeof mockTags>('tags:all:active');
      expect(cached).toEqual(mockTags);
      expect(cached?.filter(t => t.domainId === 'd1').length).toBe(2);
    });

    it('should invalidate cache after domain creation', () => {
      const mockDomains = [{ id: '1', name: 'Work' }];
      dataCache.set('domains:all:active', mockDomains);
      
      // Simulate domain creation
      dataCache.invalidatePattern('domains:');
      
      expect(dataCache.get('domains:all:active')).toBeNull();
    });

    it('should invalidate cache after tag update', () => {
      const mockTags = [{ id: '1', name: 'Old Name' }];
      dataCache.set('tags:all:active', mockTags);
      
      // Simulate tag update
      dataCache.invalidatePattern('tags:');
      
      expect(dataCache.get('tags:all:active')).toBeNull();
    });
  });
});

