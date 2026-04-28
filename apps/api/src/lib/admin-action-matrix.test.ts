import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  ADMIN_ACTION_MATRIX,
  ADMIN_ACTION_TYPE_VALUES,
  ADMIN_ACTION_ZOD_TUPLE,
  resolveAdminAction
} from './admin-action-matrix.js';

describe('admin-action-matrix', () => {
  it('ADMIN_ACTION_TYPE_VALUES covers every matrix key exactly once', () => {
    const keys = new Set(Object.keys(ADMIN_ACTION_MATRIX));
    assert.equal(ADMIN_ACTION_TYPE_VALUES.length, keys.size);
    for (const v of ADMIN_ACTION_TYPE_VALUES) {
      assert.ok(keys.has(v), `extra or unknown action: ${v}`);
    }
    for (const k of keys) {
      assert.ok(
        (ADMIN_ACTION_TYPE_VALUES as readonly string[]).includes(k),
        `matrix key missing from tuple: ${k}`,
      );
    }
  });

  it('resolveAdminAction returns permissions for valid combos', () => {
    const r = resolveAdminAction('start_report_review', 'report');
    assert.ok(r);
    assert.deepEqual([...r!.permissions], ['reports:write']);
    assert.equal(resolveAdminAction('hide_post', 'report'), null);
  });

  it('ADMIN_ACTION_ZOD_TUPLE matches matrix keys in same order as ADMIN_ACTION_TYPE_VALUES', () => {
    assert.deepEqual([...ADMIN_ACTION_ZOD_TUPLE], [...ADMIN_ACTION_TYPE_VALUES]);
  });
});
