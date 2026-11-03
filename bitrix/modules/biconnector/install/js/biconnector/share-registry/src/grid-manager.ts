import { ajax, Event, Loc, Reflection, Tag, Text, Type } from 'main.core';
import { EventEmitter, type BaseEvent } from 'main.core.events';
import { SidePanel } from 'main.sidepanel';
import { AirButtonStyle, Button, ButtonSize, type ButtonOptions } from 'ui.buttons';
import { Hint } from 'ui.hint';
import { Dialog, type DialogOptions } from 'ui.system.dialog';
import { Center as NotificationCenter } from 'ui.notification';

import { resolveErrorHtml } from 'biconnector.error-message';
import { DashboardManager } from 'biconnector.apache-superset-dashboard-manager';

import { phrase, showDisableSummary, type DisableSharesResponse } from './result-summary';

import './style.css';

const ACCESS_DENIED_ERROR = 'access_denied';
const AUTHOR_FILTER_FIELD = 'AUTHOR_ID';
const SHARE_SETTING_CHANGE_EVENT = 'BIConnector.ShareSetting:onChange';

type GridManagerOptions = {
	gridId: string,
};

type GridRow = {
	getCellById: (columnId: string) => HTMLElement | undefined,
};

type Grid = {
	getId: () => string,
	reload: () => void,
	getContainer: () => HTMLElement,
	getRows: () => {
		getSelectedIds: () => Array<string | number>,
		getById: (id: number) => GridRow | null,
	},
};

type Filter = {
	getApi: () => { extendFilter: (fields: Record<string, unknown>) => void },
	getFilterFields: () => HTMLElement[],
	getFields: () => { deleteField: (field: HTMLElement) => void },
	getSearch: () => { apply: () => void },
};

type ConfirmContent = {
	title: string,
	html: string,
};

type ServerErrorResponse = {
	errors?: Array<{ code?: string | number | null }>,
};

export class GridManager
{
	static Instance: GridManager | null = null;

	#gridId: string;
	#hint: ReturnType<typeof Hint.createInstance>;

	constructor(options: GridManagerOptions)
	{
		this.#gridId = options.gridId;
		this.#hint = Hint.createInstance({
			popupParameters: {
				autoHide: true,
				maxWidth: 320,
			},
		});
		this.#initHints();
		EventEmitter.subscribe('Grid::updated', this.#onGridUpdated);
		getTopEventBus().subscribe(SHARE_SETTING_CHANGE_EVENT, this.#onShareSettingChange);
		Event.bind(window, 'unload', () => this.destroy());
	}

	destroy(): void
	{
		EventEmitter.unsubscribe('Grid::updated', this.#onGridUpdated);
		getTopEventBus().unsubscribe(SHARE_SETTING_CHANGE_EVENT, this.#onShareSettingChange);
	}

	#onGridUpdated = (event: BaseEvent): void => {
		const [grid] = event.getCompatData() as [Grid | undefined];
		if (grid?.getId() === this.#gridId)
		{
			this.#initHints();
		}
	};

	#onShareSettingChange = (): void => {
		this.#getGrid()?.reload();
	};

	openDashboard(url: string): void
	{
		window.open(url, '_blank')?.focus();
	}

	async disableShares(ids: number[]): Promise<void>
	{
		const shareIds = ids.map((id) => Text.toInteger(id)).filter((id) => id > 0);
		if (shareIds.length === 0)
		{
			return;
		}

		if (await this.#confirmDisable(shareIds))
		{
			await this.#disable(shareIds);
		}
	}

	disableSelected(): Promise<void>
	{
		const selectedIds = this.#getGrid()?.getRows().getSelectedIds() ?? [];

		return this.disableShares(selectedIds.map((id) => Text.toInteger(id)));
	}

	openSettings(dashboardId: number, dashboardType: string): void
	{
		DashboardManager.openSettingsSlider(Text.toInteger(dashboardId), dashboardType);
	}

	toggleAuthorFilter(authorId: number, authorName: string, isActive: boolean): void
	{
		const id = Text.toInteger(authorId);
		const filter = this.#getFilter();
		if (id <= 0 || !filter)
		{
			return;
		}

		if (isActive)
		{
			removeFilterField(filter, AUTHOR_FILTER_FIELD);

			return;
		}

		// extendFilter applies the filter, and the filter reloads the grid
		filter.getApi().extendFilter({
			[AUTHOR_FILTER_FIELD]: [String(id)],
			[`${AUTHOR_FILTER_FIELD}_label`]: [authorName],
		});
	}

	#getFilter(): Filter | null
	{
		const filterManager = Reflection.getClass('BX.Main.filterManager') as { getById: (id: string) => Filter | null } | null;

		return filterManager?.getById(this.#gridId) ?? null;
	}

	#getGrid(): Grid | null
	{
		const gridManager = Reflection.getClass('BX.Main.gridManager') as { getInstanceById: (id: string) => Grid | null } | null;

		return gridManager?.getInstanceById(this.#gridId) ?? null;
	}

	#initHints(): void
	{
		const container = this.#getGrid()?.getContainer();
		if (!container)
		{
			return;
		}

		this.#hint.init(container);
	}

	#confirmDisable(shareIds: number[]): Promise<boolean>
	{
		const content = buildConfirmContent(shareIds.length);

		return new Promise((resolve) => {
			let isConfirmed = false;

			const dialog = new Dialog({
				title: content.title,
				content: Tag.render`<div class="biconnector-share-registry-disable-popup-content">${content.html}</div>`,
				centerButtons: [
					createButton(phrase('BICONNECTOR_SHARE_REGISTRY_DISABLE_BUTTON'), AirButtonStyle.FILLED, () => {
						isConfirmed = true;
						dialog.hide();
					}),
					createButton(phrase('BICONNECTOR_SHARE_REGISTRY_CANCEL'), AirButtonStyle.PLAIN, () => dialog.hide()),
				],
				hasOverlay: true,
				width: 400,
			} as DialogOptions);

			dialog.subscribe('onHide', () => resolve(isConfirmed));
			dialog.show();
		});
	}

	// Cells are read from the page because the grid keeps no raw row data on the client.
	#getCellText(shareId: number, columnId: string): string | null
	{
		const cell = this.#getGrid()?.getRows().getById(shareId)?.getCellById(columnId);
		const text = cell?.textContent?.trim() ?? '';

		return Type.isStringFilled(text) ? text : null;
	}

	async #disable(shareIds: number[]): Promise<void>
	{
		const dashboardTitles = new Map(shareIds.map((id) => [id, this.#getCellText(id, 'DASHBOARD')]));

		try
		{
			const response: { data: DisableSharesResponse } = await ajax.runAction(
				'biconnector.sharecontrol.disableShares',
				{ data: { ids: shareIds } },
			);

			this.#getGrid()?.reload();
			showDisableSummary(response.data, shareIds.length, {
				getDashboardTitle: (id: number) => dashboardTitles.get(id) ?? null,
				onRetry: (failedIds: number[]) => this.#disable(failedIds),
			});
		}
		catch (response)
		{
			if (isAccessDenied(response))
			{
				notifyAccessDenied(response);

				return;
			}

			NotificationCenter.notify({
				content: resolveErrorHtml(response, phrase('BICONNECTOR_SHARE_REGISTRY_DISABLE_ERROR')),
				actions: [{
					title: phrase('BICONNECTOR_SHARE_REGISTRY_RETRY'),
					events: {
						click: (event, balloon) => {
							balloon?.close();
							void this.#disable(shareIds);
						},
					},
				}],
			});
		}
	}
}

function removeFilterField(filter: Filter, fieldName: string): void
{
	filter.getFilterFields()
		.filter((field) => field.getAttribute('data-name') === fieldName)
		.forEach((field) => filter.getFields().deleteField(field))
	;
	filter.getSearch().apply();
}

function buildConfirmContent(count: number): ConfirmContent
{
	if (count === 1)
	{
		return {
			title: phrase('BICONNECTOR_SHARE_REGISTRY_DISABLE_CONFIRM_SINGLE'),
			html: phrase('BICONNECTOR_SHARE_REGISTRY_DISABLE_CONFIRM_BAN_HINT'),
		};
	}

	return {
		title: Loc.getMessagePlural('BICONNECTOR_SHARE_REGISTRY_DISABLE_CONFIRM_MANY', count, {
			'#COUNT#': String(count),
		}) ?? '',
		html: phrase('BICONNECTOR_SHARE_REGISTRY_DISABLE_CONFIRM_MANY_TEXT'),
	};
}

function createButton(text: string, style: string, onClick: () => void): Button
{
	const options: Partial<ButtonOptions> = {
		text,
		size: ButtonSize.LARGE,
		style,
		useAirDesign: true,
		onclick: (): {} => {
			onClick();

			return {};
		},
	};

	return new Button(options as ButtonOptions);
}

function isAccessDenied(response: unknown): boolean
{
	const errors = (response as ServerErrorResponse | null)?.errors;

	return Type.isArray(errors) && errors.some((error) => error?.code === ACCESS_DENIED_ERROR);
}

function notifyAccessDenied(response: unknown): void
{
	NotificationCenter.notify({
		content: resolveErrorHtml(response, phrase('BICONNECTOR_SHARE_REGISTRY_DISABLE_ERROR')),
		actions: [{
			title: phrase('BICONNECTOR_SHARE_REGISTRY_RETURN_TO_BI'),
			events: {
				click: (event, balloon) => {
					balloon?.close();
					SidePanel.Instance.getSliderByWindow(window)?.close();
				},
			},
		}],
	});
}

// The dashboard settings slider emits into the top window.
function getTopEventBus(): typeof EventEmitter
{
	return (Reflection.getClass('top.BX.Event.EventEmitter') as typeof EventEmitter | null) ?? EventEmitter;
}
