import { describe, expect, it } from 'vitest';
import {
  CryptoService,
  type CryptoServiceConstructor,
} from './CryptoService.ts';

const getCryptoService = <K extends keyof CryptoServiceConstructor>(
  args?: Pick<CryptoServiceConstructor, K>,
) => {
  return new CryptoService({
    key: 'M+Ps6Xz7/=G$k<:dg)B\\VZj(Evm?;r4c',
    ...args,
  });
};

describe('CryptoService', () => {
  it('signs/verifies session jwt', async () => {
    const IS_ADMIN = true;
    const cryptoService = getCryptoService();
    const token = cryptoService.signSessionJwt({ isAdmin: IS_ADMIN });

    expect(cryptoService.verifySessionJwt(token)?.isAdmin).toBe(true);
  });

  it('signs/verifies hmac', async () => {
    const TEXT = 'some_text';
    const cryptoService = getCryptoService();
    const token = cryptoService.signHmac(TEXT);

    expect(cryptoService.verifyHmac(token, TEXT)).toBe(true);
  });

  it('encrypts/decrypts text', () => {
    const TEXT = 'some_text';
    const cryptoService = getCryptoService();
    const { encryptedHex, ivHex } = cryptoService.encrypt(TEXT);

    expect(cryptoService.decrypt(encryptedHex, ivHex)).toBe(TEXT);
  });
});
