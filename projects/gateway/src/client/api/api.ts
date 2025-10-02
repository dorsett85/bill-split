import { BillResponse, ParticipantResponse } from '../pages/bills/[id]/dto.ts';
import { IdResponse } from './dto.ts';

export const postVerifyAccess = async (
  accessPin: string,
): Promise<Response> => {
  return await fetch(`/api/verify-access`, {
    method: 'POST',
    body: JSON.stringify({ accessPin }),
  });
};

export const createBill = async (form: HTMLFormElement): Promise<Response> => {
  return await fetch('/api/bills', {
    method: 'POST',
    body: new FormData(form),
  });
};

export const fetchBill = async (billId: number): Promise<BillResponse> => {
  const res = await fetch(`/api/bills/${billId}`);
  return BillResponse.parse(await res.json());
};

type UpdateBillBody = {
  tip: number;
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

export const fetchBillParticipants = async (
  billId: number,
): Promise<ParticipantResponse> => {
  const res = await fetch(`/api/bills/${billId}/participants`);
  return ParticipantResponse.parse(await res.json());
};

export const deleteBillParticipant = async (
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

export const createLineItemParticipant = async (
  lineItemId: number,
  participantId: number,
): Promise<IdResponse> => {
  const res = await fetch(`/api/line-item-participants`, {
    method: 'POST',
    body: JSON.stringify({ lineItemId, participantId }),
  });
  return IdResponse.parse(await res.json());
};

export const deleteLineItemParticipant = async (
  id: number,
): Promise<IdResponse> => {
  const res = await fetch(`/api/line-item-participants/${id}`, {
    method: 'DELETE',
  });
  return IdResponse.parse(await res.json());
};

export const updateParticipant = async (
  participantId: number,
  name: string,
): Promise<IdResponse> => {
  const res = await fetch(`/api/participants/${participantId}`, {
    method: 'PATCH',
    body: JSON.stringify({ name }),
  });
  return IdResponse.parse(await res.json());
};
