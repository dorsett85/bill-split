import { describe, expect, it } from 'vitest';
import type { BillRead } from '../dto/bill.ts';
import type { LineItemRead } from '../dto/lineItem.ts';
import type { LineItemParticipantRead } from '../dto/lineItemParticipant.ts';
import type { ParticipantRead } from '../dto/participant.ts';
import { calculateBill } from './calculateBill.ts';

describe('calculateBill', () => {
  it('should calculate participant owes correctly', () => {
    const bill: BillRead = {
      id: 1,
      imagePath: 'test.jpg',
      imageStatus: 'ready',
      gratuity: 0,
      tax: 0,
      discount: 0,
      businessLocation: 'Test Location',
      businessName: 'Test Business',
      name: 'Test Bill',
    };

    const lineItems: LineItemRead[] = [
      { id: 1, billId: 1, name: 'Item 1', price: 100 },
    ];

    const lineItemParticipants: LineItemParticipantRead[] = [
      { id: 1, lineItemId: 1, participantId: 1, pctOwes: 50 },
    ];

    const participants: ParticipantRead[] = [{ id: 1, name: 'Participant 1' }];

    const result = calculateBill(
      bill,
      lineItems,
      lineItemParticipants,
      participants,
    );

    // If it's 50% of 100, it should be 50.
    // The bug was individualSubTotal += item.price + item.pctOwes / 100;
    // which would be 100 + 0.5 = 100.5
    expect(result.participants[0].owes!).toBe(50);
  });

  it('should handle multiple participants and items correctly', () => {
    const bill: BillRead = {
      id: 1,
      imagePath: 'test.jpg',
      imageStatus: 'ready',
      gratuity: 10,
      tax: 5,
      discount: 5,
      businessLocation: 'Test Location',
      businessName: 'Test Business',
      name: 'Test Bill',
    };

    // SubtotalRaw = 100
    // Discount = 5
    // Subtotal = 95
    // Tax = 5
    // Gratuity = 10
    // Total = 95 + 5 + 10 = 110

    const lineItems: LineItemRead[] = [
      { id: 1, billId: 1, name: 'Item 1', price: 60 },
      { id: 2, billId: 1, name: 'Item 2', price: 40 },
    ];

    const lineItemParticipants: LineItemParticipantRead[] = [
      { id: 1, lineItemId: 1, participantId: 1, pctOwes: 100 }, // 60
      { id: 2, lineItemId: 2, participantId: 1, pctOwes: 50 }, // 20
      { id: 3, lineItemId: 2, participantId: 2, pctOwes: 50 }, // 20
    ];

    const participants: ParticipantRead[] = [
      { id: 1, name: 'P1' },
      { id: 2, name: 'P2' },
    ];

    const result = calculateBill(
      bill,
      lineItems,
      lineItemParticipants,
      participants,
    );

    // DiscountPct = 5 / (5 + 95) = 0.05

    // P1:
    // Raw individualSubTotal = 60 + 20 = 80
    // After discount: 80 * (1 - 0.05) = 80 * 0.95 = 76
    // taxShare = (76 / 95) * 5 = 0.8 * 5 = 4
    // gratuityShare = (76 / 95) * 10 = 0.8 * 10 = 8
    // owes = 76 + 4 + 8 = 88

    // P2:
    // Raw individualSubTotal = 20
    // After discount: 20 * 0.95 = 19
    // taxShare = (19 / 95) * 5 = 0.2 * 5 = 1
    // gratuityShare = (19 / 95) * 10 = 0.2 * 10 = 2
    // owes = 19 + 1 + 2 = 22

    expect(result.subTotal).toBe(95);
    expect(result.total).toBe(110);

    expect(result.participants[0].owes!).toBe(88);

    expect(result.participants[1].owes!).toBe(22);

    expect(result.participants[0].owes! + result.participants[1].owes!).toBe(
      result.total,
    );
  });
});
