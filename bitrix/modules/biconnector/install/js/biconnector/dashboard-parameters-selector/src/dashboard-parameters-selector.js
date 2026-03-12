/* eslint-disable operator-linebreak */
import { Dom, Event, Loc, Tag, Uri } from 'main.core';
import { BaseEvent, EventEmitter } from 'main.core.events';
import { Item, TagSelector } from 'ui.entity-selector';
import type { Parameter, ParameterSelectorParams } from './types';
import './css/main.css';

export class DashboardParametersSelector
{
	#isAllowedClearGroups: boolean;
	#groups: Set<number>;
	#initialGroups: Set<number>;
	#scopes: Set<string>;
	#initialScopes: Set<string>;
	#params: Set<string>;
	#initialParams: Set<string>;
	#paramList: { [paramCode: string]: Parameter };
	#groupSelector: TagSelector;
	#paramsSelector: TagSelector;

	#scopeOwners: Map<string, Set<string>> = new Map();

	constructor(params: ParameterSelectorParams)
	{
		this.#groups = params.groups;
		this.#initialGroups = new Set(params.groups);

		this.#scopes = params.scopes;
		this.#initialScopes = new Set(params.scopes);

		this.#params = params.params;
		this.#initialParams = new Set(params.params);

		this.#paramList = params.paramList;

		this.activeUrlParamsSelector = params.activeUrlParamsSelector ?? true;
		this.isNewDashboard = params.isNewDashboard ?? false;
		this.#isAllowedClearGroups = params.isAllowedClearGroups ?? false;
	}

	getValues(): { groups: Set<number>, scopes: Set<string>, params: Set<string> }
	{
		return {
			groups: this.#groups,
			scopes: this.#scopes,
			params: this.#params,
		};
	}

	getLayout(): HTMLElement
	{
		const container = Tag.render`
			<div class="dashboard-params-container">
				<div class="dashboard-params-title-container">
					<div class="dashboard-params-title">
						${Loc.getMessage('DASHBOARD_PARAMS_SELECTOR_GROUPS')}
						${this.#isAllowedClearGroups ? '' : `<span class="ui-require-sign">*</span>`}
						<span data-hint="${Loc.getMessage('DASHBOARD_PARAMS_SELECTOR_GROUPS_HINT_MSGVER_1')}"></span>
					</div>
				</div>
				<div class="dashboard-params-groups-selector"></div>

				<div class="dashboard-params-title-container">
					<div>
						<div class="dashboard-params-title">
							${Loc.getMessage('DASHBOARD_PARAMS_SELECTOR_PARAMS')}
							${this.isNewDashboard && this.activeUrlParamsSelector ? `
								<span data-hint='${Loc.getMessage('DASHBOARD_PARAMS_SELECTOR_PARAMS_HINT')}'></span>
							` : ''}
						</div>
					</div>
					<div class="dashboard-params-list-link">
						${Loc.getMessage('DASHBOARD_PARAMS_SELECTOR_PARAMS_LIST')}
					</div>
				</div>
				<div class="dashboard-params-params-selector"></div>
			</div>
		`;
		BX.UI.Hint.init(container);

		this.#initGroupSelector();
		this.#groupSelector.renderTo(container.querySelector('.dashboard-params-groups-selector'));

		// Param selector will be loaded on GroupSelector's onLoadScope event handler.
		const stubParamsSelector: TagSelector = new TagSelector({ locked: true });
		stubParamsSelector.renderTo(container.querySelector('.dashboard-params-params-selector'));

		Event.bind(
			container.querySelector('.dashboard-params-list-link'),
			'click',
			this.#openParamListSlider.bind(this),
		);

		return container;
	}

	selectGroups(groupIds: number[]): void
	{
		for (const groupId: number of groupIds)
		{
			const groupItem: ?Item = this.#groupSelector.getDialog().getItem({
				id: groupId,
				entityId: 'biconnector-superset-group',
			});
			if (groupItem)
			{
				groupItem.select();
			}
		}
	}

	#initGroupSelector(): void
	{
		const preselectedItems = [];
		this.#groups.forEach((groupId: number) => {
			preselectedItems.push(['biconnector-superset-group', groupId]);
		});

		const groupSelector: TagSelector = new TagSelector({
			multiple: true,
			dialogOptions: {
				id: 'biconnector-superset-group',
				context: 'biconnector-superset-group',
				enableSearch: false,
				dropdownMode: true,
				showAvatars: true,
				compactView: false,
				dynamicLoad: true,
				preload: true,
				width: 383,
				height: 419,
				entities: [
					{
						id: 'biconnector-superset-group',
						dynamicLoad: true,
						options: {
							checkAccessEditRights: true,
						},
					},
				],
				preselectedItems,
				events: {
					onLoad: () => {
						this.#initParamsSelector();
					},
					'Item:onSelect': (event: BaseEvent) => {
						const item: Item = event.getData().item;
						this.#groups.add(item.getId());
						const groupScopes: string[] = item.getCustomData().get('groupScopes') ?? [];
						for (const groupScopeCode: string of groupScopes)
						{
							this.#acquireScope(groupScopeCode, this.#getOwnerCode('group', item.getId()));
						}
						this.#onChange();
					},
					'Item:onDeselect': (event: BaseEvent) => {
						const item: Item = event.getData().item;
						this.#groups.delete(item.getId());
						const groupScopes: string[] = item.getCustomData().get('groupScopes') ?? [];
						for (const groupScopeCode: string of groupScopes)
						{
							this.#releaseScope(groupScopeCode, this.#getOwnerCode('group', item.getId()));
						}
						this.#onChange();
					},
				},
			},
		});
		Dom.addClass(groupSelector.getDialog().getContainer(), 'biconnector-settings-entity-selector');

		this.#groupSelector = groupSelector;
	}

	#initParamsSelector(): void
	{
		const items = [];

		Object.values(this.#paramList).forEach((param: Parameter) => {
			const itemTitle = this.#getParamTitle(param.code);
			items.push({
				id: param.code,
				entityId: 'biconnector-superset-params',
				title: itemTitle.title,
				supertitle: itemTitle.supertitle,
				tabs: 'params',
			});
		});

		const preselectedItems = [];
		const tagItems = [];
		this.#params.forEach((paramCode: string) => {
			preselectedItems.push(['biconnector-superset-params', paramCode]);
			const itemTitle = this.#getParamTitle(paramCode);
			tagItems.push({
				id: paramCode,
				entityId: 'biconnector-superset-params',
				title: itemTitle.title,
				supertitle: itemTitle.supertitle,
			});
		});

		const paramSelector: TagSelector = new TagSelector({
			id: 'biconnector-superset-params',
			multiple: true,
			locked: !this.activeUrlParamsSelector,
			items: tagItems,
			dialogOptions: {
				id: 'biconnector-superset-params',
				context: 'biconnector-superset-params',
				enableSearch: false,
				dropdownMode: true,
				showAvatars: false,
				compactView: false,
				dynamicLoad: true,
				items,
				preselectedItems,
				width: 383,
				height: 419,
				entities: [
					{
						id: 'biconnector-superset-params',
					},
				],
				tabs: [
					{
						id: 'params',
						title: 'params',
					},
				],
			},
			events: {
				onBeforeTagAdd: (event: BaseEvent) => {
					const { tag } = event.getData();
					this.#params.add(tag.getId());
					this.#onChange();
				},
				onBeforeTagRemove: (event: BaseEvent) => {
					const { tag } = event.getData();
					this.#params.delete(tag.getId());
					this.#onChange();
				},
			},
		});

		Dom.addClass(paramSelector.getDialog().getContainer(), 'biconnector-settings-entity-selector');
		Dom.clean(document.querySelector('.dashboard-params-params-selector'));
		paramSelector.renderTo(document.querySelector('.dashboard-params-params-selector'));

		this.#paramsSelector = paramSelector;

		if (!this.activeUrlParamsSelector)
		{
			const listLink = document.querySelector('.dashboard-params-list-link');
			if (listLink)
			{
				Dom.style(listLink, 'display', 'none');
			}
		}

		this.#buildInitialScopeOwners();

		EventEmitter.emit('BIConnector.DashboardParamsSelector:initCompleted');
	}

	#getParamTitle(paramCode: string): { title: string, supertitle: string }
	{
		const param: Parameter = this.#paramList[paramCode];

		if (!param)
		{
			return { title: paramCode, supertitle: '' };
		}

		const title = param.title ?? paramCode;
		const supertitle = param.superTitle ?? '';

		return {
			title,
			supertitle,
		};
	}

	#onChange(): void
	{
		const isGroupsChanged: boolean =
			this.#groups.size !== this.#initialGroups.size
			|| [...this.#groups].some((groupId: number) => !this.#initialGroups.has(groupId))
		;

		const isScopeChanged: boolean =
			this.#scopes.size !== this.#initialScopes.size
			|| [...this.#scopes].some((scopeCode: string) => !this.#initialScopes.has(scopeCode))
		;

		const isParamsChanged: boolean =
			this.#params.size !== this.#initialParams.size
			|| [...this.#params].some((paramCode: string) => !this.#initialParams.has(paramCode))
		;

		const isChanged: boolean = isScopeChanged || isParamsChanged || isGroupsChanged;

		const isLocked: boolean = !this.#isAllowedClearGroups && this.#groups.size === 0;

		EventEmitter.emit('BIConnector.DashboardParamsSelector:onChange', { isChanged, isLocked });
	}

	#openParamListSlider(): void
	{
		const componentLink = '/bitrix/components/bitrix/biconnector.apachesuperset.dashboard.url.parameter.list/slider.php';
		const sliderLink = new Uri(componentLink);

		BX.SidePanel.Instance.open(
			sliderLink.toString(),
			{
				width: 600,
				allowChangeHistory: false,
			},
		);
	}

	#buildInitialScopeOwners(): void
	{
		for (const paramCode of this.#initialParams)
		{
			const parameter: Parameter | undefined = this.#paramList[paramCode];
			if (!parameter)
			{
				continue;
			}

			if (!this.#initialScopes.has(parameter.scope))
			{
				continue;
			}

			this.#acquireScope(
				parameter.scope,
				this.#getOwnerCode('param', paramCode),
			);
		}

		for (const groupId of this.#initialGroups)
		{
			const groupItem: ?Item =
				this.#groupSelector
					?.getDialog()
					?.getItem({ id: groupId, entityId: 'biconnector-superset-group' })
			;

			if (!groupItem)
			{
				continue;
			}

			const groupScopes: string[] = groupItem.getCustomData().get('groupScopes') ?? [];

			for (const scopeCode of groupScopes)
			{
				this.#acquireScope(
					scopeCode,
					this.#getOwnerCode('group', groupId),
				);
			}
		}
	}

	#acquireScope(scopeCode: string, ownerCode: string): void
	{
		let owners = this.#scopeOwners.get(scopeCode);

		if (!owners)
		{
			owners = new Set();
			this.#scopeOwners.set(scopeCode, owners);
			this.#scopes.add(scopeCode);
		}

		owners.add(ownerCode);
	}

	#releaseScope(scopeCode: string, ownerCode: string): void
	{
		const owners = this.#scopeOwners.get(scopeCode);

		if (!owners?.delete(ownerCode))
		{
			return;
		}

		if (owners.size === 0)
		{
			this.#scopeOwners.delete(scopeCode);
			this.#scopes.delete(scopeCode);
		}
	}

	#getOwnerCode(type: 'group' | 'param', code: string | number): string
	{
		return `${type}_${code}`;
	}
}
