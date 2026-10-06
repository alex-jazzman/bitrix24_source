import { describe, it, beforeEach, afterEach } from 'mocha';
import { assert } from 'chai';
import sinon from 'sinon';
import { ajax, Loc } from 'main.core';
import { Center as NotificationCenter } from 'ui.notification';

import { CatalogPopupItemHideAction } from '../../src/components/popup-item-hide-action';

const MY_TAB = Object.freeze({ id: 'my', title: 'Вайбкод', action: 'vibecodeconnector.Catalog.myList', paginated: false });
const MARKET_TAB = Object.freeze({ id: 'market', title: 'Маркетплейс' });

function makeItem(overrides = {}) {
	return {
		id: 10,
		title: 'Shared app',
		isMine: false,
		isPinned: false,
		isHidden: false,
		...overrides,
	};
}

// ---------------------------------------------------------------------------
// getMenuItem — pure visibility & labels (no ajax, runs standalone)
// ---------------------------------------------------------------------------

describe('CatalogPopupItemHideAction — getMenuItem visibility & labels', () => {
	beforeEach(() => {
		Loc.setMessage({
			VIBECODECONNECTOR_CATALOG_MENU_HIDE: 'Скрыть',
			VIBECODECONNECTOR_CATALOG_MENU_UNHIDE: 'Восстановить',
		});
	});

	it('is null on the market tab', () => {
		const action = new CatalogPopupItemHideAction(makeItem(), MARKET_TAB);

		assert.isNull(action.getMenuItem());
	});

	it('is null for own apps (isMine)', () => {
		const action = new CatalogPopupItemHideAction(makeItem({ isMine: true }), MY_TAB);

		assert.isNull(action.getMenuItem());
	});

	it('shows «Скрыть» for a visible shared app', () => {
		const action = new CatalogPopupItemHideAction(makeItem({ isHidden: false }), MY_TAB);

		assert.strictEqual(action.getMenuItem()?.title, 'Скрыть');
	});

	it('shows «Восстановить» for a hidden shared app', () => {
		const action = new CatalogPopupItemHideAction(makeItem({ isHidden: true }), MY_TAB);

		assert.strictEqual(action.getMenuItem()?.title, 'Восстановить');
	});
});

// ---------------------------------------------------------------------------
// Optimistic toggle + rollback (mirror of pin-button behaviour)
// ---------------------------------------------------------------------------

describe('CatalogPopupItemHideAction — optimistic hide/unhide', () => {
	let ajaxStub;
	let notifyStub;

	beforeEach(() => {
		ajaxStub = sinon.stub(ajax, 'runAction');
		notifyStub = sinon.stub(NotificationCenter, 'notify');
		Loc.setMessage({
			VIBECODECONNECTOR_CATALOG_MENU_HIDE: 'Скрыть',
			VIBECODECONNECTOR_CATALOG_MENU_UNHIDE: 'Восстановить',
		});
	});

	afterEach(() => {
		ajaxStub.restore();
		notifyStub.restore();
	});

	it('hide optimistically sets isHidden and clears pin, calls Catalog.hide', async () => {
		ajaxStub.resolves({});
		const item = makeItem({ isPinned: true });
		let notified = 0;
		const action = new CatalogPopupItemHideAction(item, MY_TAB, { onHiddenToggled: () => { notified += 1; } });

		action.getMenuItem().onClick();

		assert.isTrue(item.isHidden, 'isHidden set immediately');
		assert.isFalse(item.isPinned, 'pin cleared immediately');
		assert.isAbove(notified, 0, 'callback fired');
		assert.isTrue(ajaxStub.calledWith('vibecodeconnector.Catalog.hide'));

		await Promise.resolve();
	});

	it('rolls back isHidden/pin when Catalog.hide rejects', async () => {
		ajaxStub.rejects(new Error('network'));
		const item = makeItem({ isPinned: true });
		const action = new CatalogPopupItemHideAction(item, MY_TAB, { onHiddenToggled: () => {} });

		action.getMenuItem().onClick();
		await new Promise((resolve) => setTimeout(resolve, 0));

		assert.isFalse(item.isHidden, 'isHidden rolled back');
		assert.isTrue(item.isPinned, 'pin restored');
	});

	it('unhide optimistically clears isHidden and calls Catalog.unhide', async () => {
		ajaxStub.resolves({});
		const item = makeItem({ isHidden: true });
		const action = new CatalogPopupItemHideAction(item, MY_TAB, { onHiddenToggled: () => {} });

		action.getMenuItem().onClick();

		assert.isFalse(item.isHidden, 'isHidden cleared immediately');
		assert.isTrue(ajaxStub.calledWith('vibecodeconnector.Catalog.unhide'));

		await Promise.resolve();
	});

	it('manual unhide does not re-pin', async () => {
		ajaxStub.resolves({});
		const item = makeItem({ isHidden: true, isPinned: false });
		const action = new CatalogPopupItemHideAction(item, MY_TAB, { onHiddenToggled: () => {} });

		action.getMenuItem().onClick();
		await Promise.resolve();

		assert.isFalse(item.isPinned, 'pin stays off on manual restore');
	});

	it('onHiddenCommitted fires after Catalog.hide resolves, not on the optimistic step', async () => {
		ajaxStub.resolves({});
		const item = makeItem();
		let committed = 0;
		const action = new CatalogPopupItemHideAction(item, MY_TAB, { onHiddenCommitted: () => { committed += 1; } });

		action.getMenuItem().onClick();
		assert.strictEqual(committed, 0, 'not committed before server responds');

		await new Promise((resolve) => setTimeout(resolve, 0));
		assert.strictEqual(committed, 1, 'committed once after hide resolves');
	});

	it('onHiddenCommitted does not fire when Catalog.hide rejects', async () => {
		ajaxStub.rejects(new Error('network'));
		const item = makeItem();
		let committed = 0;
		const action = new CatalogPopupItemHideAction(item, MY_TAB, { onHiddenCommitted: () => { committed += 1; } });

		action.getMenuItem().onClick();
		await new Promise((resolve) => setTimeout(resolve, 0));

		assert.strictEqual(committed, 0, 'no commit on failure');
	});

	it('onHiddenCommitted fires after Catalog.unhide resolves', async () => {
		ajaxStub.resolves({});
		const item = makeItem({ isHidden: true });
		let committed = 0;
		const action = new CatalogPopupItemHideAction(item, MY_TAB, { onHiddenCommitted: () => { committed += 1; } });

		action.getMenuItem().onClick();
		await new Promise((resolve) => setTimeout(resolve, 0));

		assert.strictEqual(committed, 1, 'committed once after unhide resolves');
	});

	// тост «Отменить» полностью возвращает состояние, включая закрепление.
	it('undo from toast unhides and restores the previous pin', async () => {
		ajaxStub.resolves({});
		const item = makeItem({ isPinned: true });
		const action = new CatalogPopupItemHideAction(item, MY_TAB, { onHiddenToggled: () => {} });

		action.getMenuItem().onClick(); // Скрыть
		await new Promise((resolve) => setTimeout(resolve, 0)); // hide resolves → тост

		assert.isTrue(notifyStub.called, 'undo toast shown');
		const undoClick = notifyStub.getCall(0).args[0].actions[0].events.click;
		assert.isFunction(undoClick, 'toast has an undo action');

		ajaxStub.resetHistory();
		undoClick({}, { close: () => {} }); // нажатие «Отменить»
		await new Promise((resolve) => setTimeout(resolve, 0));

		assert.isFalse(item.isHidden, 'undo unhides');
		assert.isTrue(item.isPinned, 'undo restores the pin that was cleared on hide');
		assert.isTrue(ajaxStub.calledWith('vibecodeconnector.Catalog.unhide'));
		assert.isTrue(ajaxStub.calledWith('vibecodeconnector.Catalog.pin'));
	});
});
