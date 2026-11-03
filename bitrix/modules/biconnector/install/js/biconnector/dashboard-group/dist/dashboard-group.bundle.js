/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core_events, main_popup, ui_vue3, main_core, ui_vue3_vuex, ui_iconSet_api_vue, ui_notification, biconnector_errorMessage, ui_entitySelector, ui_iconSet_api_core, ui_vue3_components_button, ui_vue3_directives_hint) {
	'use strict';

	const GroupType = {
		system: 'SYSTEM',
		custom: 'CUSTOM'
	};
	const DashboardType = {
		system: 'SYSTEM',
		market: 'MARKET'};

	/* eslint-disable no-param-reassign */
	class Store {
		// eslint-disable-next-line max-lines-per-function
		static buildStore(defaultValues) {
			Store.initialGroup = main_core.Runtime.clone(defaultValues.group);
			return ui_vue3_vuex.createStore({
				state() {
					return defaultValues;
				},
				mutations: {
					setIsLoading(state, isLoading) {
						state.isLoading = isLoading;
					},
					setGroupName(state, groupName) {
						state.group.name = groupName;
					},
					setEmptyGroupName(state, groupName) {
						state.group.name = groupName;
						Store.initialGroup.name = groupName;
					},
					addDashboard(state, dashboard) {
						state.group.dashboardIds.unshift(dashboard.id);
						const groupScopes = state.group.scopes;
						if (state.dashboards.get(dashboard.id)) {
							dashboard.scopes = state.dashboards.get(dashboard.id).scopes;
						}
						const dashboardScopeCodes = new Set(dashboard.scopes.map(dashScope => dashScope.code));
						for (const groupScope of groupScopes) {
							if (!dashboardScopeCodes.has(groupScope.code)) {
								dashboard.scopes.push(groupScope);
							}
						}
						state.dashboards.set(dashboard.id, dashboard);
					},
					removeDashboard(state, dashboardId) {
						const dashboard = state.dashboards.get(dashboardId);
						if (!dashboard) {
							return;
						}
						state.group.dashboardIds = state.group.dashboardIds.filter(id => id !== dashboardId);
						for (const groupScope of state.group.scopes) {
							let dashboardIsInOtherGroupWithScope = false;
							for (const otherGroup of state.otherGroups) {
								if (otherGroup.dashboardIds.includes(dashboardId) && otherGroup.scopes.some(item => item.code === groupScope.code)) {
									dashboardIsInOtherGroupWithScope = true;
								}
							}
							if (!dashboardIsInOtherGroupWithScope && dashboard.scopes.some(item => item.code === groupScope.code)) {
								dashboard.scopes = dashboard.scopes.filter(item => item.code !== groupScope.code);
								state.dashboards.set(dashboardId, dashboard);
							}
						}
					},
					setDashboardScopes(state, data) {
						const {
							dashboardId,
							scopes
						} = data;
						const dashboard = state.dashboards.get(dashboardId);
						dashboard.scopes = scopes;
					},
					addGroupScope(state, scope) {
						state.group.scopes.push(scope);
						const newScopeCode = scope.code;
						for (const dashboardId of state.group.dashboardIds) {
							const dashboard = state.dashboards.get(dashboardId);
							if (!dashboard.scopes.some(item => item.code === newScopeCode)) {
								dashboard.scopes.push(scope);
								state.dashboards.set(dashboardId, dashboard);
							}
						}
					},
					removeGroupScope(state, scope) {
						state.group.scopes = state.group.scopes.filter(existingScope => existingScope.code !== scope.code);
						const deletedScopeCode = scope.code;
						for (const dashboardId of state.group.dashboardIds) {
							let dashboardIsInOtherGroupWithScope = false;
							for (const otherGroup of state.otherGroups) {
								if (otherGroup.dashboardIds.includes(dashboardId) && otherGroup.scopes.some(item => item.code === deletedScopeCode)) {
									dashboardIsInOtherGroupWithScope = true;
								}
							}
							if (!dashboardIsInOtherGroupWithScope) {
								const dashboard = state.dashboards.get(dashboardId);
								if (dashboard.scopes.some(item => item.code === deletedScopeCode)) {
									dashboard.scopes = dashboard.scopes.filter(item => item.code !== deletedScopeCode);
									state.dashboards.set(dashboardId, dashboard);
								}
							}
						}
					}
				},
				getters: {
					user(state) {
						return state.user;
					},
					groupName(state) {
						return state.group.name;
					},
					groupScopes(state) {
						return state.group.scopes;
					},
					dashboards(state) {
						return state.dashboards;
					},
					otherGroups(state) {
						return state.otherGroups;
					},
					groupDashboardsData(state) {
						const result = [];
						for (const dashboardId of state.group.dashboardIds) {
							result.push(state.dashboards.get(dashboardId));
						}
						return result;
					},
					isSystemGroup(state) {
						return state.group.type === GroupType.system;
					},
					isNewGroup(state) {
						return String(state.group.id ?? '').startsWith('new_');
					},
					groupData(state) {
						return {
							id: state.group.id,
							name: state.group.name,
							type: state.group.type,
							scopes: state.group.scopes,
							dashboardIds: state.group.dashboardIds
						};
					},
					isSaveEnabled(state) {
						return state.saveEnabled;
					},
					isLoading(state) {
						return state.isLoading;
					},
					isGroupScope(state) {
						return (dashboardId, scopeCode) => {
							if (state.group.scopes.some(groupScope => groupScope.code === scopeCode)) {
								return true;
							}
							for (const otherGroup of state.otherGroups) {
								if (otherGroup.dashboardIds.includes(dashboardId) && otherGroup.scopes.some(groupScope => groupScope.code === scopeCode)) {
									return true;
								}
							}
							return false;
						};
					},
					accessibleDashboardIdsSet(state) {
						return new Set(state.otherGroups.filter(group => state.user.accessibleGroupIds.includes(group.id)).flatMap(group => group.dashboardIds));
					},
					shouldShowDeleteWarning(state, getters) {
						return dashboardId => {
							const user = state.user;
							if (user.isAdmin || user.hasAccessToPermission) {
								return false;
							}
							const dashboard = state.dashboards.get(dashboardId);
							if (!dashboard) {
								return false;
							}
							if (dashboard.createdById === user.id) {
								return false;
							}
							return !getters.accessibleDashboardIdsSet.has(dashboardId);
						};
					},
					getGroupsNameForDashboardScope(state) {
						return (dashboardId, scopeCode) => {
							const groups = [];
							if (state.group.scopes.some(groupScope => groupScope.code === scopeCode)) {
								groups.push(state.group.name);
							}
							for (const otherGroup of state.otherGroups) {
								if (otherGroup.dashboardIds.includes(dashboardId) && otherGroup.scopes.some(groupScope => groupScope.code === scopeCode)) {
									groups.push(otherGroup.name);
								}
							}
							return groups;
						};
					},
					isTitleEdited(state) {
						return state.group.name !== Store.initialGroup.name;
					},
					isDashboardListEdited(state) {
						return !Store.areSetsEqual(new Set(Store.initialGroup.dashboardIds), new Set(state.group.dashboardIds));
					},
					isScopeListEdited(state) {
						return !Store.areSetsEqual(new Set(Store.initialGroup.scopes.map(scope => scope.code)), new Set(state.group.scopes.map(scope => scope.code)));
					}
				}
			});
		}
		static areSetsEqual(setA, setB) {
			if (setA.size !== setB.size) {
				return false;
			}
			for (const item of setA) {
				if (!setB.has(item)) {
					return false;
				}
			}
			return true;
		}
	}

	// eslint-disable-next-line no-unused-vars

	const DashboardScopeSelector = {
		props: {
			dashboard: {
				/** @type Dashboard */
				type: Object,
				required: true
			}
		},
		data() {
			return {
				initialScopedIds: []
			};
		},
		beforeUnmount() {
			if (this.dialog) {
				this.dialog.destroy();
			}
			this.dialog = null;
			if (this.hintManagers) {
				this.hintManagers.forEach(manager => {
					if (manager.popup) {
						manager.popup.destroy();
					}
				});
				this.hintManagers = [];
			}
			const node = this.$el.querySelector('.scope-hint');
			if (node) {
				main_core.Event.unbindAll(node);
			}
		},
		computed: {
			visibleScopes() {
				return this.scopes.slice(0, 3);
			},
			scopes() {
				return [...this.dashboard.scopes];
			},
			isGroupScope() {
				return scopeCode => this.$store.getters.isGroupScope(this.dashboard.id, scopeCode);
			},
			scopeText() {
				const formattedScopes = [];
				for (const [index, scope] of this.visibleScopes.entries()) {
					const name = scope.name;
					const suffix = index < this.visibleScopes.length - 1 ? ', ' : '';
					const element = `
					<span 
						class="scope-name"
						title="${main_core.Text.encode(scope.name)}"
					>
						${main_core.Text.encode(name + suffix)}
					</span>
				`;
					formattedScopes.push(element);
				}
				if (this.scopes.length <= 3) {
					return formattedScopes.join('');
				}
				return this.$Bitrix.Loc.getMessage('BI_GROUP_SCOPES_DASHBOARD').replace('#FIRST_SCOPES#', formattedScopes.join('')).replace('[hint]', '<span class="scope-list scope-list-more scope-hint">').replace('[/hint]', '</span>').replace('#NUMBER#', this.dashboard.scopes.length - 3);
			}
		},
		emits: ['onScopeChange'],
		methods: {
			openSelector() {
				if (!this.dialog) {
					this.initDialog();
				}
				this.initialScopedIds = this.dashboard.scopes.map(scope => scope.code);
				this.dialog.show();
			},
			initDialog() {
				const preselectedItems = [];
				const undeselectedItems = [];
				for (const scope of this.dashboard.scopes) {
					preselectedItems.push(['biconnector-superset-scope', scope.code]);
					if (this.isGroupScope(scope.code)) {
						undeselectedItems.push(['biconnector-superset-scope', scope.code]);
					}
				}
				this.dialog = new ui_entitySelector.Dialog({
					id: 'dashboard-scope-selector',
					targetNode: this.$refs.dashboardScopes,
					width: 350,
					height: 370,
					dropdownMode: true,
					compactView: true,
					showAvatars: false,
					enableSearch: true,
					preload: true,
					preselectedItems,
					undeselectedItems,
					entities: [{
						id: 'biconnector-superset-scope',
						dynamicLoad: true,
						dynamicSearch: true
					}],
					events: {
						'Item:onSelect': this.handleScopeAdd,
						'Item:onDeselect': this.handleScopeRemove,
						onHide: this.handleDialogHide,
						onLoad: () => {
							this.addHintsForUndeselectedScopes();
						}
					}
				});
				this.dialog.getPopup().setOffset({
					offsetLeft: -320
				});
				this.dialog.adjustPosition();
				main_core.Dom.addClass(this.dialog.getContainer(), 'biconnector-scope-selector');
			},
			addHintsForUndeselectedScopes() {
				if (!this.dialog) {
					return;
				}
				const undeselectedItems = [];
				for (const scope of this.scopes) {
					const groupNameList = this.$store.getters.getGroupsNameForDashboardScope(this.dashboard.id, scope.code);
					if (groupNameList.length > 0) {
						undeselectedItems.push({
							scopeName: scope.name,
							groupNameList
						});
					}
				}
				undeselectedItems.forEach(mapItem => {
					const scopeName = mapItem.scopeName;
					const groupNameList = mapItem.groupNameList;
					this.createHintForUndeselectebleScope(scopeName, groupNameList);
				});
			},
			handleScopeAdd(event) {
				const addedItem = event.getData().item;
				const scopes = this.scopes;
				scopes.push({
					code: addedItem.getId(),
					name: addedItem.getTitle()
				});
				this.$store.commit('setDashboardScopes', {
					dashboardId: this.dashboard.id,
					scopes
				});
				this.$emit('onScopeChange');
			},
			handleScopeRemove(event) {
				const removedItem = event.getData().item;
				const scopes = this.scopes.filter(item => item.code !== removedItem.id);
				this.$store.commit('setDashboardScopes', {
					dashboardId: this.dashboard.id,
					scopes
				});
				this.$emit('onScopeChange');
			},
			handleDialogHide(event) {
				const wasChanged = !Store.areSetsEqual(new Set(this.initialScopedIds), new Set(this.dashboard.scopes.map(scope => scope.code)));
				main_core_events.EventEmitter.emit('BIConnector.GroupPopup.DashboardScopeSelector:onDialogHide', {
					isScopeListEdited: wasChanged
				});
			},
			showMoreScopesHint() {
				const hintNode = this.$el.querySelector('.scope-hint');
				this.hintManager.show(hintNode, this.scopes.slice(3).map(scope => scope.name).join(', '), false);
			},
			hideMoreScopesHint() {
				this.hintManager.hide();
				this.hintManager.popup = null;
			},
			onGroupScopeChanged() {
				this.dialog?.destroy();
				this.dialog = null;
			},
			attachHintHandlers() {
				const node = this.$el.querySelector('.scope-hint');
				if (node) {
					main_core.Event.unbindAll(node);
					main_core.Event.bind(node, 'mouseenter', this.showMoreScopesHint);
					main_core.Event.bind(node, 'mouseleave', this.hideMoreScopesHint);
				}
			},
			createHintForUndeselectebleScope(scopeName, groupNameList) {
				const popupContent = this.dialog.getPopup().getContentContainer();
				const tagContentNode = this.findSelectorItemByTitle(popupContent, scopeName);
				this.hintManagers = this.hintManagers ?? [];
				let hintText = '';
				if (groupNameList.length === 1) {
					hintText = main_core.Loc.getMessage('DASHBOARD_PARAMS_SELECTOR_NO_DELETE_GROUP_SCOPE', {
						'#GROUP_NAME#': main_core.Text.encode(groupNameList[0])
					});
				} else {
					const contextText = main_core.Loc.getMessage('DASHBOARD_PARAMS_SELECTOR_NO_DELETE_GROUP_SCOPE_MANY');
					const groupListHtml = `<ul style="margin: 3px 0; padding-left: 20px;">${groupNameList.map(groupName => `<li>${main_core.Text.encode(groupName)}</li>`).join('')}</ul>`;
					hintText = contextText + groupListHtml;
				}
				const hintId = `scope-hint-dash-${this.dashboard.id}-${scopeName.replaceAll(/\s/g, '-')}`;
				const hintManager = BX.UI.Hint.createInstance({
					id: hintId,
					popupParameters: {
						offsetLeft: 340,
						offsetTop: -45,
						autoHide: true,
						width: 330,
						angle: {
							position: 'left',
							offset: 15
						}
					}
				});
				this.hintManagers.push(hintManager);
				main_core.Event.bind(tagContentNode, 'click', () => {
					hintManager.show(tagContentNode, hintText, false, false);
				});
				main_core.Event.bind(tagContentNode, 'mouseleave', () => {
					hintManager.hide();
				});
			},
			findSelectorItemByTitle(rootElement, titleText) {
				const items = rootElement.querySelectorAll('.ui-selector-item');
				for (const item of items) {
					const titleElement = item.querySelector('.ui-selector-item-title');
					if (titleElement && titleElement.textContent.trim() === titleText) {
						return item;
					}
				}
				return null;
			}
		},
		mounted() {
			this.hintManager = main_core.UI.Hint.createInstance({
				id: `dashboard-scope-hint-${Date.now()}`,
				popupParameters: {
					bindOptions: {
						position: 'bottom'
					},
					width: 190,
					offsetLeft: -80,
					angle: {
						position: 'top',
						offset: 130
					},
					cacheable: false
				}
			});
			this.attachHintHandlers();
		},
		updated() {
			this.attachHintHandlers();
		},
		template: `
		<div class="group-dashboard-scopes-container">
			<span 
				class="scope-list scope-list-dashboard"
				@click="openSelector"
				v-if="scopes.length > 0"
				v-html="scopeText"
			>
			</span>
			<span
				class="scope-list-empty"
				@click="openSelector"
				v-else
			>
				{{$Bitrix.Loc.getMessage('BI_GROUP_DASHBOARD_SCOPES_EMPTY')}}
			</span>
			<span ref="dashboardScopes"></span>
		</div>
	`
	};

	const DashboardItem = {
		props: {
			dashboard: {
				/** @type Dashboard */
				type: Object,
				required: true
			}
		},
		computed: {
			iconPath() {
				if (this.dashboard.type === DashboardType.system) {
					return '/bitrix/images/biconnector/database-connections/system.svg';
				}
				if (this.dashboard.type === DashboardType.market) {
					return '/bitrix/images/biconnector/superset-dashboard-selector/icon-type-market.webp';
				}
				return '/bitrix/images/biconnector/superset-dashboard-selector/icon-type-custom.webp';
			},
			set() {
				return ui_iconSet_api_vue.Outline;
			}
		},
		methods: {
			onRemoveClick() {
				main_core_events.EventEmitter.emit('BIConnector.GroupPopup.DashboardList:onDashboardRemove', {
					isDashboardListEdited: true
				});
				this.$emit('onDashboardRemove', {
					dashboardId: this.dashboard.id
				});
				this.emitDashboardChange();
			},
			emitDashboardChange() {
				this.$emit('onDashboardChange');
			},
			onGroupScopeChanged() {
				this.$refs.scopeSelector.onGroupScopeChanged();
			}
		},
		emits: ['onDashboardChange', 'onDashboardRemove'],
		components: {
			BIcon: ui_iconSet_api_vue.BIcon,
			DashboardScopeSelector
		},
		template: `
		<div class="group-dashboard">
			<img class="group-dashboard-icon" :src="iconPath" width="32" height="32" alt="Dashboard icon">
			<div class="group-dashboard-name" :title="dashboard.name">{{dashboard.name}}</div>
			<DashboardScopeSelector :dashboard="dashboard" ref="scopeSelector" @on-scope-change="emitDashboardChange"/>
			<BIcon
				:name="set.CROSS_L"
				:size="20"
				color="var(--ui-color-base-4)"
				:class="'group-dashboard-remove-icon'"
				@click="onRemoveClick"
			></BIcon>
		</div>
	`
	};

	const DashboardSelector = {
		props: {
			dashboards: {
				/** @type Dashboard[] */
				type: Array,
				required: true
			}
		},
		data() {
			return {
				initialDashboardIds: [],
				bypassDeselectHandler: false
			};
		},
		mounted() {
			this.initDialog();
		},
		methods: {
			onAddDashboardClick() {
				this.initialDashboardIds = this.dashboards.map(dashboard => dashboard.id);
				this.dialog.show();
			},
			initDialog() {
				const preselectedItems = [];
				for (const dashboard of this.dashboards) {
					preselectedItems.push(['biconnector-superset-dashboard', dashboard.id]);
				}
				this.dialog = new ui_entitySelector.Dialog({
					id: 'group-dashboard-selector',
					targetNode: this.$refs.addDashboardButton,
					width: 400,
					height: 370,
					dropdownMode: true,
					enableSearch: true,
					preload: true,
					preselectedItems,
					entities: [{
						id: 'biconnector-superset-dashboard',
						dynamicLoad: true,
						dynamicSearch: true,
						options: {
							loadProxyData: false,
							checkAccessRights: this.$store.getters.isSaveEnabled
						}
					}],
					tagSelectorOptions: {
						events: {
							onBeforeTagRemove: event => {
								if (this.bypassDeselectHandler) {
									return;
								}
								const tag = event.data.tag;
								const dashboardId = tag.getId();
								if (this.$store.getters.isSaveEnabled && this.$store.getters.shouldShowDeleteWarning(dashboardId)) {
									event.preventDefault();
									this.dialog.setAutoHide(false);
									this.$emit('onBeforeRemoveConfirmation', {
										dashboardId
									});
								}
							}
						}
					},
					events: {
						'Item:onSelect': event => {
							const item = event.data.item;
							const dashboard = {
								id: item.getId(),
								name: item.getTitle(),
								type: item.getCustomData().get('type') ?? DashboardType.system,
								createdById: item.getCustomData().get('createdById'),
								scopes: item.getCustomData().get('scopes') ?? []
							};
							this.$store.commit('addDashboard', dashboard);
							this.$emit('onDashboardsChange');
						},
						'Item:onBeforeDeselect': event => {
							if (this.bypassDeselectHandler) {
								return;
							}
							const item = event.data.item;
							const dashboardId = item.getId();
							if (this.$store.getters.isSaveEnabled && this.$store.getters.shouldShowDeleteWarning(dashboardId)) {
								event.preventDefault();
								this.dialog.setAutoHide(false);
								this.$emit('onBeforeRemoveConfirmation', {
									dashboardId
								});
							}
						},
						'Item:onDeselect': event => {
							const item = event.data.item;
							this.$store.commit('removeDashboard', item.getId());
							this.$emit('onDashboardsChange');
						},
						onHide: event => {
							const wasChanged = !Store.areSetsEqual(new Set(this.initialDashboardIds), new Set(this.dashboards.map(dashboard => dashboard.id)));
							main_core_events.EventEmitter.emit('BIConnector.GroupPopup.DashboardSelector:onDialogHide', {
								isDashboardListEdited: wasChanged
							});
						}
					}
				});
			},
			deselect(dashboardId) {
				this.bypassDeselectHandler = true;
				this.dialog.getItem({
					entityId: 'biconnector-superset-dashboard',
					id: dashboardId
				})?.deselect();
			},
			resetDialog() {
				this.dialog.setAutoHide(true);
				this.bypassDeselectHandler = false;
			}
		},
		emits: ['onBeforeRemoveConfirmation', 'onDashboardsChange'],
		watch: {
			dashboards(newValue, oldValue) {
				const dialog = this.dialog;
				for (const oldItem of oldValue) {
					if (!newValue.includes(oldItem)) {
						dialog.getItem(['biconnector-superset-dashboard', oldItem.id])?.deselect();
					}
				}
			}
		},
		template: `
		<div class="ui-btn --air ui-btn-md ui-btn-icon-add ui-icon-set__scope --with-left-icon --style-tinted ui-btn-no-caps"
			@click="onAddDashboardClick"
			ref="addDashboardButton"
		>
			<span class="ui-btn-text">
				{{ $Bitrix.Loc.getMessage('BI_GROUP_ADD_DASHBOARD') }}
			</span>
		</div>
	`
	};

	const DeletionWarningPopup = {
		emits: ['confirm', 'close'],
		props: {},
		setup() {
			return {
				ButtonSize: ui_vue3_components_button.ButtonSize,
				AirButtonStyle: ui_vue3_components_button.AirButtonStyle,
				Outline: ui_iconSet_api_core.Outline
			};
		},
		data() {
			return {
				popupInstance: null,
				popupId: 'biconnector-dashboard-deletion',
				dontShow: false
			};
		},
		computed: {
			popupOptions() {
				return {
					id: this.popupId,
					content: this.$refs.content,
					width: 410,
					padding: 12,
					borderRadius: '16px',
					autoHide: true,
					overlay: true,
					events: {
						onPopupClose: this.closePopup
					},
					fixed: true
				};
			}
		},
		methods: {
			closePopup() {
				if (this.popupInstance) {
					main_popup.PopupManager.getPopupById(this.popupId)?.destroy();
					this.popupInstance = null;
					this.$emit('close');
				}
			},
			onConfirm() {
				this.$emit('confirm', {
					dontShow: this.dontShow
				});
				this.closePopup();
			},
			getPopupText() {
				return this.$Bitrix.Loc.getMessage('BI_GROUP_SAVE_WARN_TEXT_MSGVER_1');
			}
		},
		mounted() {
			if (!this.popupInstance) {
				this.popupInstance = new main_popup.Popup(this.popupOptions);
			}
			this.popupInstance.show();
		},
		beforeUnmount() {
			this.closePopup();
		},
		components: {
			BIcon: ui_iconSet_api_vue.BIcon,
			UiButton: ui_vue3_components_button.Button
		},
		template: `
		<div ref="content" class="group-warn-popup">
			<div class="group-warn-popup-title-block">
				<div class="group-warn-popup-title">{{ $Bitrix.Loc.getMessage('BI_GROUP_SAVE_WARN_TITLE') }}</div>
				<BIcon
					:name="Outline.CROSS_L"
					:size="24"
					color="#A7A7A7"
					:class="'group-warn-popup-close'"
					@click="closePopup"
				></BIcon>
			</div>
			<div class="group-warn-popup-box" v-html="getPopupText()"></div>
			<div class="group-warn-popup-buttons">
				<UiButton
					:text="$Bitrix.Loc.getMessage('BI_GROUP_SAVE_WARN_YES')"
					:size="ButtonSize.MEDIUM"
					:style="AirButtonStyle.FILLED"
					@click="onConfirm"
				/>
				<UiButton
					:text="$Bitrix.Loc.getMessage('BI_GROUP_SAVE_WARN_NO')"
					:size="ButtonSize.MEDIUM"
					:style="AirButtonStyle.PLAIN"
					@click="closePopup"
				/>
			</div>
		</div>
	`
	};

	const GroupScopeSelector = {
		props: {
			canEdit: {
				type: Boolean,
				required: true
			}
		},
		directives: {
			hint: ui_vue3_directives_hint.hint
		},
		data() {
			return {
				initialScopedIds: []
			};
		},
		computed: {
			scopes() {
				return this.$store.getters.groupScopes;
			},
			hintOptions() {
				return {
					html: this.$Bitrix.Loc.getMessage('BI_GROUP_SCOPE_HINT_MSGVER_1').replace('[link]', '<a class="scope-hint-link" onclick="top.BX.Helper.show(`redirect=detail&code=25556500`)">').replace('[/link]', '</a>'),
					interactivity: true,
					popupOptions: {
						bindOptions: {
							position: 'bottom'
						},
						autoHide: false,
						width: 244,
						offsetTop: -4,
						angle: {
							position: 'top',
							offset: 34
						}
					}
				};
			},
			scopeText() {
				const element = `
				<span
					class="scope-name ${this.canEdit ? '' : 'scope-list-system'}"
					title="${main_core.Text.encode(this.scopes[0].name)}"
				>
					${main_core.Text.encode(this.scopes[0].name)}
				</span>
			`;
				if (this.scopes.length <= 1) {
					return this.$Bitrix.Loc.getMessage('BI_GROUP_SCOPES_GROUP_MSGVER_1').replace('[title]', '<span class="group-scope-title">').replace('[/title]', '</span>').replace('#SCOPE#', element);
				}
				return this.$Bitrix.Loc.getMessage('BI_GROUP_SCOPES_GROUP_MANY_MSGVER_1').replace('[title]', '<span class="group-scope-title">').replace('[/title]', '</span>').replace('#FIRST_SCOPES#', element).replace('[hint]', '<span class="scope-list scope-list-more group-scope-hint">').replace('[/hint]', '</span>').replace('#NUMBER#', this.scopes.length - 1);
			},
			emptyScopesText() {
				return this.$Bitrix.Loc.getMessage('BI_GROUP_SCOPES_GROUP_EMPTY_MSGVER_1').replace('[title]', '<span class="group-scope-title">').replace('[/title]', '</span>');
			},
			set() {
				return ui_iconSet_api_vue.Outline;
			}
		},
		methods: {
			openScopeSelector() {
				if (!this.canEdit) {
					return;
				}
				if (!this.dialog) {
					this.initDialog();
				}
				this.initialScopedIds = this.scopes.map(scope => scope.code);
				this.dialog.show();
			},
			initDialog() {
				const preselectedItems = [];
				for (const scope of this.scopes) {
					preselectedItems.push(['biconnector-superset-scope', scope.code]);
				}
				this.dialog = new ui_entitySelector.Dialog({
					id: 'group-scope-selector',
					targetNode: this.$refs.groupScopes,
					width: 350,
					height: 370,
					dropdownMode: true,
					compactView: true,
					showAvatars: false,
					enableSearch: true,
					preload: true,
					preselectedItems,
					entities: [{
						id: 'biconnector-superset-scope',
						dynamicLoad: true,
						dynamicSearch: true
					}],
					events: {
						'Item:onSelect': this.onGroupScopeAdd,
						'Item:onDeselect': this.onGroupScopeRemove,
						onHide: this.onDialogHide
					}
				});
				this.dialog.getPopup().setOffset({
					offsetLeft: -320
				});
				this.dialog.adjustPosition();
				main_core.Dom.addClass(this.dialog.getContainer(), 'biconnector-scope-selector');
			},
			onGroupScopeAdd(event) {
				const item = event.getData().item;
				const scope = {
					code: item.getId(),
					name: item.getTitle()
				};
				this.$emit('onGroupScopeAdd', scope);
			},
			onGroupScopeRemove(event) {
				const item = event.getData().item;
				const scope = {
					code: item.getId(),
					name: item.getTitle()
				};
				this.$emit('onGroupScopeRemove', scope);
			},
			onDialogHide(event) {
				const wasChanged = !Store.areSetsEqual(new Set(this.initialScopedIds), new Set(this.scopes.map(scope => scope.code)));
				main_core_events.EventEmitter.emit('BIConnector.GroupPopup.ScopeSelector:onDialogHide', {
					isScopeListEdited: wasChanged
				});
			},
			showMoreScopesHint() {
				const hintNode = this.$el.querySelector('.group-scope-hint');
				this.hintManager.show(hintNode, this.scopes.slice(1).map(scope => scope.name).join(', '), false);
			},
			hideMoreScopesHint() {
				this.hintManager.hide();
				this.hintManager.popup = null;
			},
			showSystemScopesHint() {
				const hintNode = this.$el.querySelector('.scope-list-system');
				this.systemScopeHintManager.show(hintNode, this.$Bitrix.Loc.getMessage('BI_GROUP_SYSTEM_SCOPES_HINT'), false);
			},
			hideSystemScopesHint() {
				this.systemScopeHintManager.hide();
				this.systemScopeHintManager.popup = null;
			},
			attachHintHandlers() {
				const node = this.$el.querySelector('.group-scope-hint');
				if (node) {
					main_core.Event.unbindAll(node);
					main_core.Event.bind(node, 'mouseenter', this.showMoreScopesHint);
					main_core.Event.bind(node, 'mouseleave', this.hideMoreScopesHint);
				}
				if (!this.canEdit) {
					const scopeName = this.$el.querySelector('.scope-list-system');
					if (scopeName) {
						main_core.Event.unbindAll(scopeName);
						main_core.Event.bind(scopeName, 'mouseenter', this.showSystemScopesHint);
						main_core.Event.bind(scopeName, 'mouseleave', this.hideSystemScopesHint);
					}
				}
			}
		},
		mounted() {
			this.hintManager = main_core.UI.Hint.createInstance({
				id: 'group-scope-hint',
				popupParameters: {
					bindOptions: {
						position: 'bottom'
					},
					width: 190,
					offsetLeft: -80,
					angle: {
						position: 'top',
						offset: 130
					},
					cacheable: false
				}
			});
			this.systemScopeHintManager = main_core.UI.Hint.createInstance({
				id: 'system-scope-hint',
				popupParameters: {
					bindOptions: {
						position: 'bottom'
					},
					width: 244,
					offsetLeft: -140,
					angle: {
						position: 'top',
						offset: 180
					},
					cacheable: false
				}
			});
			this.attachHintHandlers();
		},
		updated() {
			this.attachHintHandlers();
		},
		beforeUnmount() {
			if (this.dialog) {
				this.dialog.destroy();
			}
			this.dialog = null;
			const node = this.$el.querySelector('.group-scope-hint');
			if (node) {
				main_core.Event.unbindAll(node);
			}
			const scopeName = this.$el.querySelector('.scope-list-system');
			if (scopeName) {
				main_core.Event.unbindAll(scopeName);
			}
		},
		emits: ['onGroupScopeAdd', 'onGroupScopeRemove'],
		components: {
			BIcon: ui_iconSet_api_vue.BIcon
		},
		template: `
		<div class="group-scope-selector">
			<span
				v-if="scopes.length > 0"
				@click="openScopeSelector"
				class="scope-list scope-list-group"
				v-html="scopeText"
			></span>
			<span
				v-else
				@click="openScopeSelector"
				class="scope-list scope-list-group"
				v-html="emptyScopesText"
			></span>
			<div class="group-scope-list-hint" ref="groupScopes" v-hint="hintOptions">
				<BIcon
					:name="set.QUESTION"
					:size="20"
					color="var(--ui-color-base-4)"
				></BIcon>
			</div>
		</div>
	`
	};

	const TitleEditor = {
		props: {
			canEdit: {
				type: Boolean,
				required: true
			}
		},
		data() {
			return {
				editMode: false
			};
		},
		directives: {
			hint: ui_vue3_directives_hint.hint
		},
		computed: {
			namePlaceholder() {
				return this.isNewGroup ? this.$Bitrix.Loc.getMessage('BI_GROUP_NAME_NEW') : '';
			},
			displayedGroupName() {
				if (this.isNewGroup && !this.groupName) {
					return this.namePlaceholder;
				}
				return this.groupName;
			},
			isNewGroup() {
				return this.$store.getters.isNewGroup;
			},
			groupName: {
				get() {
					return this.$store.getters.groupName;
				},
				set(value) {
					this.$store.commit('setGroupName', value);
				}
			},
			set() {
				return ui_iconSet_api_vue.Outline;
			},
			nameHintOptions() {
				return {
					text: this.$Bitrix.Loc.getMessage('BI_GROUP_SYSTEM_NAME_HINT'),
					popupOptions: {
						bindOptions: {
							position: 'bottom'
						},
						width: 220,
						offsetLeft: 40,
						angle: {
							position: 'top',
							offset: 0
						}
					}
				};
			}
		},
		methods: {
			setEditMode() {
				this.editMode = true;
				this.$nextTick(() => {
					this.$refs.nameInput.focus();
				});
			},
			setViewMode() {
				this.editMode = false;
				this.$emit('onNameUpdate');
			}
		},
		emits: ['onNameUpdate'],
		components: {
			BIcon: ui_iconSet_api_vue.BIcon
		},
		template: `
		<div class="group-header-title" :style="{ width: editMode ? '80%' : 'auto' }">
			<template v-if="canEdit">
				<input
					v-if="editMode"
					class="group-name-input"
					data-testid="biconnector-dashboard-group-name-input"
					@blur="setViewMode"
					@keyup.enter="setViewMode"
					v-model="groupName"
					ref="nameInput"
					:placeholder="namePlaceholder"
				>
				<template v-else>
					<div class="group-name" data-testid="biconnector-dashboard-group-name">{{displayedGroupName}}</div>
					<BIcon
						:name="set.EDIT_L"
						:size="20"
						color="var(--ui-color-base-4)"
						:class="'group-name-edit-icon'"
						data-testid="biconnector-dashboard-group-name-edit"
						@click="setEditMode"
					></BIcon>
				</template>
			</template>
			<template v-else>
				<div
					class="group-name"
					data-testid="biconnector-dashboard-group-name"
					v-hint="nameHintOptions"
				>{{displayedGroupName}}</div>
			</template>
		</div>
	`
	};

	const GROUP_POPUP_ID = 'biconnector-dashboard-group';

	const App = {
		mounted() {
			main_core_events.EventEmitter.subscribe('BIConnector.Internal.GroupPopup:onPopupClose', this.onGroupPopupClose);
		},
		beforeUnmount() {
			main_core_events.EventEmitter.unsubscribe('BIConnector.Internal.GroupPopup:onPopupClose', this.onGroupPopupClose);
		},
		data() {
			return {
				deletionWarning: {
					popupShown: false,
					dashboardId: null
				}
			};
		},
		computed: {
			isNoDashboards() {
				return this.$store.state.group.dashboardIds.length === 0;
			},
			dashboards() {
				return this.$store.getters.groupDashboardsData;
			},
			isSystemGroup() {
				return this.$store.getters.isSystemGroup;
			},
			isSaveEnabled() {
				return this.$store.getters.isSaveEnabled;
			},
			isLoading() {
				return this.$store.getters.isLoading;
			},
			isDashboardListScrollable() {
				if (this.isSaveEnabled) {
					return this.dashboards.length > 6;
				}
				return this.dashboards.length > 7;
			},
			set() {
				return ui_iconSet_api_vue.Outline;
			}
		},
		methods: {
			handleDeletionConfirmationRequest(event) {
				this.deletionWarning.dashboardId = event.dashboardId;
				this.deletionWarning.popupShown = true;
			},
			updateRight() {
				main_core_events.EventEmitter.emit('BIConnector.GroupPopup:onGroupUpdated', {
					group: main_core.Runtime.clone(this.$store.getters.groupData),
					dashboards: main_core.Runtime.clone(this.$store.getters.dashboards)
				});
			},
			onGroupScopeAdd(event) {
				this.$store.commit('addGroupScope', event);
				this.updateRight();
				for (const dashboardItem of this.$refs.dashboardItem ?? []) {
					dashboardItem.onGroupScopeChanged();
				}
			},
			onGroupScopeRemove(event) {
				this.$store.commit('removeGroupScope', event);
				this.updateRight();
				for (const dashboardItem of this.$refs.dashboardItem ?? []) {
					dashboardItem.onGroupScopeChanged();
				}
			},
			onDashboardRemove(event) {
				const dashboardId = event.dashboardId;
				if (this.isSaveEnabled && this.$store.getters.shouldShowDeleteWarning(dashboardId)) {
					this.deletionWarning.dashboardId = dashboardId;
					this.deletionWarning.popupShown = true;
				} else {
					this.$store.commit('removeDashboard', dashboardId);
					this.updateRight();
				}
			},
			confirmDashboardDeletion() {
				this.$store.commit('removeDashboard', this.deletionWarning.dashboardId);
				this.$refs.dashboardSelector.deselect(this.deletionWarning.dashboardId);
				this.deletionWarning.dashboardId = null;
				this.deletionWarning.popupShown = false;
				this.updateRight();
			},
			cancelDashboardDeletion() {
				this.$refs.dashboardSelector.resetDialog();
				this.deletionWarning.dashboardId = null;
				this.deletionWarning.popupShown = false;
			},
			saveGroup() {
				this.ensureNewGroupName();
				this.$store.commit('setIsLoading', true);
				main_core.ajax.runAction('biconnector.group.save', {
					data: {
						group: this.$store.getters.groupData,
						dashboards: [...this.$store.getters.dashboards.values()]
					}
				}).then(() => {
					this.$store.commit('setIsLoading', false);
					this.closePopup();
					main_core_events.EventEmitter.emit('BIConnector.GroupPopup:onGroupSaved', {
						group: main_core.Runtime.clone(this.$store.getters.groupData),
						dashboards: main_core.Runtime.clone(this.$store.getters.dashboards),
						isTitleEdited: this.$store.getters.isTitleEdited,
						isDashboardListEdited: this.$store.getters.isDashboardListEdited,
						isScopeListEdited: this.$store.getters.isScopeListEdited
					});
				}).catch(response => {
					ui_notification.Center.notify({
						content: biconnector_errorMessage.resolveErrorHtml(response, this.$Bitrix.Loc.getMessage('BI_GROUP_SAVE_ERROR'))
					});
					this.$store.commit('setIsLoading', false);
				});
			},
			ensureNewGroupName() {
				if (this.$store.getters.isNewGroup && !this.$store.getters.groupName) {
					this.$store.commit('setEmptyGroupName', this.$Bitrix.Loc.getMessage('BI_GROUP_NAME_NEW'));
				}
			},
			closePopup() {
				const popup = main_popup.PopupManager.getPopupById(GROUP_POPUP_ID);
				popup.close();
			},
			onGroupPopupClose() {
				main_core_events.EventEmitter.emit('BIConnector.GroupPopup:onPopupClose', {
					group: this.$store.getters.groupData,
					isTitleEdited: this.$store.getters.isTitleEdited,
					isDashboardListEdited: this.$store.getters.isDashboardListEdited,
					isScopeListEdited: this.$store.getters.isScopeListEdited
				});
			}
		},
		components: {
			BIcon: ui_iconSet_api_vue.BIcon,
			DashboardItem,
			DashboardSelector,
			GroupScopeSelector,
			TitleEditor,
			DeletionWarningPopup
		},
		template: `
		<div class="group-header">
			<TitleEditor @on-name-update="updateRight" :can-edit="!isSystemGroup"/>
			<div class="group-header-controls">
				<BIcon
					:name="set.CROSS_L"
					:size="20"
					color="var(--ui-color-base-4)"
					:class="'group-close'"
					data-testid="biconnector-dashboard-group-close"
					@click="closePopup"
				></BIcon>
			</div>
		</div>
		<div class="group-button-panel">
			<div class="group-button-wrapper">
				<DashboardSelector
					:dashboards="dashboards"
					@on-dashboards-change="updateRight"
					@on-before-remove-confirmation="handleDeletionConfirmationRequest"
					ref="dashboardSelector"
				/>
			</div>
			<GroupScopeSelector @on-group-scope-add="onGroupScopeAdd" @on-group-scope-remove="onGroupScopeRemove" :can-edit="!isSystemGroup"/>
		</div>
		<div class="group-dashboard-empty" v-if="isNoDashboards">
			<div class="group-dashboard-empty-image"></div>
			<div class="group-dashboard-empty-title">{{ $Bitrix.Loc.getMessage('BI_GROUP_EMPTY_TITLE') }}</div>
			<div class="group-dashboard-empty-subtitle">{{ $Bitrix.Loc.getMessage('BI_GROUP_EMPTY_SUBTITLE') }}</div>
		</div>
		<div class="group-dashboard-list" :class="{'group-dashboard-list-scroll': isDashboardListScrollable}" v-else>
			<DashboardItem
				v-for="dashboard of dashboards"
				:key="dashboard.id"
				ref="dashboardItem"
				:dashboard="dashboard"
				@on-dashboard-change="updateRight"
				@on-dashboard-remove="onDashboardRemove"
			/>
		</div>
		<div class="group-footer" v-if="isSaveEnabled">
			<div
				:class="['ui-btn --air ui-btn-lg --style-filled ui-btn-no-caps', {'ui-btn-disabled ui-btn-wait': isLoading}]" 
				@click="saveGroup"
			>
				{{ $Bitrix.Loc.getMessage('BI_GROUP_SAVE') }}
			</div>
			<div
				class="ui-btn --air ui-btn-lg --style-plain ui-btn-no-caps"
				@click="closePopup"
			>
				{{ $Bitrix.Loc.getMessage('BI_GROUP_SAVE_CANCEL_MSGVER_1') }}
			</div>
		</div>
		<div class="group-loader" v-if="isLoading"></div>
		<DeletionWarningPopup 
			v-if="deletionWarning.popupShown" 
			@confirm="confirmDashboardDeletion" 
			@close="cancelDashboardDeletion"
		/>
	`
	};

	class DashboardGroup {
		static open(appParams = {}) {
			// The popup is not cacheable, so it exists only while it is open.
			if (main_popup.PopupManager.isPopupExists(GROUP_POPUP_ID)) {
				return;
			}
			const app = this.getApp(appParams);
			const popup = new main_popup.Popup({
				id: GROUP_POPUP_ID,
				width: 800,
				height: 560,
				overlay: true,
				closeIcon: false,
				autoHide: true,
				padding: 0,
				cacheable: false,
				content: '<div id="app"></div>',
				events: {
					onPopupClose: () => {
						main_core_events.EventEmitter.emit('BIConnector.Internal.GroupPopup:onPopupClose');
						app.unmount();
					}
				}
			});
			popup.show();
			app.mount('#app');
		}
		static getApp(appParams = {}) {
			let group = appParams.groups.find(item => item.id === appParams.groupId);
			if (!group) {
				group = {
					id: 'new_G0',
					name: '',
					type: GroupType.custom,
					scopes: [],
					dashboardIds: []
				};
			}
			const state = {
				group,
				otherGroups: appParams.groups.filter(item => item.id !== appParams.groupId),
				dashboards: appParams.dashboards,
				saveEnabled: appParams.saveEnabled,
				isLoading: false,
				user: appParams.user
			};
			const app = ui_vue3.BitrixVue.createApp({
				name: 'GroupPopupApp',
				data() {
					return {};
				},
				components: {
					App
				},
				computed: {
					componentName() {
						return App;
					}
				},
				// language=Vue
				template: `
				<App/>
			`
			});
			const store = Store.buildStore(state);
			app.use(store);
			return app;
		}
	}

	exports.DashboardGroup = DashboardGroup;
	exports.GroupType = GroupType;

})(this.BX.BIConnector = this.BX.BIConnector || {}, BX.Event, BX.Main, BX.Vue3, BX, BX.Vue3.Vuex, BX.UI.IconSet, BX.UI.Notification, BX.BIConnector, BX.UI.EntitySelector, BX.UI.IconSet, BX.Vue3.Components, BX.Vue3.Directives);
//# sourceMappingURL=dashboard-group.bundle.js.map
