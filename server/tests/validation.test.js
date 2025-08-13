import { validateAadhaar, validateName, validatePAN } from '../src/validation.js';

test('Aadhaar validation', () => {
  expect(validateAadhaar('123456789012')).toBe(true);
  expect(validateAadhaar('123')).toBe(false);
});

test('Name validation', () => {
  expect(validateName('Rahul Kumar')).toBe(true);
  expect(validateName('R1')).toBe(false);
});

test('PAN validation', () => {
  expect(validatePAN('ABCDE1234F')).toBe(true);
  expect(validatePAN('abcde1234f')).toBe(true); // normalized upper
  expect(validatePAN('ABCD1234F')).toBe(false);
});
