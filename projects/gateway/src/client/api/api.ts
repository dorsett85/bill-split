import { AccessTokenApiResponse } from '../pages/admin/dto.ts';
import {
  BillRecalculateResponse,
  BillResponse,
} from '../pages/bills/[id]/dto.ts';
import { CountResponse, IdResponse } from './dto.ts';

const baseOptions: RequestInit = {
  headers: {
    Accept: 'application/json',
  },
};

export const getAccessTokens = async (): Promise<AccessTokenApiResponse> => {
  const res = await fetch(`/api/access-tokens`, baseOptions);
  return AccessTokenApiResponse.parse(await res.json());
};

export const postAccessToken = async (pin: string): Promise<IdResponse> => {
  const res = await fetch(`/api/access-tokens`, {
    ...baseOptions,
    method: 'POST',
    body: JSON.stringify({ pin }),
  });
  return IdResponse.parse(await res.json());
};

export const patchAccessToken = async (
  pin: string,
  active: boolean,
): Promise<CountResponse> => {
  const res = await fetch(`/api/access-tokens/${pin}`, {
    ...baseOptions,
    method: 'PATCH',
    body: JSON.stringify({ active }),
  });
  return CountResponse.parse(await res.json());
};

export const deleteAccessToken = async (
  pin: string,
): Promise<CountResponse> => {
  const res = await fetch(`/api/access-tokens/${pin}`, {
    ...baseOptions,
    method: 'DELETE',
  });
  return CountResponse.parse(await res.json());
};

export const postBillCreateAccess = async (pin: string): Promise<Response> => {
  return await fetch(`/api/bills:create-access`, {
    ...baseOptions,
    method: 'POST',
    body: JSON.stringify({ pin }),
  });
};

export const createBill = async (form: HTMLFormElement): Promise<Response> => {
  return await fetch('/api/bills', {
    ...baseOptions,
    method: 'POST',
    body: new FormData(form),
  });
};

export const fetchBill = async (billId: number): Promise<BillResponse> => {
  const res = await fetch(`/api/bills/${billId}`, baseOptions);
  return BillResponse.parse(await res.json());
};

export const subscribeRecalculateBill = (billId: number): EventSource => {
  const url = `/api/bills/${billId}/recalculate/subscribe`;
  return new EventSource(url);
};

export const createBillParticipant = async (
  billId: number,
  name: string,
): Promise<IdResponse> => {
  const res = await fetch(`/api/bills/${billId}/participants`, {
    ...baseOptions,
    method: 'POST',
    body: JSON.stringify({ name }),
  });
  return IdResponse.parse(await res.json());
};

export const updateBillParticipant = async (
  billId: number,
  participantId: number,
  name: string,
): Promise<CountResponse> => {
  const res = await fetch(
    `/api/bills/${billId}/participants/${participantId}`,
    {
      ...baseOptions,
      method: 'PATCH',
      body: JSON.stringify({ name }),
    },
  );
  return CountResponse.parse(await res.json());
};

export const deleteBillParticipant = async (
  billId: number,
  participantId: number,
): Promise<BillRecalculateResponse> => {
  const res = await fetch(
    `/api/bills/${billId}/participants/${participantId}`,
    {
      ...baseOptions,
      method: 'DELETE',
    },
  );
  return BillRecalculateResponse.parse(await res.json());
};

export const createParticipantLineItem = async (
  billId: number,
  participantId: number,
  lineItemId: number,
): Promise<BillRecalculateResponse> => {
  const res = await fetch(
    `/api/bills/${billId}/participants/${participantId}/line-items/${lineItemId}`,
    {
      ...baseOptions,
      method: 'POST',
      body: JSON.stringify({ lineItemId, participantId }),
    },
  );
  return BillRecalculateResponse.parse(await res.json());
};

export const deleteParticipantLineItem = async (
  billId: number,
  participantId: number,
  lineItemId: number,
): Promise<BillRecalculateResponse> => {
  const res = await fetch(
    `/api/bills/${billId}/participants/${participantId}/line-items/${lineItemId}`,
    {
      ...baseOptions,
      method: 'DELETE',
    },
  );
  return BillRecalculateResponse.parse(await res.json());
};
