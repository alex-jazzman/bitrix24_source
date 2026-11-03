/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, main_core_events, main_popup, ui_vue3, ui_vue3_vuex, biconnector_errorMessage, ui_iconSet_api_vue, ui_notification, ui_iconSet_outline, ui_vue3_components_button, ui_entitySelector, ui_vue3_directives_hint) {
	'use strict';

	const TableGroupType = Object.freeze({
		system: 'SYSTEM',
		custom: 'CUSTOM'
	});
	const TableType = Object.freeze({
		system: 'SYSTEM',
		custom: 'CUSTOM'
	});
	const TABLE_GROUP_POPUP_ID = 'biconnector-table-group';
	const TableGroupPopupEvent = Object.freeze({
		GroupUpdated: 'BIConnector.TableGroupPopup:onGroupUpdated',
		GroupSaved: 'BIConnector.TableGroupPopup:onGroupSaved',
		PopupClose: 'BIConnector.TableGroupPopup:onPopupClose'
	});

	const NEW_GROUP_ID_PREFIX = 'new_';
	const areSetsEqual = (setA, setB) => {
		if (setA.size !== setB.size) {
			return false;
		}
		for (const item of setA) {
			if (!setB.has(item)) {
				return false;
			}
		}
		return true;
	};
	class Store {
		static initialGroup;
		static buildStore(defaultValues) {
			Store.initialGroup = main_core.Runtime.clone(defaultValues.group);
			return ui_vue3_vuex.createStore({
				state() {
					return defaultValues;
				},
				mutations: {
					setGroupName(state, groupName) {
						state.group.name = groupName.trim();
					},
					setEmptyGroupName(state, groupName) {
						state.group.name = groupName;
						Store.initialGroup.name = groupName;
					},
					addTable(state, tableCode) {
						if (state.group.tableCodes.includes(tableCode)) {
							return;
						}
						state.group.tableCodes.unshift(tableCode);
					},
					removeTable(state, tableCode) {
						state.group.tableCodes = state.group.tableCodes.filter(code => code !== tableCode);
					}
				},
				getters: {
					groupName(state) {
						return state.group.name;
					},
					isSystemGroup(state) {
						return state.group.type === TableGroupType.system;
					},
					isSaveEnabled(state) {
						return state.saveEnabled === true;
					},
					isNewGroup(state) {
						return String(state.group.id ?? '').startsWith(NEW_GROUP_ID_PREFIX);
					},
					groupTableCodes(state) {
						return state.group.tableCodes;
					},
					groupTables(state) {
						return state.group.tableCodes.map(code => state.tables.get(code)).filter(table => table !== undefined);
					},
					isOnlyGroupOfTable(state) {
						return tableCode => !state.otherGroups.some(group => group.tableCodes.includes(tableCode));
					},
					tablesLeftWithoutGroup(state, getters) {
						return Store.initialGroup.tableCodes.filter(code => !state.group.tableCodes.includes(code) && getters.isOnlyGroupOfTable(code));
					},
					groupData(state) {
						return {
							id: state.group.id,
							name: state.group.name,
							type: state.group.type,
							tableCodes: state.group.tableCodes
						};
					},
					isTitleEdited(state) {
						return state.group.name !== Store.initialGroup.name;
					},
					isTableListEdited(state) {
						return !areSetsEqual(new Set(Store.initialGroup.tableCodes), new Set(state.group.tableCodes));
					}
				}
			});
		}
	}

	const SYSTEM_TABLE_ICON_PATH = '/bitrix/images/biconnector/database-connections/system.svg';
	const CUSTOM_TABLE_ICON_PATH = '/bitrix/images/biconnector/superset-dashboard-selector/icon-type-custom.webp';
	const getTableIconPath = tableType => {
		return tableType === TableType.custom ? CUSTOM_TABLE_ICON_PATH : SYSTEM_TABLE_ICON_PATH;
	};
	const getTableLabel = table => {
		return `${table.name} (${table.code})`;
	};

	const TableItem = {
		name: 'BIConnectorTableGroupTableItem',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon
		},
		props: {
			table: {
				type: Object,
				required: true
			}
		},
		emits: ['onTableRemove'],
		computed: {
			iconSet() {
				return ui_iconSet_api_vue.Outline;
			},
			iconPath() {
				return getTableIconPath(this.table.type);
			},
			label() {
				return getTableLabel(this.table);
			}
		},
		methods: {
			handleRemoveClick() {
				this.$emit('onTableRemove', {
					code: this.table.code
				});
			}
		},
		template: `
		<div class="biconnector-table-group-item">
			<img
				class="biconnector-table-group-item__icon"
				:src="iconPath"
				width="32"
				height="32"
				alt=""
			>
			<div class="biconnector-table-group-item__name" :title="label">{{ label }}</div>
			<BIcon
				:name="iconSet.CROSS_L"
				:size="20"
				color="var(--ui-color-base-4)"
				class="biconnector-table-group-item__remove"
				@click="handleRemoveClick"
			/>
		</div>
	`
	};

	const TABLE_ENTITY_ID = 'biconnector-table';
	const TableSelector = {
		name: 'BIConnectorTableGroupTableSelector',
		components: {
			UiButton: ui_vue3_components_button.Button
		},
		props: {
			tables: {
				type: Array,
				required: true
			}
		},
		emits: ['onTablesChange', 'onTableDeselect'],
		setup() {
			return {
				AirButtonStyle: ui_vue3_components_button.AirButtonStyle,
				ButtonIcon: ui_vue3_components_button.ButtonIcon,
				ButtonSize: ui_vue3_components_button.ButtonSize
			};
		},
		data() {
			return {
				bypassDeselectHandler: false
			};
		},
		created() {
			this.dialog = null;
		},
		mounted() {
			this.initDialog();
		},
		beforeUnmount() {
			this.dialog?.destroy();
		},
		methods: {
			initDialog() {
				const groupTableCodes = new Set(this.$store.getters.groupTableCodes);
				this.dialog = new ui_entitySelector.Dialog({
					id: 'biconnector-table-group-selector',
					targetNode: this.$refs.addTableButton,
					width: 400,
					height: 370,
					dropdownMode: true,
					enableSearch: true,
					entities: [{
						id: TABLE_ENTITY_ID,
						dynamicLoad: false,
						dynamicSearch: false
					}],
					items: this.tables.map(table => ({
						id: table.code,
						entityId: TABLE_ENTITY_ID,
						tabs: 'recents',
						title: getTableLabel(table),
						avatar: getTableIconPath(table.type),
						avatarOptions: {
							bgSize: 'contain'
						},
						selected: groupTableCodes.has(table.code)
					})),
					events: {
						'Item:onSelect': event => {
							const item = event.getData().item;
							this.$store.commit('addTable', item.getId());
							this.$emit('onTablesChange');
						},
						'Item:onDeselect': event => {
							if (this.bypassDeselectHandler) {
								return;
							}
							const item = event.getData().item;
							this.$store.commit('removeTable', item.getId());
							this.$emit('onTableDeselect', {
								code: item.getId()
							});
							this.$emit('onTablesChange');
						}
					}
				});
			},
			handleAddClick() {
				this.dialog.show();
			},
			deselect(tableCode) {
				this.bypassDeselectHandler = true;
				this.dialog?.getItem({
					entityId: TABLE_ENTITY_ID,
					id: tableCode
				})?.deselect();
				this.bypassDeselectHandler = false;
			}
		},
		template: `
		<div class="biconnector-table-group__add-table" ref="addTableButton">
			<UiButton
				:text="$Bitrix.Loc.getMessage('BI_TABLE_GROUP_ADD_TABLE')"
				:size="ButtonSize.MEDIUM"
				:style="AirButtonStyle.TINTED"
				:leftIcon="ButtonIcon.ADD"
				@click="handleAddClick"
			/>
		</div>
	`
	};

	const TitleEditor = {
		name: 'BIConnectorTableGroupTitleEditor',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon
		},
		directives: {
			hint: ui_vue3_directives_hint.hint
		},
		props: {
			canEdit: {
				type: Boolean,
				required: true
			}
		},
		emits: ['onNameUpdate'],
		data() {
			return {
				editMode: false,
				nameBeforeEdit: ''
			};
		},
		computed: {
			groupName() {
				return this.$store.getters.groupName;
			},
			isNewGroup() {
				return this.$store.getters.isNewGroup;
			},
			namePlaceholder() {
				return this.isNewGroup ? this.$Bitrix.Loc.getMessage('BI_TABLE_GROUP_NAME_NEW') : '';
			},
			displayedName() {
				return this.groupName || this.namePlaceholder;
			},
			iconSet() {
				return ui_iconSet_api_vue.Outline;
			},
			systemNameHint() {
				return {
					text: this.$Bitrix.Loc.getMessage('BI_TABLE_GROUP_SYSTEM_NAME_HINT'),
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
			handleNameInput(event) {
				this.$store.commit('setGroupName', event.target.value);
			},
			setEditMode() {
				this.nameBeforeEdit = this.groupName;
				this.editMode = true;
				this.$nextTick(() => {
					this.$refs.nameInput.focus();
				});
			},
			setViewMode() {
				if (!this.editMode) {
					return;
				}
				this.editMode = false;
				if (this.groupName === '') {
					this.restoreName();
				}
				if (this.groupName !== this.nameBeforeEdit) {
					this.$emit('onNameUpdate');
				}
			},
			restoreName() {
				if (this.nameBeforeEdit === '') {
					this.$store.commit('setEmptyGroupName', this.$Bitrix.Loc.getMessage('BI_TABLE_GROUP_NAME_NEW'));
					return;
				}
				this.$store.commit('setGroupName', this.nameBeforeEdit);
			}
		},
		template: `
		<div class="biconnector-table-group-title-editor">
			<template v-if="canEdit">
				<input
					v-if="editMode"
					class="biconnector-table-group-title-editor__input"
					ref="nameInput"
					:value="groupName"
					:placeholder="namePlaceholder"
					@input="handleNameInput"
					@blur="setViewMode"
					@keyup.enter="setViewMode"
				>
				<template v-else>
					<div class="biconnector-table-group-title-editor__name">{{ displayedName }}</div>
					<BIcon
						:name="iconSet.EDIT_L"
						:size="20"
						color="var(--ui-color-base-4)"
						class="biconnector-table-group-title-editor__edit-icon"
						@click="setEditMode"
					/>
				</template>
			</template>
			<div class="biconnector-table-group-title-editor__name" v-hint="systemNameHint" v-else>
				{{ displayedName }}
			</div>
		</div>
	`
	};

	const SCROLL_FROM_ROW = 8;
	const SCROLL_FROM_ROW_WITH_FOOTER = SCROLL_FROM_ROW - 1;
	const App = {
		name: 'BIConnectorTableGroupApp',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon,
			TableItem,
			TableSelector,
			TitleEditor,
			UiButton: ui_vue3_components_button.Button
		},
		setup() {
			return {
				AirButtonStyle: ui_vue3_components_button.AirButtonStyle,
				ButtonSize: ui_vue3_components_button.ButtonSize
			};
		},
		data() {
			return {
				isSaving: false
			};
		},
		computed: {
			tables() {
				return this.$store.getters.groupTables;
			},
			tableCatalog() {
				return [...this.$store.state.tables.values()];
			},
			isSystemGroup() {
				return this.$store.getters.isSystemGroup;
			},
			isGroupEmpty() {
				return this.tables.length === 0;
			},
			isSaveEnabled() {
				return this.$store.getters.isSaveEnabled;
			},
			tablesLeftWithoutGroup() {
				return this.$store.getters.tablesLeftWithoutGroup;
			},
			isSaveBlocked() {
				return this.isSaveEnabled && this.tablesLeftWithoutGroup.length > 0;
			},
			lastGroupWarningPhraseId() {
				return this.isSaveEnabled ? 'BI_TABLE_GROUP_LAST_GROUP_BLOCKS_SAVE' : 'BI_TABLE_GROUP_LAST_GROUP_WARNING';
			},
			isTableListScrollable() {
				return this.tables.length >= (this.isSaveEnabled ? SCROLL_FROM_ROW_WITH_FOOTER : SCROLL_FROM_ROW);
			},
			iconSet() {
				return ui_iconSet_api_vue.Outline;
			}
		},
		methods: {
			updateGroup() {
				if (this.isSaveEnabled) {
					return;
				}
				main_core_events.EventEmitter.emit(TableGroupPopupEvent.GroupUpdated, {
					group: main_core.Runtime.clone(this.$store.getters.groupData)
				});
			},
			saveGroup() {
				this.ensureNewGroupName();
				this.isSaving = true;
				main_core.ajax.runAction('biconnector.TableGroup.save', {
					data: {
						group: {
							id: this.$store.getters.groupData.id,
							name: this.$store.getters.groupName
						},
						tableCodes: [...this.$store.getters.groupTableCodes]
					}
				}).then(() => {
					this.isSaving = false;
					this.closePopup();
					main_core_events.EventEmitter.emit(TableGroupPopupEvent.GroupSaved, {
						group: main_core.Runtime.clone(this.$store.getters.groupData),
						isTitleEdited: this.$store.getters.isTitleEdited,
						isTableListEdited: this.$store.getters.isTableListEdited
					});
				}).catch(response => {
					this.isSaving = false;
					ui_notification.Center.notify({
						content: biconnector_errorMessage.resolveErrorHtml(response, this.$Bitrix.Loc.getMessage('BI_TABLE_GROUP_SAVE_ERROR'))
					});
				});
			},
			ensureNewGroupName() {
				if (this.$store.getters.isNewGroup && !this.$store.getters.groupName) {
					this.$store.commit('setEmptyGroupName', this.$Bitrix.Loc.getMessage('BI_TABLE_GROUP_NAME_NEW'));
				}
			},
			handleTableRemove(event) {
				this.removeTable(event.code);
				this.warnIfTableLeftEveryGroup(event.code);
			},
			handleTableDeselect(event) {
				this.warnIfTableLeftEveryGroup(event.code);
			},
			warnIfTableLeftEveryGroup(tableCode) {
				if (this.tablesLeftWithoutGroup.includes(tableCode)) {
					this.notifyTableLeftEveryGroup(tableCode);
				}
			},
			notifyTableLeftEveryGroup(tableCode) {
				const table = this.$store.state.tables.get(tableCode);
				ui_notification.Center.notify({
					content: main_core.Text.encode(this.$Bitrix.Loc.getMessage(this.lastGroupWarningPhraseId, {
						'#TABLE#': table ? getTableLabel(table) : tableCode
					}))
				});
			},
			removeTable(tableCode) {
				this.$store.commit('removeTable', tableCode);
				this.$refs.tableSelector.deselect(tableCode);
				this.updateGroup();
			},
			closePopup() {
				main_popup.PopupManager.getPopupById(TABLE_GROUP_POPUP_ID)?.close();
			}
		},
		template: `
		<div class="biconnector-table-group__header">
			<TitleEditor :can-edit="!isSystemGroup" @on-name-update="updateGroup"/>
			<div class="biconnector-table-group__header-controls">
				<BIcon
					:name="iconSet.CROSS_L"
					:size="20"
					color="var(--ui-color-base-4)"
					class="biconnector-table-group__close"
					@click="closePopup"
				/>
			</div>
		</div>
		<div class="biconnector-table-group__panel">
			<TableSelector
				:tables="tableCatalog"
				ref="tableSelector"
				@on-table-deselect="handleTableDeselect"
				@on-tables-change="updateGroup"
			/>
		</div>
		<div class="biconnector-table-group__empty" v-if="isGroupEmpty">
			<div class="biconnector-table-group__empty-image"></div>
			<div class="biconnector-table-group__empty-title">
				{{ $Bitrix.Loc.getMessage('BI_TABLE_GROUP_EMPTY_TITLE') }}
			</div>
			<div class="biconnector-table-group__empty-subtitle">
				{{ $Bitrix.Loc.getMessage('BI_TABLE_GROUP_EMPTY_SUBTITLE') }}
			</div>
		</div>
		<div class="biconnector-table-group__list" :class="{ '--scrollable': isTableListScrollable }" v-else>
			<TableItem
				v-for="table of tables"
				:key="table.code"
				:table="table"
				@on-table-remove="handleTableRemove"
			/>
		</div>
		<div class="biconnector-table-group__footer" v-if="isSaveEnabled">
			<UiButton
				:text="$Bitrix.Loc.getMessage('BI_TABLE_GROUP_SAVE')"
				:size="ButtonSize.LARGE"
				:style="AirButtonStyle.FILLED"
				:loading="isSaving"
				:disabled="isSaveBlocked"
				@click="saveGroup"
			/>
			<UiButton
				:text="$Bitrix.Loc.getMessage('BI_TABLE_GROUP_SAVE_CANCEL')"
				:size="ButtonSize.LARGE"
				:style="AirButtonStyle.PLAIN"
				@click="closePopup"
			/>
		</div>
	`
	};

	const NEW_GROUP_ID = 'new_T0';
	const POPUP_CLASS = 'biconnector-table-group-popup';
	const buildState = appParams => {
		const group = appParams.groups.find(item => item.id === appParams.groupId) ?? {
			id: NEW_GROUP_ID,
			name: '',
			type: TableGroupType.custom,
			tableCodes: []
		};
		return {
			group,
			otherGroups: appParams.groups.filter(item => item.id !== group.id),
			tables: new Map(appParams.tables.map(table => [table.code, table])),
			saveEnabled: appParams.saveEnabled === true
		};
	};
	class TableGroupPopup {
		static open(appParams) {
			const store = Store.buildStore(buildState(appParams));
			const app = ui_vue3.BitrixVue.createApp(App);
			app.use(store);
			const container = main_core.Tag.render`
			<div class="biconnector-table-group --ui-context-content-light"></div>
		`;
			const popup = new main_popup.Popup({
				id: TABLE_GROUP_POPUP_ID,
				className: POPUP_CLASS,
				width: 800,
				height: 560,
				overlay: true,
				closeIcon: false,
				autoHide: true,
				padding: 0,
				cacheable: false,
				content: container,
				events: {
					onPopupClose: () => {
						main_core_events.EventEmitter.emit(TableGroupPopupEvent.PopupClose, {
							group: store.getters.groupData,
							isTitleEdited: store.getters.isTitleEdited,
							isTableListEdited: store.getters.isTableListEdited
						});
						app.unmount();
					}
				}
			});
			popup.show();
			app.mount(container);
		}
	}

	exports.TableGroupPopup = TableGroupPopup;
	exports.TableGroupType = TableGroupType;

})(this.BX.BIConnector = this.BX.BIConnector || {}, BX, BX.Event, BX.Main, BX.Vue3, BX.Vue3.Vuex, BX.BIConnector, BX.UI.IconSet, BX.UI.Notification, window, BX.Vue3.Components, BX.UI.EntitySelector, BX.Vue3.Directives);
//# sourceMappingURL=table-group.bundle.js.map
