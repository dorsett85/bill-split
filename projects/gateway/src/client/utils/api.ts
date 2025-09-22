import { BillResponse, IdResponse } from '../pages/bills/[id]/dto.ts';

export const fetchBill = async (billId: number): Promise<BillResponse> => {
  const res = await fetch(`/api/bills/${billId}`);
  return BillResponse.parse(await res.json());
};

type UpdateBillBody = {
  gratuity: number;
};

export const updateBill = async (
  billId: number,
  body: UpdateBillBody,
  signal?: AbortSignal,
): Promise<IdResponse> => {
  const res = await fetch(`/api/bills/${billId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
    signal,
  });
  return IdResponse.parse(await res.json());
};

export const createBillParticipant = async (
  billId: number,
  name: string,
): Promise<IdResponse> => {
  const res = await fetch(`/api/bills/${billId}/participants`, {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
  return IdResponse.parse(await res.json());
};

export const deleteParticipant = async (
  billId: number,
  participantId: number,
): Promise<IdResponse> => {
  const res = await fetch(
    `/api/bills/${billId}/participants/${participantId}`,
    {
      method: 'DELETE',
    },
  );
  return IdResponse.parse(await res.json());
};
