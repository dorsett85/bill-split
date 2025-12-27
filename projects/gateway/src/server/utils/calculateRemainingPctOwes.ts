import type { ParticipantLineItemRead } from '../dto/participantLineItem.ts';

/**
 * Given a participant id and a list of line item participants, calculate how
 * much more each remaining participant owes for each line item.
 */
export const calculateRemainingPctOwes = (
  participantId: number,
  participantLineItems: ParticipantLineItemRead[],
): { ids: number[]; owes: number }[] => {
  // Here we'll group by each line item with the outstanding pct the deleted
  // participant owes and the ids of the remaining people to distribute it
  // amongst.
  const participantOwesByLineItem: Record<
    string,
    { outstandingPct: number; ids: number[] }
  > = {};

  for (const pli of participantLineItems) {
    participantOwesByLineItem[pli.lineItemId] ??= {
      outstandingPct: 0,
      ids: [],
    };

    if (pli.participantId === participantId) {
      participantOwesByLineItem[pli.lineItemId].outstandingPct = pli.pctOwes;
    } else {
      participantOwesByLineItem[pli.lineItemId].ids.push(pli.id);
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
