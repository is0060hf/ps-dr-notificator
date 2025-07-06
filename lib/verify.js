// lib/verify.js
import crypto from 'crypto';

export async function verifyPlanetScaleSignature(payload, signature, secret) {
  try {
    // HMAC-SHA256でハッシュを計算
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    // タイミング攻撃を防ぐため、crypto.timingSafeEqualを使用
    const trusted = Buffer.from(expectedSignature, 'utf8');
    const untrusted = Buffer.from(signature, 'utf8');

    if (trusted.length !== untrusted.length) {
      return false;
    }

    return crypto.timingSafeEqual(trusted, untrusted);
  } catch (error) {
    console.error('Error verifying signature:', error);
    return false;
  }
}