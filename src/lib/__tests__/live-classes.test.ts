import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockFindMany, mockFindUnique } = vi.hoisted(() => ({
  mockFindMany: vi.fn(),
  mockFindUnique: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  db: {
    liveClass: {
      findMany: mockFindMany,
      findUnique: mockFindUnique,
    },
  },
}));

import { listUpcomingClasses, listPastClasses, getClassDetail, isClassFull } from '@/lib/live-classes';

function makeClass(overrides: Record<string, unknown> = {}) {
  return {
    id: 'lc-1',
    title: 'Test Class',
    description: 'A test class',
    instructorName: 'Instructor A',
    scheduledAt: new Date('2026-07-20T10:00:00Z'),
    durationMinutes: 60,
    meetingUrl: 'https://meet.example.com/lc-1',
    recordingUrl: null,
    maxAttendees: 50,
    cancelledAt: null,
    cancellationReason: null,
    course: { id: 'c-1', slug: 'test-course', title: 'Test Course' },
    registrations: [],
    ...overrides,
  };
}

describe('live-classes.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-15T00:00:00Z'));
  });

  describe('listUpcomingClasses', () => {
    it('returns mapped upcoming classes with registration count', async () => {
      const klass = makeClass({ registrations: [{ id: 'r1', userId: 'u1' }, { id: 'r2', userId: 'u2' }] });
      mockFindMany.mockResolvedValue([klass]);

      const result = await listUpcomingClasses(null);

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isPublished: true,
            cancelledAt: null,
            scheduledAt: { gte: expect.any(Date) },
          }),
        }),
      );
      expect(result).toHaveLength(1);
      expect(result[0].registrationCount).toBe(2);
      expect(result[0].isUserRegistered).toBeNull();
    });

    it('sets isUserRegistered when userId is provided', async () => {
      const klass = makeClass({ registrations: [{ id: 'r1', userId: 'u1' }] });
      mockFindMany.mockResolvedValue([klass]);

      const result = await listUpcomingClasses('u1');
      expect(result[0].isUserRegistered).toBe(true);
    });

    it('sets isUserRegistered to false when user not registered', async () => {
      const klass = makeClass({ registrations: [{ id: 'r1', userId: 'u2' }] });
      mockFindMany.mockResolvedValue([klass]);

      const result = await listUpcomingClasses('u1');
      expect(result[0].isUserRegistered).toBe(false);
    });

    it('returns empty array when no upcoming classes', async () => {
      mockFindMany.mockResolvedValue([]);
      const result = await listUpcomingClasses(null);
      expect(result).toEqual([]);
    });
  });

  describe('listPastClasses', () => {
    it('returns past classes with take limit of 12', async () => {
      mockFindMany.mockResolvedValue([makeClass()]);

      const result = await listPastClasses(null);

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isPublished: true,
            scheduledAt: { lt: expect.any(Date) },
          }),
          take: 12,
          orderBy: { scheduledAt: 'desc' },
        }),
      );
      expect(result).toHaveLength(1);
    });

    it('sets isUserRegistered when userId is provided', async () => {
      const klass = makeClass({ registrations: [{ id: 'r1', userId: 'u1' }] });
      mockFindMany.mockResolvedValue([klass]);

      const result = await listPastClasses('u1');
      expect(result[0].isUserRegistered).toBe(true);
    });

    it('sets isUserRegistered to false when user not registered', async () => {
      const klass = makeClass({ registrations: [{ id: 'r1', userId: 'u2' }] });
      mockFindMany.mockResolvedValue([klass]);

      const result = await listPastClasses('u1');
      expect(result[0].isUserRegistered).toBe(false);
    });
  });

  describe('getClassDetail', () => {
    it('returns full detail when class exists with user registration', async () => {
      const klass = makeClass({
        registrations: [{ id: 'r1', userId: 'u1', registeredAt: new Date('2026-07-14T12:00:00Z') }],
        _count: { registrations: 1 },
      });
      mockFindUnique.mockResolvedValue(klass);

      const result = await getClassDetail('lc-1', 'u1');

      expect(result).not.toBeNull();
      expect(result!.registrationCount).toBe(1);
      expect(result!.isUserRegistered).toBe(true);
      expect(result!.registeredAt).toEqual(new Date('2026-07-14T12:00:00Z'));
    });

    it('returns null when class not found', async () => {
      mockFindUnique.mockResolvedValue(null);
      const result = await getClassDetail('lc-999', 'u1');
      expect(result).toBeNull();
    });

    it('returns isUserRegistered false when user not registered', async () => {
      const klass = makeClass({
        registrations: [],
        _count: { registrations: 0 },
      });
      mockFindUnique.mockResolvedValue(klass);

      const result = await getClassDetail('lc-1', 'u1');
      expect(result!.isUserRegistered).toBe(false);
      expect(result!.registeredAt).toBeNull();
    });
  });

  describe('isClassFull', () => {
    it('returns true when registrations >= maxAttendees', async () => {
      mockFindUnique.mockResolvedValue({ maxAttendees: 50, _count: { registrations: 50 } });
      expect(await isClassFull('lc-1')).toBe(true);
    });

    it('returns false when registrations < maxAttendees', async () => {
      mockFindUnique.mockResolvedValue({ maxAttendees: 50, _count: { registrations: 30 } });
      expect(await isClassFull('lc-1')).toBe(false);
    });

    it('returns false when class not found', async () => {
      mockFindUnique.mockResolvedValue(null);
      expect(await isClassFull('lc-999')).toBe(false);
    });
  });
});
