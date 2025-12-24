import type { BillRead, BillResponse } from '../dto/bill.ts';
import type { LineItemRead } from '../dto/lineItem.ts';
import type { LineItemParticipantRead } from '../dto/lineItemParticipant.ts';
import type { ParticipantRead } from '../dto/participant.ts';

/**
 * This workhorse crunches the numbers for the bill and participants. Some top
 * level bill properties can probably get saved in the database from the bill
 * processor, which has things like the subTotal, total, etc. We can validate
 * these top level properties against our calculations, like adding up what
 * everyone owes (and hasn't claimed) and compare that against the total.
 *
 * Some Efficiencies may exist too. For instance we could send the FE maps of
 * which participants has which items for easy lookup. Like showing which other
 * participants have also claimed an item.
 */
export const calculateBill = (
  bill: BillRead,
  lineItems: LineItemRead[],
  lineItemParticipants: LineItemParticipantRead[],
  participants: ParticipantRead[],
): BillResponse => {
  const lineItemPriceLookup = Object.fromEntries(
    lineItems.map((li) => [li.id, li.price]),
  );

  const gratuity = bill.gratuity ?? 0;
  const tax = bill.tax ?? 0;
  const discount = bill.discount ?? 0;
  const subTotalRaw = lineItems.reduce((total, item) => item.price + total, 0);
  const subTotal = subTotalRaw - discount;
  const discountPct = discount / (discount + subTotal);

  const participantsLineItems: Record<
    string,
    { id: number; lineItemId: number; price: number; pctOwes: number }[]
  > = {};
  lineItemParticipants.forEach((lip) => {
    participantsLineItems[lip.participantId] ??= [];
    participantsLineItems[lip.participantId].push({
      id: lip.id,
      lineItemId: lip.lineItemId,
      price: lineItemPriceLookup[lip.lineItemId],
      pctOwes: lip.pctOwes,
    });
  });

  const participantsWithCalculations = participants.map((participant) => {
    let individualSubTotal = 0;
    participantsLineItems[participant.id]?.forEach((item) => {
      individualSubTotal += item.price * (item.pctOwes / 100);
    });
    individualSubTotal *= 1 - discountPct;

    const taxShare = subTotal > 0 ? (individualSubTotal / subTotal) * tax : 0;
    const gratuityShare =
      subTotal > 0 ? (individualSubTotal / subTotal) * gratuity : 0;
    const owes = individualSubTotal + taxShare + gratuityShare;

    return {
      id: participant.id,
      name: participant.name,
      lineItems: participantsLineItems[participant.id] ?? [],
      owes,
    };
  });

  const total = gratuity + tax + subTotal;

  return {
    ...bill,
    lineItems,
    participants: participantsWithCalculations,
    subTotal,
    total,
  };
};
