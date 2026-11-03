import { resolveErrorHtml } from 'biconnector.error-message';
import { ajax as Ajax, Runtime, Text } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { PopupManager } from 'main.popup';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import { Center as NotificationCenter } from 'ui.notification';
// The glyphs of the outline set live in their own CSS extension: the api gives the names, not the drawings.
import 'ui.icon-set.outline';
import type { BitrixVueComponentProps } from 'ui.vue3';
import { AirButtonStyle, Button as UiButton, ButtonSize } from 'ui.vue3.components.button';
import { TableItem } from '../component/table-item/table-item';
import { TableSelector } from '../component/table-selector/table-selector';
import { TitleEditor } from '../component/title-editor/title-editor';
import { TABLE_GROUP_POPUP_ID, type Table, TableGroupPopupEvent } from '../const/type';
import { getTableLabel } from '../const/table-view';

import './app.css';

const SCROLL_FROM_ROW = 8;
// The footer takes a row of the list away from the popup of the same height.
const SCROLL_FROM_ROW_WITH_FOOTER = SCROLL_FROM_ROW - 1;

export const App: BitrixVueComponentProps = {
	name: 'BIConnectorTableGroupApp',
	components: {
		BIcon,
		TableItem,
		TableSelector,
		TitleEditor,
		UiButton,
	},
	setup(): Object
	{
		return { AirButtonStyle, ButtonSize };
	},
	data(): Object
	{
		return {
			isSaving: false,
		};
	},
	computed: {
		tables(): Table[]
		{
			return this.$store.getters.groupTables;
		},
		tableCatalog(): Table[]
		{
			return [...this.$store.state.tables.values()];
		},
		isSystemGroup(): boolean
		{
			return this.$store.getters.isSystemGroup;
		},
		isGroupEmpty(): boolean
		{
			return this.tables.length === 0;
		},
		isSaveEnabled(): boolean
		{
			return this.$store.getters.isSaveEnabled;
		},
		tablesLeftWithoutGroup(): string[]
		{
			return this.$store.getters.tablesLeftWithoutGroup;
		},
		/**
		 * Whether the save of the group is held back.
		 *
		 * The rule of the refusal lives in this one place: for now it is the one the section of the grid
		 * was asked for - a table of the group is not left out of every group - and the save of the
		 * group on the server speaks the final word on it.
		 */
		isSaveBlocked(): boolean
		{
			return this.isSaveEnabled && this.tablesLeftWithoutGroup.length > 0;
		},
		/**
		 * The loss the warning speaks of is not the same one on the two screens the popup serves: the
		 * matrix of the rights loses the rights of the table, the section of the grid - the save of the
		 * group itself.
		 */
		lastGroupWarningPhraseId(): string
		{
			return this.isSaveEnabled
				? 'BI_TABLE_GROUP_LAST_GROUP_BLOCKS_SAVE'
				: 'BI_TABLE_GROUP_LAST_GROUP_WARNING'
			;
		},
		isTableListScrollable(): boolean
		{
			return this.tables.length >= (this.isSaveEnabled ? SCROLL_FROM_ROW_WITH_FOOTER : SCROLL_FROM_ROW);
		},
		iconSet(): typeof Outline
		{
			return Outline;
		},
	},
	methods: {
		updateGroup(): void
		{
			// The popup with a button of its own keeps the changes to itself until the button is pressed;
			// without it every change is what the page outside writes by.
			if (this.isSaveEnabled)
			{
				return;
			}

			EventEmitter.emit(TableGroupPopupEvent.GroupUpdated, {
				group: Runtime.clone(this.$store.getters.groupData),
			});
		},
		saveGroup(): void
		{
			this.ensureNewGroupName();
			this.isSaving = true;

			Ajax.runAction('biconnector.TableGroup.save', {
				data: {
					group: {
						id: this.$store.getters.groupData.id,
						name: this.$store.getters.groupName,
					},
					tableCodes: [...this.$store.getters.groupTableCodes],
				},
			})
				.then(() => {
					this.isSaving = false;
					this.closePopup();
					EventEmitter.emit(TableGroupPopupEvent.GroupSaved, {
						group: Runtime.clone(this.$store.getters.groupData),
						isTitleEdited: this.$store.getters.isTitleEdited,
						isTableListEdited: this.$store.getters.isTableListEdited,
					});
				})
				.catch((response: Object) => {
					// The composition just built lives in the popup alone: a refusal of the service
					// leaves it open with everything in place.
					this.isSaving = false;
					NotificationCenter.notify({
						content: resolveErrorHtml(
							response,
							this.$Bitrix.Loc.getMessage('BI_TABLE_GROUP_SAVE_ERROR'),
						),
					});
				})
			;
		},
		ensureNewGroupName(): void
		{
			// A group with no name at all is refused by the server: the one nobody renamed is saved
			// under the name its row shows as a placeholder.
			if (this.$store.getters.isNewGroup && !this.$store.getters.groupName)
			{
				this.$store.commit('setEmptyGroupName', this.$Bitrix.Loc.getMessage('BI_TABLE_GROUP_NAME_NEW'));
			}
		},
		handleTableRemove(event: { code: string }): void
		{
			this.removeTable(event.code);
			this.warnIfTableLeftEveryGroup(event.code);
		},
		handleTableDeselect(event: { code: string }): void
		{
			this.warnIfTableLeftEveryGroup(event.code);
		},
		/**
		 * Both ways out of the group - the cross of the row and the mark of the dialog - answer to the
		 * rule the save button answers to, so the warning never speaks where the button stays silent.
		 */
		warnIfTableLeftEveryGroup(tableCode: string): void
		{
			if (this.tablesLeftWithoutGroup.includes(tableCode))
			{
				this.notifyTableLeftEveryGroup(tableCode);
			}
		},
		notifyTableLeftEveryGroup(tableCode: string): void
		{
			const table: Table | void = this.$store.state.tables.get(tableCode);

			NotificationCenter.notify({
				content: Text.encode(this.$Bitrix.Loc.getMessage(this.lastGroupWarningPhraseId, {
					'#TABLE#': table ? getTableLabel(table) : tableCode,
				})),
			});
		},
		removeTable(tableCode: string): void
		{
			this.$store.commit('removeTable', tableCode);
			this.$refs.tableSelector.deselect(tableCode);
			this.updateGroup();
		},
		closePopup(): void
		{
			PopupManager.getPopupById(TABLE_GROUP_POPUP_ID)?.close();
		},
	},
	// language=Vue
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
	`,
};
