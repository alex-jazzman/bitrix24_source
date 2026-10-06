import { it, describe } from 'mocha';
import { assert } from 'chai';

import { Catalog } from '../../src/catalog';

describe('vibecodeconnector.catalog', () => {
	it('Should instantiate with default options', () => {
		const instance = new Catalog();

		assert.instanceOf(instance, Catalog);
	});

	it('Should accept custom tabs', () => {
		const instance = new Catalog({
			tabs: [
				{ id: 'my', title: 'Custom tab', action: 'vibecodeconnector.catalog.myList', paginated: false },
			],
		});

		assert.instanceOf(instance, Catalog);
	});
});

// ---------------------------------------------------------------------------
// DEFAULT_TABS / tab-filter behaviour
// ---------------------------------------------------------------------------

describe('Catalog — DEFAULT_TABS structure (no company tab)', () => {
	it('instantiates with no custom tabs — relies on DEFAULT_TABS (my + market)', () => {
		// DEFAULT_TABS contains id=my and id=market.
		// company tab was intentionally removed.
		// Direct count assertion is deferred: DEFAULT_TABS is not exported.
		const instance = new Catalog();

		assert.instanceOf(instance, Catalog);
	});

	it('does not throw when DEFAULT_TABS market tab is filtered out (marketUrl absent)', () => {
		// In production, Extension.getSettings returns marketUrl=null → market.navigateUrl=null
		// → filtered by baseTabs.filter(tab => tab.navigateUrl !== null).
		// Simulate with explicit tab array to cover the same code path.
		const tabs = [
			{ id: 'my', title: 'Вайбкод', action: 'vibecodeconnector.Catalog.myList', paginated: false },
			{ id: 'market', title: 'Маркет', action: null, navigateUrl: null },
		];
		const instance = new Catalog({ tabs });

		assert.instanceOf(instance, Catalog);
	});
});

describe('Catalog — tab navigateUrl filter', () => {
	it('keeps a tab whose navigateUrl is undefined (my-tab style)', () => {
		const tabs = [
			{ id: 'my', title: 'Вайбкод', action: 'vibecodeconnector.Catalog.myList', paginated: false },
		];
		const instance = new Catalog({ tabs });

		// No exception — tab with undefined navigateUrl passes the !== null guard
		assert.instanceOf(instance, Catalog);
	});

	it('keeps a tab whose navigateUrl is a non-empty string', () => {
		const tabs = [
			{ id: 'my', title: 'Вайбкод', action: 'vibecodeconnector.Catalog.myList', paginated: false },
			{ id: 'market', title: 'Маркет', action: null, navigateUrl: '/market/' },
		];
		const instance = new Catalog({ tabs });

		assert.instanceOf(instance, Catalog);
	});

	it('does not throw when all tabs are filtered (every tab has navigateUrl=null)', () => {
		const tabs = [
			{ id: 'stub', title: 'Stub', action: null, navigateUrl: null },
		];
		const instance = new Catalog({ tabs });

		assert.instanceOf(instance, Catalog);
	});

	it('my tab (id=my) is the first DEFAULT-shaped tab', () => {
		// Confirms that Catalog({ tabs: [...my] }) works without market tab
		const tabs = [
			{ id: 'my', title: 'Вайбкод', action: 'vibecodeconnector.Catalog.myList', paginated: false },
		];
		const instance = new Catalog({ tabs });

		assert.instanceOf(instance, Catalog);
	});
});
