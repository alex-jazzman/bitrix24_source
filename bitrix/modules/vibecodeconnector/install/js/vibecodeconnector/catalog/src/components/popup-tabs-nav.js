import { Dom, Loc, Tag, Type } from 'main.core';
import { Chip, ChipDesign } from 'ui.system.chip';

import { type TabConfig } from '../catalog';
import { createPopupTabChip } from './popup-tab-chip';
import { CatalogPopupStateDropdown, type CatalogStateValue } from './popup-state-dropdown';
import { MY_TAB_ID } from '../constants';

type CatalogPopupTabsNavOptions = {
	tabs: Array<TabConfig>,
	newAppsCount?: number,
	initialState?: CatalogStateValue,
	onTabSelect: (string) => void,
	onStateSelect?: (CatalogStateValue) => void,
};

export class CatalogPopupTabsNav
{
	#tabs: Array<TabConfig>;
	#hasNewApps: boolean;
	#initialState: CatalogStateValue | null;
	#onTabSelect: (string) => void;
	#onStateSelect: ((CatalogStateValue) => void) | null;
	#tabChips: Map<string, Chip> = new Map();
	#stateDropdown: CatalogPopupStateDropdown | null = null;
	#navNode: HTMLElement | null = null;

	constructor(options: CatalogPopupTabsNavOptions)
	{
		this.#tabs = options.tabs;
		this.#hasNewApps = Type.isNumber(options.newAppsCount) && options.newAppsCount > 0;
		this.#initialState = options.initialState ?? null;
		this.#onTabSelect = options.onTabSelect;
		this.#onStateSelect = options.onStateSelect ?? null;
	}

	render(): HTMLElement
	{
		if (this.#navNode)
		{
			return this.#navNode;
		}

		this.#tabChips.clear();
		this.#navNode = Tag.render`
			<nav
				class="vibecode-catalog__tabs"
				role="tablist"
				aria-label="${Loc.getMessage('VIBECODECONNECTOR_CATALOG_TABS_LABEL')}"
			></nav>
		`;

		for (const tab of this.#tabs)
		{
			Dom.append(this.#renderChip(tab), this.#navNode);
		}

		return this.#navNode;
	}

	setActiveTab(tabId: string | null): void
	{
		for (const [candidateTabId, chip] of this.#tabChips)
		{
			const node = chip.getWrapper();

			if (!node)
			{
				continue;
			}

			if (node.getAttribute('role') !== 'tab')
			{
				continue;
			}

			const isActive = candidateTabId === tabId;
			chip.setDesign(isActive ? ChipDesign.OutlineAccent2 : ChipDesign.Outline);
			node.setAttribute('aria-selected', isActive ? 'true' : 'false');
		}
	}

	setNewAppsCount(value: number): void
	{
		this.#hasNewApps = Type.isNumber(value) && value > 0;
		this.#stateDropdown?.setHasNewApps(this.#hasNewApps);
	}

	setState(state: CatalogStateValue): void
	{
		this.#stateDropdown?.setState(state);
	}

	isStateMenuOpen(): boolean
	{
		return this.#stateDropdown?.isMenuOpen() === true;
	}

	closeStateMenu(): void
	{
		this.#stateDropdown?.closeMenu();
	}

	focusStateChip(): void
	{
		this.#stateDropdown?.focus();
	}

	destroy(): void
	{
		this.#stateDropdown?.destroy();
		this.#stateDropdown = null;
		this.#tabChips.clear();
		this.#navNode = null;
	}

	#renderChip(tab: TabConfig): HTMLElement
	{
		if (tab.id === MY_TAB_ID && this.#onStateSelect !== null)
		{
			return this.#renderStateChip(tab);
		}

		const { chip, node } = createPopupTabChip(tab, () => this.#onTabSelect(tab.id));

		this.#tabChips.set(tab.id, chip);

		return node;
	}

	#renderStateChip(tab: TabConfig): HTMLElement
	{
		const dropdown = new CatalogPopupStateDropdown({
			tab,
			initialState: this.#initialState,
			hasNewApps: this.#hasNewApps,
			onStateSelect: (state: CatalogStateValue) => this.#onStateSelect?.(state),
		});

		this.#stateDropdown = dropdown;
		this.#tabChips.set(tab.id, dropdown.getChip());

		return dropdown.render();
	}
}
