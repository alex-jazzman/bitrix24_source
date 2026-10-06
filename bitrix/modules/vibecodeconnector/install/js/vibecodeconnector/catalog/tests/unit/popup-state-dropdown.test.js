import { describe, it, beforeEach } from 'mocha';
import { assert } from 'chai';
import { Loc } from 'main.core';

import { CatalogPopupStateDropdown, CatalogState } from '../../src/components/popup-state-dropdown';

const TAB_CONFIG = Object.freeze({
	id: 'my',
	title: 'Вайбкод',
	action: 'vibecodeconnector.Catalog.myList',
	paginated: false,
});

function createDropdown(options = {}) {
	return new CatalogPopupStateDropdown({
		tab: TAB_CONFIG,
		onStateSelect: () => {},
		...options,
	});
}

describe('CatalogPopupStateDropdown — label & state', () => {
	beforeEach(() => {
		Loc.setMessage({
			VIBECODECONNECTOR_CATALOG_TAB_VIBECODE: 'Вайбкод',
			VIBECODECONNECTOR_CATALOG_TAB_VIBECODE_HIDDEN: 'Вайбкод: Скрытые',
			VIBECODECONNECTOR_CATALOG_TAB_VIBECODE_ALL: 'Вайбкод: Все',
			VIBECODECONNECTOR_CATALOG_STATE_ACTIVE: 'Активные',
			VIBECODECONNECTOR_CATALOG_STATE_HIDDEN: 'Скрытые',
			VIBECODECONNECTOR_CATALOG_STATE_ALL: 'Все',
		});
	});

	it('defaults to active state', () => {
		const dropdown = createDropdown();

		assert.strictEqual(dropdown.getState(), CatalogState.Active);
	});

	it('chip label defaults to base «Вайбкод»', () => {
		const dropdown = createDropdown();

		assert.strictEqual(dropdown.getChip().getText(), 'Вайбкод');
	});

	it('setState(hidden) updates state and chip label', () => {
		const dropdown = createDropdown();
		dropdown.setState(CatalogState.Hidden);

		assert.strictEqual(dropdown.getState(), CatalogState.Hidden);
		assert.strictEqual(dropdown.getChip().getText(), 'Вайбкод: Скрытые');
	});

	it('setState(all) updates state and chip label', () => {
		const dropdown = createDropdown();
		dropdown.setState(CatalogState.All);

		assert.strictEqual(dropdown.getState(), CatalogState.All);
		assert.strictEqual(dropdown.getChip().getText(), 'Вайбкод: Все');
	});

	it('honors initialState in state and label', () => {
		const dropdown = createDropdown({ initialState: CatalogState.All });

		assert.strictEqual(dropdown.getState(), CatalogState.All);
		assert.strictEqual(dropdown.getChip().getText(), 'Вайбкод: Все');
	});

	it('switching back to active restores base label', () => {
		const dropdown = createDropdown({ initialState: CatalogState.Hidden });
		dropdown.setState(CatalogState.Active);

		assert.strictEqual(dropdown.getChip().getText(), 'Вайбкод');
	});
});
