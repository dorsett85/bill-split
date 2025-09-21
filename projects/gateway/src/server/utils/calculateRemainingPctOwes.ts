import type { LineItemParticipantRead } from '../dto/lineItemParticipant.ts';

/**
 * Given a participant id and a list of line item participants, calculate how
 * much more each remaining participant owes for each line item.
 */
export const calculateRemainingPctOwes = (
  participantId: number,
  lineItemParticipants: LineItemParticipantRead[],
): { ids: number[]; owes: number }[] => {
  // Here we'll group by each line item with the outstanding pct the deleted
  // participant owes and the ids of the remaining people to distribute it
  // amongst.
  const participantOwesByLineItem: Record<
    string,
    { outstandingPct: number; ids: number[] }
  > = {};

  for (const lip of lineItemParticipants) {
    participantOwesByLineItem[lip.lineItemId] ??= {
      outstandingPct: 0,
      ids: [],
    };

    if (lip.participantId === participantId) {
      participantOwesByLineItem[lip.lineItemId].outstandingPct = lip.pctOwes;
    } else {
      participantOwesByLineItem[lip.lineItemId].ids.push(lip.id);
    }
  }

  return (
    Object.values(participantOwesByLineItem)
      // Remove any items where there are no other records to update
      .filter(({ ids }) => ids.length !== 0)
      .map(({ outstandingPct, ids }) => {
        return {
          ids,
          owes: outstandingPct / ids.length,
        };
      })
  );
};
