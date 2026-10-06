import { describe, it, beforeEach, afterEach } from 'mocha';
import { assert } from 'chai';
import sinon from 'sinon';
import { ajax } from 'main.core';

import { TabController } from '../../src/tab-controller';
import { CatalogState } from '../../src/components/popup-state-dropdown';

// ---------------------------------------------------------------------------
// Helper: create a minimal TabController backed by sinon-stubbed ajax.
// ---------------------------------------------------------------------------

const TAB_CONFIG_SIMPLE = Object.freeze({
	id: 'my',
	title: 'My',
	action: 'vibecodeconnector.Catalog.myList',
	paginated: false,
});

const TAB_CONFIG_PAGINATED = Object.freeze({
	id: 'my',
	title: 'My',
	action: 'vibecodeconnector.Catalog.myList',
});

describe('TabController — #mapItem ownerName normalization', () => {
	/** @type {sinon.SinonStub} */
	let ajaxStub;

	/** @type {TabController} */
	let controller;

	beforeEach(() => {
		ajaxStub = sinon.stub(ajax, 'runAction');
		controller = new TabController(TAB_CONFIG_SIMPLE, 20);
	});

	afterEach(() => {
		ajaxStub.restore();
	});

	/**
	 * Loads a single raw item through the real loadNext() path and returns
	 * the first mapped CatalogItem so we can assert on normalised fields.
	 *
	 * @param {object} raw
	 * @returns {Promise<import('../../src/tab-controller').CatalogItem>}
	 */
	async function loadWith(raw) {
		ajaxStub.resolves({ data: { items: [raw] } });
		await controller.loadNext();

		return controller.getItems()[0];
	}

	it('keeps a non-empty string as ownerName', async () => {
		const item = await loadWith({ id: 1, ownerName: 'Alice' });

		assert.strictEqual(item.ownerName, 'Alice');
	});

	it('normalizes empty string ownerName to null', async () => {
		const item = await loadWith({ id: 1, ownerName: '' });

		assert.isNull(item.ownerName);
	});

	it('normalizes null ownerName to null', async () => {
		const item = await loadWith({ id: 1, ownerName: null });

		assert.isNull(item.ownerName);
	});

	it('normalizes undefined ownerName to null', async () => {
		const item = await loadWith({ id: 1 /* ownerName absent */ });

		assert.isNull(item.ownerName);
	});

	it('normalizes numeric ownerName to null', async () => {
		const item = await loadWith({ id: 1, ownerName: 42 });

		assert.isNull(item.ownerName);
	});

	it('normalizes boolean ownerName to null', async () => {
		const item = await loadWith({ id: 1, ownerName: true });

		assert.isNull(item.ownerName);
	});

	it('normalizes object ownerName to null', async () => {
		const item = await loadWith({ id: 1, ownerName: { name: 'Bob' } });

		assert.isNull(item.ownerName);
	});
});

describe('TabController — myList pagination contract', () => {
	/** @type {sinon.SinonStub} */
	let ajaxStub;

	afterEach(() => {
		ajaxStub?.restore();
	});

	it('passes page navigation separately from data', async () => {
		ajaxStub = sinon.stub(ajax, 'runAction').resolves({
			data: {
				items: [],
				pagination: { offset: 0, limit: 20, hasNext: false },
			},
		});
		const controller = new TabController(TAB_CONFIG_PAGINATED, 20);

		await controller.loadNext();

		assert.strictEqual(ajaxStub.firstCall.args[0], 'vibecodeconnector.Catalog.myList');
		assert.deepEqual(ajaxStub.firstCall.args[1], {
			data: { state: CatalogState.Active },
			navigation: { page: 1, size: 20 },
		});
	});

	it('keeps query and extra data in data while pagination stays in navigation', async () => {
		ajaxStub = sinon.stub(ajax, 'runAction').resolves({
			data: {
				items: [],
				pagination: { offset: 0, limit: 10, hasNext: false },
			},
		});
		const controller = new TabController(
			{ ...TAB_CONFIG_PAGINATED, extraData: { previewUserId: 42 } },
			10,
		);

		controller.setQuery('prompt');
		await controller.loadNext();

		assert.deepEqual(ajaxStub.firstCall.args[1], {
			data: {
				previewUserId: 42,
				state: CatalogState.Active,
				q: 'prompt',
			},
			navigation: { page: 1, size: 10 },
		});
	});

	it('sends the current state in request data and reloads after a state switch', async () => {
		ajaxStub = sinon.stub(ajax, 'runAction').resolves({
			data: {
				items: [],
				pagination: { offset: 0, limit: 20, hasNext: false },
			},
		});
		const controller = new TabController(TAB_CONFIG_PAGINATED, 20);

		await controller.loadNext();
		assert.strictEqual(ajaxStub.firstCall.args[1].data.state, CatalogState.Active);

		controller.setState(CatalogState.Hidden);
		controller.reset();
		await controller.loadNext();

		assert.strictEqual(ajaxStub.callCount, 2);
		assert.strictEqual(ajaxStub.secondCall.args[1].data.state, CatalogState.Hidden);
		assert.deepEqual(ajaxStub.secondCall.args[1].navigation, { page: 1, size: 20 });
	});

	it('refresh() reloads the first page at the loaded size and swaps items in place', async () => {
		ajaxStub = sinon.stub(ajax, 'runAction');
		ajaxStub.onFirstCall().resolves({
			data: { items: [{ id: 1 }, { id: 2 }], pagination: { offset: 0, limit: 2, hasNext: true } },
		});
		ajaxStub.onSecondCall().resolves({
			data: { items: [{ id: 3 }, { id: 4 }], pagination: { offset: 2, limit: 2, hasNext: false } },
		});
		const controller = new TabController(TAB_CONFIG_PAGINATED, 2);

		await controller.loadNext();
		await controller.loadNext();
		assert.deepEqual(controller.getItems().map((row) => row.id), [1, 2, 3, 4]);

		ajaxStub.onThirdCall().resolves({
			data: { items: [{ id: 1 }, { id: 3 }, { id: 4 }], pagination: { offset: 0, limit: 4, hasNext: false } },
		});
		await controller.refresh();

		assert.deepEqual(ajaxStub.thirdCall.args[1].navigation, { page: 1, size: 4 }, 'refetches loaded extent as page 1');
		assert.deepEqual(controller.getItems().map((row) => row.id), [1, 3, 4], 'items swapped to the fresh set');
	});

	it('discards a stale in-flight response when reset() happens mid-load', async () => {
		let resolveStale;
		const staleResponse = new Promise((resolve) => { resolveStale = resolve; });
		ajaxStub = sinon.stub(ajax, 'runAction');
		ajaxStub.onFirstCall().returns(staleResponse);
		ajaxStub.onSecondCall().resolves({
			data: { items: [{ id: 99 }], pagination: { offset: 0, limit: 20, hasNext: false } },
		});
		const controller = new TabController(TAB_CONFIG_PAGINATED, 20);

		const stalePending = controller.loadNext();

		controller.setState(CatalogState.All);
		controller.reset();
		await controller.loadNext();

		resolveStale({ data: { items: [{ id: 1 }, { id: 2 }], pagination: { offset: 0, limit: 20, hasNext: true } } });
		await stalePending;

		assert.deepEqual(controller.getItems().map((row) => row.id), [99]);
		assert.isFalse(controller.shouldLoadMore(), 'fresh hasNext:false is preserved, stale hasNext:true discarded');
	});

	it('uses response pagination.hasNext to request the next page only when needed', async () => {
		ajaxStub = sinon.stub(ajax, 'runAction');
		ajaxStub.onFirstCall().resolves({
			data: {
				items: [{ id: 1 }, { id: 2 }],
				pagination: { offset: 0, limit: 2, hasNext: true },
			},
		});
		ajaxStub.onSecondCall().resolves({
			data: {
				items: [{ id: 3 }],
				pagination: { offset: 2, limit: 2, hasNext: false },
			},
		});

		const controller = new TabController(TAB_CONFIG_PAGINATED, 2);

		await controller.loadNext();
		await controller.loadNext();
		await controller.loadNext();

		assert.strictEqual(ajaxStub.callCount, 2);
		assert.deepEqual(ajaxStub.firstCall.args[1].navigation, { page: 1, size: 2 });
		assert.deepEqual(ajaxStub.secondCall.args[1].navigation, { page: 2, size: 2 });
		assert.deepEqual(controller.getItems().map((item) => item.id), [1, 2, 3]);
	});
});

describe('TabController — #mapItem does not break other fields', () => {
	/** @type {sinon.SinonStub} */
	let ajaxStub;

	/** @type {TabController} */
	let controller;

	beforeEach(() => {
		ajaxStub = sinon.stub(ajax, 'runAction');
		controller = new TabController(TAB_CONFIG_SIMPLE, 20);
	});

	afterEach(() => {
		ajaxStub.restore();
	});

	it('maps id, title, isMine, isPinned, isPublished correctly alongside ownerName', async () => {
		ajaxStub.resolves({
			data: {
				items: [
					{
						id: 7,
						title: 'My Vibeapp',
						ownerName: 'Bob',
						isMine: true,
						isPinned: false,
						isPublished: true,
						kind: 'application',
					},
				],
			},
		});
		await controller.loadNext();
		const item = controller.getItems()[0];

		assert.strictEqual(item.id, 7, 'id');
		assert.strictEqual(item.title, 'My Vibeapp', 'title');
		assert.strictEqual(item.ownerName, 'Bob', 'ownerName');
		assert.isTrue(item.isMine, 'isMine');
		assert.isFalse(item.isPinned, 'isPinned');
		assert.isTrue(item.isPublished, 'isPublished');
		assert.strictEqual(item.kind, 'application', 'kind');
	});

	it('maps multiple items preserving ownerName per row', async () => {
		ajaxStub.resolves({
			data: {
				items: [
					{ id: 1, ownerName: 'Alice' },
					{ id: 2, ownerName: '' },
					{ id: 3, ownerName: null },
					{ id: 4, ownerName: 'Charlie' },
				],
			},
		});
		await controller.loadNext();
		const items = controller.getItems();

		assert.strictEqual(items.length, 4);
		assert.strictEqual(items[0].ownerName, 'Alice');
		assert.isNull(items[1].ownerName, 'empty string → null');
		assert.isNull(items[2].ownerName, 'null → null');
		assert.strictEqual(items[3].ownerName, 'Charlie');
	});
});

describe('TabController — #mapItem isHidden normalization', () => {
	/** @type {sinon.SinonStub} */
	let ajaxStub;

	/** @type {TabController} */
	let controller;

	beforeEach(() => {
		ajaxStub = sinon.stub(ajax, 'runAction');
		controller = new TabController(TAB_CONFIG_SIMPLE, 20);
	});

	afterEach(() => {
		ajaxStub.restore();
	});

	async function loadWith(raw) {
		ajaxStub.resolves({ data: { items: [raw] } });
		await controller.loadNext();
		// Read in the "all" slice so a hidden item is not filtered out.
		controller.setState(CatalogState.All);

		return controller.getItems()[0];
	}

	it('maps truthy isHidden to true', async () => {
		const item = await loadWith({ id: 1, isHidden: true });

		assert.isTrue(item.isHidden);
	});

	it('defaults isHidden to false when absent', async () => {
		const item = await loadWith({ id: 1 /* isHidden absent */ });

		assert.isFalse(item.isHidden);
	});

	it('coerces falsy isHidden to false', async () => {
		const item = await loadWith({ id: 1, isHidden: 0 });

		assert.isFalse(item.isHidden);
	});
});

describe('TabController — getItems() state slicing', () => {
	/** @type {sinon.SinonStub} */
	let ajaxStub;

	/** @type {TabController} */
	let controller;

	beforeEach(async () => {
		ajaxStub = sinon.stub(ajax, 'runAction');
		controller = new TabController(TAB_CONFIG_SIMPLE, 20);
		ajaxStub.resolves({
			data: {
				items: [
					{ id: 1, isHidden: false },
					{ id: 2, isHidden: true },
					{ id: 3, isHidden: false },
					{ id: 4, isHidden: true },
				],
			},
		});
		await controller.loadNext();
	});

	afterEach(() => {
		ajaxStub.restore();
	});

	it('defaults to active state', () => {
		assert.strictEqual(controller.getState(), CatalogState.Active);
	});

	it('active state returns only non-hidden items', () => {
		controller.setState(CatalogState.Active);
		const ids = controller.getItems().map((row) => row.id);

		assert.deepStrictEqual(ids, [1, 3]);
	});

	it('hidden state returns only hidden items', () => {
		controller.setState(CatalogState.Hidden);
		const ids = controller.getItems().map((row) => row.id);

		assert.deepStrictEqual(ids, [2, 4]);
	});

	it('all state returns every item', () => {
		controller.setState(CatalogState.All);
		const ids = controller.getItems().map((row) => row.id);

		assert.deepStrictEqual(ids, [1, 2, 3, 4]);
	});

	it('state slicing does not mutate the underlying set', () => {
		controller.setState(CatalogState.Hidden);
		controller.getItems();
		controller.setState(CatalogState.All);

		assert.strictEqual(controller.getItems().length, 4);
	});
});
