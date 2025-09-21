import { describe, expect, it } from 'vitest';
import type { LineItemParticipantRead } from '../dto/lineItemParticipant.ts';
import { calculateRemainingPctOwes } from './calculateRemainingPctOwes.ts';

/**
 * Helper to build a LineItemParticipantRead entry quickly.
 */
const lip = (
  id: number,
  lineItemId: number,
  participantId: number,
  pctOwes: number,
): LineItemParticipantRead => ({ id, lineItemId, participantId, pctOwes });

describe('calculateRemainingPctOwes', () => {
  it('splits outstanding pct evenly among remaining participants for a single line item', () => {
    const line = 100; // lineItemId
    const removedParticipantId = 2;
    const inputs: LineItemParticipantRead[] = [
      lip(1, line, 1, 0.4), // remaining
      lip(2, line, removedParticipantId, 0.3), // to remove
      lip(3, line, 3, 0.3), // remaining
    ];

    const result = calculateRemainingPctOwes(removedParticipantId, inputs);

    expect(result).toHaveLength(1);
    expect(result[0].ids.sort()).toEqual([1, 3]); // uses line item participant ids
    expect(result[0].owes).toBeCloseTo(0.15); // 0.3 / 2
  });

  it('handles multiple line items with different outstanding percentages', () => {
    const removedParticipantId = 10;
    const inputs: LineItemParticipantRead[] = [
      // Line item A
      lip(101, 1000, removedParticipantId, 0.2),
      lip(102, 1000, 2, 0.5),
      lip(103, 1000, 3, 0.3),
      // Line item B
      lip(201, 2000, 4, 0.6),
      lip(202, 2000, removedParticipantId, 0.4),
    ];

    const result = calculateRemainingPctOwes(removedParticipantId, inputs);

    // We don't guarantee order, so assert contents
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ids: [102, 103],
          owes: expect.closeTo(0.1, 5),
        }), // 0.2 / 2
        expect.objectContaining({ ids: [201], owes: expect.closeTo(0.4, 5) }), // 0.4 / 1
      ]),
    );
    expect(result).toHaveLength(2);
  });

  it('returns the full outstanding pct when the removed participant is the only one on a line item', () => {
    const removedParticipantId = 5;
    const inputs: LineItemParticipantRead[] = [
      lip(50, 500, removedParticipantId, 1.0),
    ];

    const result = calculateRemainingPctOwes(removedParticipantId, inputs);

    expect(result).toHaveLength(0);
  });

  it('yields zero owes when the participant to remove is not found in the list', () => {
    const removedParticipantId = 999; // not present
    const inputs: LineItemParticipantRead[] = [
      lip(1, 10, 1, 0.6),
      lip(2, 10, 2, 0.4),
    ];

    const result = calculateRemainingPctOwes(removedParticipantId, inputs);

    expect(result).toHaveLength(1);
    expect(result[0].ids.sort()).toEqual([1, 2]);
    expect(result[0].owes).toBeCloseTo(0); // outstandingPct remains 0
  });

  it('correctly handles three remaining participants sharing the outstanding pct', () => {
    const removedParticipantId = 7;
    const inputs: LineItemParticipantRead[] = [
      lip(11, 77, 1, 0.2),
      lip(12, 77, 2, 0.2),
      lip(13, 77, 3, 0.2),
      lip(14, 77, removedParticipantId, 0.4),
    ];

    const result = calculateRemainingPctOwes(removedParticipantId, inputs);

    expect(result).toHaveLength(1);
    expect(result[0].ids.sort()).toEqual([11, 12, 13]);
    expect(result[0].owes).toBeCloseTo(0.1333333, 5); // 0.4 / 3
  });
});
