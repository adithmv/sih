const crypto = require('crypto');

// Simulates a small network delay, like a real external API call
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Mock Aadhaar eKYC verification.
 * Real version: calls UIDAI eKYC API with Aadhaar + biometric.
 * Mock version: validates format and presence, no real biometric matching.
 */
async function callAadhaarAPI(aadhaarNumber, biometricHash) {
  await delay(300);

  const isValidFormat = /^\d{12}$/.test(aadhaarNumber);
  const hasBiometric = typeof biometricHash === 'string' && biometricHash.length > 10;

  if (!isValidFormat || !hasBiometric) {
    return { valid: false, uid: null };
  }

  return { valid: true, uid: aadhaarNumber };
}

/**
 * Mock ABHA lookup.
 * Real version: queries ABDM to check if this Aadhaar already has an ABHA ID.
 * Mock version: prototype has no cross-session ABHA registry, so this
 * always reports "not found" — every registration creates a fresh ABHA ID.
 * (Documented simplification — swap this for a real ABDM lookup in production.)
 */
async function lookupABHA(uid) {
  await delay(200);
  return null;
}

/**
 * Mock ABHA creation.
 * Real version: calls ABDM's create-ABHA-ID API.
 * Mock version: generates a 14-digit ID in ABHA's standard display format.
 */
async function createABHA(identity) {
  await delay(300);
  const digits = crypto.randomInt(0, 1e14).toString().padStart(14, '0');
  const formatted = `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6, 10)}-${digits.slice(10, 14)}`;
  return formatted;
}

/**
 * Mock Aawaz insurance linking.
 * Real version: calls Kerala Labour Dept.'s AIIS/Aawaz system.
 * Mock version: generates a Kerala-prefixed Aawaz ID.
 */
async function linkAawaz(identity) {
  await delay(200);
  const suffix = crypto.randomInt(10000, 99999);
  return `AWZ-KL-${suffix}`;
}

module.exports = { callAadhaarAPI, lookupABHA, createABHA, linkAawaz };