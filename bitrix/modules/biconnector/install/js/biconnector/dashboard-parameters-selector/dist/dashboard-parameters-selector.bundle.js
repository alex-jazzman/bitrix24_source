/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, main_core_events, ui_entitySelector) {
	'use strict';

	/* eslint-disable operator-linebreak */
	class DashboardParametersSelector {
		#isAllowedClearGroups;
		#groups;
		#initialGroups;
		#scopes;
		#initialScopes;
		#params;
		#initialParams;
		#paramList;
		#requiredParamList;
		#groupSelector;
		#paramsSelector;
		#isNew;
		#scopeOwners = new Map();
		constructor(params) {
			this.#groups = params.groups;
			this.#initialGroups = new Set(params.groups);
			this.#scopes = params.scopes;
			this.#initialScopes = new Set(params.scopes);
			this.#params = params.params;
			this.#initialParams = new Set(params.params);
			this.#isNew = params.isNew ?? false;
			this.#paramList = params.paramList;
			this.#requiredParamList = new Map(Object.entries(params.requiredParamList ?? {}));
			this.activeUrlParamsSelector = params.activeUrlParamsSelector ?? true;
			this.isNewDashboard = params.isNewDashboard ?? false;
			this.#isAllowedClearGroups = params.isAllowedClearGroups ?? false;
		}
		getValues() {
			return {
				groups: this.#groups,
				scopes: this.#scopes,
				params: this.#params
			};
		}
		getLayout() {
			const container = main_core.Tag.render`
			<div class="dashboard-params-container">
				<div class="dashboard-params-title-container">
					<div class="dashboard-params-title">
						${main_core.Loc.getMessage('DASHBOARD_PARAMS_SELECTOR_GROUPS')}
						${this.#isAllowedClearGroups ? '' : `<span class="ui-require-sign">*</span>`}
						<span data-hint="${main_core.Loc.getMessage('DASHBOARD_PARAMS_SELECTOR_GROUPS_HINT_MSGVER_1')}"></span>
					</div>
				</div>
				<div class="dashboard-params-groups-selector"></div>

				<div class="dashboard-params-title-container">
					<div>
						<div class="dashboard-params-title">
							${main_core.Loc.getMessage('DASHBOARD_PARAMS_SELECTOR_PARAMS')}
							${this.isNewDashboard && this.activeUrlParamsSelector ? `
								<span data-hint='${main_core.Loc.getMessage('DASHBOARD_PARAMS_SELECTOR_PARAMS_HINT')}'></span>
							` : ''}
						</div>
					</div>
					<div class="dashboard-params-list-link">
						${main_core.Loc.getMessage('DASHBOARD_PARAMS_SELECTOR_PARAMS_LIST')}
					</div>
				</div>
				<div class="dashboard-params-params-selector"></div>
			</div>
		`;
			BX.UI.Hint.init(container);
			this.#initGroupSelector();
			this.#groupSelector.renderTo(container.querySelector('.dashboard-params-groups-selector'));

			// Param selector will be loaded on GroupSelector's onLoadScope event handler.
			const stubParamsSelector = new ui_entitySelector.TagSelector({
				locked: true
			});
			stubParamsSelector.renderTo(container.querySelector('.dashboard-params-params-selector'));
			main_core.Event.bind(container.querySelector('.dashboard-params-list-link'), 'click', this.#openParamListSlider.bind(this));
			return container;
		}
		selectGroups(groupIds) {
			for (const groupId of groupIds) {
				const groupItem = this.#groupSelector.getDialog().getItem({
					id: groupId,
					entityId: 'biconnector-superset-group'
				});
				if (groupItem) {
					groupItem.select();
				}
			}
		}
		#initGroupSelector() {
			const preselectedItems = [];
			this.#groups.forEach(groupId => {
				preselectedItems.push(['biconnector-superset-group', groupId]);
			});
			const groupSelector = new ui_entitySelector.TagSelector({
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
					entities: [{
						id: 'biconnector-superset-group',
						dynamicLoad: true,
						options: {
							checkAccessRights: true,
							onlyEditGroupsSelectable: !this.#isAllowedClearGroups
						}
					}],
					preselectedItems,
					events: {
						onLoad: () => {
							this.#initParamsSelector();
							if (!this.#isAllowedClearGroups) {
								this.#bindLockedGroupHints();
							}
						},
						'Item:onSelect': event => {
							const item = event.getData().item;
							this.#groups.add(item.getId());
							const groupScopes = item.getCustomData().get('groupScopes') ?? [];
							for (const groupScopeCode of groupScopes) {
								this.#acquireScope(groupScopeCode, this.#getOwnerCode('group', item.getId()));
							}
							this.#onChange();
						},
						'Item:onDeselect': event => {
							const item = event.getData().item;
							this.#groups.delete(item.getId());
							const groupScopes = item.getCustomData().get('groupScopes') ?? [];
							for (const groupScopeCode of groupScopes) {
								this.#releaseScope(groupScopeCode, this.#getOwnerCode('group', item.getId()));
							}
							this.#onChange();
						}
					}
				}
			});
			main_core.Dom.addClass(groupSelector.getDialog().getContainer(), 'biconnector-settings-entity-selector');
			this.#groupSelector = groupSelector;
		}
		#initParamsSelector() {
			const items = [];
			Object.values(this.#paramList).forEach(param => {
				const itemTitle = this.#getParamTitle(param.code);
				const isRequired = this.#requiredParamList.has(param.code);
				items.push({
					id: param.code,
					entityId: 'biconnector-superset-params',
					title: itemTitle.title,
					supertitle: itemTitle.supertitle,
					tabs: 'params',
					deselectable: !isRequired,
					selected: this.#isNew && isRequired
				});
				if (this.#isNew && isRequired) {
					this.#params.add(param.code);
					this.#onChange();
				}
			});
			const preselectedItems = [];
			const tagItems = [];
			this.#params.forEach(paramCode => {
				preselectedItems.push(['biconnector-superset-params', paramCode]);
				const itemTitle = this.#getParamTitle(paramCode);
				const isRequired = this.#requiredParamList.has(paramCode);
				tagItems.push({
					id: paramCode,
					entityId: 'biconnector-superset-params',
					title: itemTitle.title,
					supertitle: itemTitle.supertitle,
					deselectable: !isRequired
				});
			});
			const paramSelector = new ui_entitySelector.TagSelector({
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
					entities: [{
						id: 'biconnector-superset-params'
					}],
					tabs: [{
						id: 'params',
						title: 'params'
					}]
				},
				events: {
					onBeforeTagAdd: event => {
						const {
							tag
						} = event.getData();
						this.#params.add(tag.getId());
						this.#onChange();
					},
					onBeforeTagRemove: event => {
						const {
							tag
						} = event.getData();
						this.#params.delete(tag.getId());
						this.#onChange();
					}
				}
			});
			main_core.Dom.addClass(paramSelector.getDialog().getContainer(), 'biconnector-settings-entity-selector');
			main_core.Dom.clean(document.querySelector('.dashboard-params-params-selector'));
			paramSelector.renderTo(document.querySelector('.dashboard-params-params-selector'));
			this.#paramsSelector = paramSelector;
			this.#addHintsToExistingTags();
			if (!this.activeUrlParamsSelector) {
				const listLink = document.querySelector('.dashboard-params-list-link');
				if (listLink) {
					main_core.Dom.style(listLink, 'display', 'none');
				}
			}
			this.#buildInitialScopeOwners();
			main_core_events.EventEmitter.emit('BIConnector.DashboardParamsSelector:initCompleted');
		}
		#addHintsToExistingTags() {
			for (const tag of this.#paramsSelector.getTags()) {
				const hintText = this.#requiredParamList.get(tag.getId());
				if (hintText) {
					const container = tag.getContainer();
					container.setAttribute('data-hint', hintText);
					container.setAttribute('data-hint-no-icon', '');
					BX.UI.Hint.initNode(container);
				}
			}
		}
		#getParamTitle(paramCode) {
			const param = this.#paramList[paramCode];
			if (!param) {
				return {
					title: paramCode,
					supertitle: ''
				};
			}
			const title = param.title ?? paramCode;
			const supertitle = param.superTitle ?? '';
			return {
				title,
				supertitle
			};
		}
		#onChange() {
			const isGroupsChanged = this.#groups.size !== this.#initialGroups.size || [...this.#groups].some(groupId => !this.#initialGroups.has(groupId));
			const isScopeChanged = this.#scopes.size !== this.#initialScopes.size || [...this.#scopes].some(scopeCode => !this.#initialScopes.has(scopeCode));
			const isParamsChanged = this.#params.size !== this.#initialParams.size || [...this.#params].some(paramCode => !this.#initialParams.has(paramCode));
			const isChanged = isScopeChanged || isParamsChanged || isGroupsChanged;
			const isLocked = !this.#isAllowedClearGroups && this.#groups.size === 0;
			main_core_events.EventEmitter.emit('BIConnector.DashboardParamsSelector:onChange', {
				isChanged,
				isLocked
			});
		}
		#openParamListSlider() {
			const componentLink = '/bitrix/components/bitrix/biconnector.apachesuperset.dashboard.url.parameter.list/slider.php';
			const sliderLink = new main_core.Uri(componentLink);
			BX.SidePanel.Instance.open(sliderLink.toString(), {
				width: 600,
				allowChangeHistory: false
			});
		}
		#bindLockedGroupHints() {
			const hint = BX.UI.Hint.createInstance();
			const hintText = main_core.Loc.getMessage('DASHBOARD_PARAMS_SELECTOR_GROUP_NOT_EDITABLE_HINT');
			this.#groupSelector.getTags().forEach(tag => {
				if (!tag.isDeselectable()) {
					const node = tag.getContainer();
					main_core.Event.bind(node, 'click', () => {
						hint.show(node, hintText);
					});
					main_core.Event.bind(node, 'mouseleave', () => {
						hint.hide(node);
					});
				}
			});
		}
		#buildInitialScopeOwners() {
			for (const paramCode of this.#initialParams) {
				const parameter = this.#paramList[paramCode];
				if (!parameter) {
					continue;
				}
				if (!this.#initialScopes.has(parameter.scope)) {
					continue;
				}
				this.#acquireScope(parameter.scope, this.#getOwnerCode('param', paramCode));
			}
			for (const groupId of this.#initialGroups) {
				const groupItem = this.#groupSelector?.getDialog()?.getItem({
					id: groupId,
					entityId: 'biconnector-superset-group'
				});
				if (!groupItem) {
					continue;
				}
				const groupScopes = groupItem.getCustomData().get('groupScopes') ?? [];
				for (const scopeCode of groupScopes) {
					this.#acquireScope(scopeCode, this.#getOwnerCode('group', groupId));
				}
			}
		}
		#acquireScope(scopeCode, ownerCode) {
			let owners = this.#scopeOwners.get(scopeCode);
			if (!owners) {
				owners = new Set();
				this.#scopeOwners.set(scopeCode, owners);
				this.#scopes.add(scopeCode);
			}
			owners.add(ownerCode);
		}
		#releaseScope(scopeCode, ownerCode) {
			const owners = this.#scopeOwners.get(scopeCode);
			if (!owners?.delete(ownerCode)) {
				return;
			}
			if (owners.size === 0) {
				this.#scopeOwners.delete(scopeCode);
				this.#scopes.delete(scopeCode);
			}
		}
		#getOwnerCode(type, code) {
			return `${type}_${code}`;
		}
	}

	exports.DashboardParametersSelector = DashboardParametersSelector;

})(this.BX.BIConnector = this.BX.BIConnector || {}, BX, BX.Event, BX.UI.EntitySelector);
//# sourceMappingURL=dashboard-parameters-selector.bundle.js.map
