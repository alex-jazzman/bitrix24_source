import { Dom, Loc } from 'main.core';
import { Chip, ChipSize, ChipDesign } from 'ui.system.chip';
import { Menu } from 'ui.system.menu';

import { type TabConfig } from '../catalog';

export type CatalogStateValue = 'active' | 'hidden' | 'all' | 'new';

export const CatalogState = Object.freeze({
	Active: 'active',
	Hidden: 'hidden',
	All: 'all',
	New: 'new',
});

const STATE_ORDER: Array<CatalogStateValue> = [
	CatalogState.Active,
	CatalogState.Hidden,
	CatalogState.New,
	CatalogState.All,
];

type CatalogPopupStateDropdownOptions = {
	tab: TabConfig,
	initialState?: CatalogStateValue | null,
	onStateSelect: (CatalogStateValue) => void,
	hasNewApps?: boolean,
};

export class CatalogPopupStateDropdown
{
	#tab: TabConfig;
	#state: CatalogStateValue;
	#onStateSelect: (CatalogStateValue) => void;
	#hasNewApps: boolean;
	#chip: Chip;
	#node: HTMLElement | null = null;
	#menu: Menu | null = null;
	#opened: boolean = false;

	constructor(options: CatalogPopupStateDropdownOptions)
	{
		this.#tab = options.tab;
		this.#state = options.initialState ?? CatalogState.Active;
		this.#onStateSelect = options.onStateSelect;
		this.#hasNewApps = options.hasNewApps === true;
		this.#chip = new Chip({
			size: ChipSize.Md,
			design: ChipDesign.Outline,
			rounded: true,
			compact: true,
			dropdown: true,
			text: this.#getChipLabel(),
			onClick: () => this.#toggleMenu(),
		});
	}

	render(): HTMLElement
	{
		if (this.#node)
		{
			return this.#node;
		}

		this.#node = this.#chip.render();
		Dom.addClass(this.#node, 'vibecode-catalog__tab');
		this.#node.dataset.tabId = this.#tab.id;
		this.#node.setAttribute('role', 'tab');
		this.#node.setAttribute('aria-selected', 'false');
		this.#node.setAttribute('data-testid', `vibecode-catalog-tab-${this.#tab.id}`);

		return this.#node;
	}

	getChip(): Chip
	{
		return this.#chip;
	}

	getState(): CatalogStateValue
	{
		return this.#state;
	}

	getAvailableStates(): Array<CatalogStateValue>
	{
		return STATE_ORDER.filter(
			(state) => state === this.#state || state !== CatalogState.New || this.#hasNewApps,
		);
	}

	setState(state: CatalogStateValue): void
	{
		this.#state = state;
		this.#chip.setText(this.#getChipLabel());
	}

	setHasNewApps(hasNewApps: boolean): void
	{
		this.#hasNewApps = hasNewApps === true;
	}

	isMenuOpen(): boolean
	{
		return this.#opened;
	}

	closeMenu(): void
	{
		if (this.#opened)
		{
			this.#menu?.close();
		}
	}

	focus(): void
	{
		this.#node?.focus();
	}

	destroy(): void
	{
		this.#menu?.destroy();
		this.#menu = null;
		this.#node = null;
	}

	#toggleMenu(): void
	{
		if (!this.#node)
		{
			return;
		}

		if (this.#opened)
		{
			this.#menu?.close();

			return;
		}

		const menuItems = this.getAvailableStates().map((state) => ({
			title: this.#getStateTitle(state),
			isSelected: state === this.#state,
			onClick: () => this.#select(state),
		}));

		if (this.#menu)
		{
			this.#menu.updateItems(menuItems);
		}
		else
		{
			this.#menu = new Menu({
				closeOnItemClick: true,
				items: menuItems,
				events: {
					onShow: () => {
						this.#opened = true;
						this.#chip.setDropdownActive(true);
					},
					onClose: () => {
						this.#opened = false;
						this.#chip.setDropdownActive(false);
					},
				},
			});
		}

		this.#menu.show(this.#node);
	}

	#select(state: CatalogStateValue): void
	{
		this.setState(state);
		this.#onStateSelect(state);
	}

	#getStateTitle(state: CatalogStateValue): string
	{
		if (state === CatalogState.Hidden)
		{
			return Loc.getMessage('VIBECODECONNECTOR_CATALOG_STATE_HIDDEN');
		}

		if (state === CatalogState.All)
		{
			return Loc.getMessage('VIBECODECONNECTOR_CATALOG_STATE_ALL');
		}

		if (state === CatalogState.New)
		{
			return Loc.getMessage('VIBECODECONNECTOR_CATALOG_STATE_NEW');
		}

		return Loc.getMessage('VIBECODECONNECTOR_CATALOG_STATE_ACTIVE');
	}

	#getChipLabel(): string
	{
		if (this.#state === CatalogState.Hidden)
		{
			return Loc.getMessage('VIBECODECONNECTOR_CATALOG_TAB_VIBECODE_HIDDEN');
		}

		if (this.#state === CatalogState.All)
		{
			return Loc.getMessage('VIBECODECONNECTOR_CATALOG_TAB_VIBECODE_ALL');
		}

		if (this.#state === CatalogState.New)
		{
			return Loc.getMessage('VIBECODECONNECTOR_CATALOG_TAB_VIBECODE_NEW');
		}

		return Loc.getMessage('VIBECODECONNECTOR_CATALOG_TAB_VIBECODE');
	}
}
