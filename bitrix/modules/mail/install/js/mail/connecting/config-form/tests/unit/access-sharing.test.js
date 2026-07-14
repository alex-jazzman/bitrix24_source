import assert from 'node:assert/strict';

import {
	getAccessCodeBySelectorTag,
	getSelectorItemByAccessCode,
} from '../../src/utils/access-sharing.ts';

const tag = (entityId, id) => ({
	getEntityId: () => entityId,
	getId: () => id,
});

assert.deepEqual(getSelectorItemByAccessCode('U11'), ['user', '11']);
assert.deepEqual(getSelectorItemByAccessCode('DR22'), ['department', '22']);
assert.deepEqual(getSelectorItemByAccessCode('D33'), ['department', '33:F']);
assert.equal(getSelectorItemByAccessCode('TEAM44'), null);

assert.equal(getAccessCodeBySelectorTag(tag('user', 11)), 'U11');
assert.equal(getAccessCodeBySelectorTag(tag('department', '22')), 'DR22');
assert.equal(getAccessCodeBySelectorTag(tag('department', '33:F')), 'D33');
assert.equal(getAccessCodeBySelectorTag(tag('structure-node', '44')), null);
assert.equal(getAccessCodeBySelectorTag(tag('department', 'team:44')), null);
