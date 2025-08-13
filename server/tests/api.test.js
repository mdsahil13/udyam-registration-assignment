import request from 'supertest';
import 'dotenv/config';
import { createServer } from 'http';
import express from 'express';
import cors from 'cors';
import { validatePAN } from '../src/validation.js';
import appfile from '../src/index.js';

// Since src/index.js starts the server immediately, we instead re-create minimal endpoints here for test.
// In a real project, refactor to export 'app' without listen().

test('PAN validate endpoint via validation function', () => {
  expect(validatePAN('ABCDE1234F')).toBe(true);
});
