import { Extension, Loc, Type } from 'main.core';

import { CatalogPopup, CatalogStateMode } from './popup';
import { MY_TAB_ID } from './constants';
import './style.css';

export type TabConfig = {
	id: string,
	title: string,
	action: string | null,
	icon?: string,
	counter?: number,
	paginated?: boolean,
	extraData?: { [string]: any },
	navigateUrl?: string | null,
};

const DEFAULT_TABS: Array<TabConfig> = [
	// {
	// 	id: 'vibe24',
	// 	title: Loc.getMessage('VIBECODECONNECTOR_CATALOG_TAB_VIBE24'),
	// 	action: 'vibecodeconnector.Catalog.vibe24List',
	// },
	{
		id: MY_TAB_ID,
		title: Loc.getMessage('VIBECODECONNECTOR_CATALOG_TAB_VIBECODE'),
		action: 'vibecodeconnector.Catalog.myList',
	},
	{
		id: 'market',
		title: Loc.getMessage('VIBECODECONNECTOR_CATALOG_TAB_MARKETPLACE'),
		action: null,
		icon: 'market',
		navigateUrl: Extension.getSettings('vibecodeconnector.catalog').get('marketUrl', null),
	},
];

export class Catalog
{
	#popup: CatalogPopup | null = null;
	#tabs: Array<TabConfig>;
	#pageSize: number;
	#isEmpty: boolean;
	#newAppsCount: number;
	#onClose: (() => void) | null = null;

	constructor(
		options: {
			tabs?: Array<TabConfig>,
			pageSize?: number,
			isEmpty?: boolean,
			newAppsCount?: number,
			previewUserId?: number | null,
			onClose?: () => void,
		} = {},
	)
	{
		const allTabs = Type.isArray(options.tabs) ? options.tabs : DEFAULT_TABS;
		const baseTabs = allTabs.filter((tab) => tab.navigateUrl === undefined || Type.isStringFilled(tab.navigateUrl));
		const previewUserId = Type.isNumber(options.previewUserId) && options.previewUserId > 0
			? options.previewUserId
			: null;
		this.#tabs = previewUserId === null
			? baseTabs
			: baseTabs.map((tab) => ({
				...tab,
				extraData: { ...tab.extraData, previewUserId },
			}));
		this.#pageSize = Type.isNumber(options.pageSize) ? options.pageSize : 20;
		this.#isEmpty = Type.isBoolean(options.isEmpty)
			? options.isEmpty
			: Extension.getSettings('vibecodeconnector.catalog').get('isEmpty', false) === true;
		this.#newAppsCount = this.#normalizeCount(
			Type.isNumber(options.newAppsCount)
				? options.newAppsCount
				: Extension.getSettings('vibecodeconnector.catalog').get('newAppsCount', 0),
		);
		this.#onClose = Type.isFunction(options.onClose) ? options.onClose : null;
	}

	#normalizeCount(value: mixed): number
	{
		return Type.isNumber(value) && value > 0 ? Math.trunc(value) : 0;
	}

	setNewAppsCount(value: number): void
	{
		this.#newAppsCount = this.#normalizeCount(value);
		this.#popup?.setNewAppsCount(this.#newAppsCount);
	}

	showEmpty(bindNode: HTMLElement | null = null): CatalogPopup
	{
		const popup = new CatalogPopup({ tabs: [], pageSize: 0, forceEmpty: true });
		popup.show(bindNode);

		return popup;
	}

	show(bindNode: HTMLElement | null = null, loadingPopup: any = null): void
	{
		this.#openPopup(bindNode, () => new CatalogPopup({
			tabs: this.#tabs,
			pageSize: this.#pageSize,
			forceEmpty: this.#isEmpty,
			newAppsCount: this.#newAppsCount,
			onNewAppsCount: (value: number) => {
				this.#newAppsCount = this.#normalizeCount(value);
			},
		}), loadingPopup);
	}

	showNoAccess(bindNode: HTMLElement | null = null, loadingPopup: any = null): void
	{
		this.#openPopup(bindNode, () => new CatalogPopup({
			tabs: [],
			pageSize: 0,
			stateMode: CatalogStateMode.NoAccess,
		}), loadingPopup);
	}

	#openPopup(bindNode: HTMLElement | null, createPopup: () => CatalogPopup, loadingPopup: any): void
	{
		if (this.#popup === null)
		{
			this.#popup = createPopup();
			this.#popup.subscribeOnClose(() => {
				this.#popup = null;
				this.#onClose?.();
			});
			if (loadingPopup !== null && this.#popup.adoptLoadingPopup(loadingPopup))
			{
				return;
			}
		}
		this.#popup.show(bindNode);
	}

	close(): void
	{
		this.#popup?.close();
	}
}
