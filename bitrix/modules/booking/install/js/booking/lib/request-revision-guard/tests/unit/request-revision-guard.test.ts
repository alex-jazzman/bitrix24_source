import { describe, it } from 'mocha';
import { assert } from 'chai';

import { RequestRevisionGuard } from '../../src/request-revision-guard';

describe('RequestRevisionGuard', () => {
	let guard: RequestRevisionGuard;

	beforeEach(() => {
		guard = new RequestRevisionGuard();
	});

	it('marks previous revision as outdated after next request for same entity', () => {
		const firstRevision = guard.next(42);
		const secondRevision = guard.next(42);

		assert.isFalse(guard.isActual(42, firstRevision));
		assert.isTrue(guard.isActual(42, secondRevision));
	});

	it('tracks revisions independently for different entities', () => {
		const firstBookingRevision = guard.next(42);
		const secondBookingRevision = guard.next(77);

		assert.isTrue(guard.isActual(42, firstBookingRevision));
		assert.isTrue(guard.isActual(77, secondBookingRevision));
	});
});
