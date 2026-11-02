import assert from 'node:assert/strict';
import test from 'node:test';

import { assertDateOrder, toDateString } from '../src/utils/fechas.js';

test('toDateString normaliza textos, fechas y vacíos', () => {
  assert.equal(toDateString('2026-10-29 09:00:00'), '2026-10-29');
  assert.equal(toDateString('2026-12-31'), '2026-12-31');
  assert.equal(toDateString(new Date(2026, 11, 31, 8, 30)), '2026-12-31');
  assert.equal(toDateString(null), null);
  assert.equal(toDateString(undefined), null);
});

test('assertDateOrder acepta fechas en orden, iguales o incompletas', () => {
  assert.doesNotThrow(() => assertDateOrder('2026-10-29 09:00:00', '2026-12-31'));
  assert.doesNotThrow(() => assertDateOrder('2026-10-29 18:00:00', '2026-10-29'));
  assert.doesNotThrow(() => assertDateOrder('2026-10-29 09:00:00', null));
  assert.doesNotThrow(() => assertDateOrder(undefined, '2026-12-31'));
});

test('assertDateOrder rechaza una fecha final anterior a la inicial', () => {
  assert.throws(
    () => assertDateOrder('2026-11-02 09:00:00', '2026-10-29'),
    (error) => error.statusCode === 422 && error.code === 'VALIDATION_ERROR',
  );
  assert.throws(() => assertDateOrder(new Date(2026, 10, 2), new Date(2026, 9, 29)));
});
