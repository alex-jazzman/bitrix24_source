import { defineComponent, inject, type PropType } from 'ui.vue3';

import { type ColumnHead, GridColumn, gridSelectionKey } from '../../const';
import { lockDangerousActions } from '../../feature/migration-lock/migration-lock';
import { isFavoriteOffered } from '../../lib/favorite/favorite';
import { marksRow } from '../../lib/row-click/row-click';
import { useGridStore } from '../../model/grid/grid';
import { type MessageRow as MessageRowData, type RowAction, type RowBinding } from '../../model/grid/types';
import { BindingCell } from '../binding-cell/binding-cell';
import { DateCell } from '../date-cell/date-cell';
import { FavoriteStar } from '../favorite-star/favorite-star';
import { RowActions } from '../row-actions/row-actions';
import { RowCheckbox } from '../row-checkbox/row-checkbox';
import { SenderCell } from '../sender-cell/sender-cell';
import { SubjectCell } from '../subject-cell/subject-cell';

/**
 * One row of the list of messages.
 *
 * The cells follow the columns of the head rather than the order the record lists them in - the
 * placeholders of the bindings arrive in an order of their own and are placed by the name of their
 * column.
 *
 * `unseen` and `new-message` are attributes rather than classes because the styles of the screen are
 * written against attributes. `data-mailbox-id` is the likeness of the row the server drew
 * (`class.php:1664`) and is read by nobody: the screen asks the row itself, and the facade answers
 * off the record (`grid-row-facade.ts`).
 *
 * The row closes with an empty cell under the filler column, the way the template of the platform
 * grid closes its rows (`template.php:690`): without it the last named column would take the
 * rounding of the top right corner.
 */
// @vue/component
export const MessageRow = defineComponent({
	name: 'MailMessageGridMessageRow',

	components: {
		BindingCell,
		DateCell,
		FavoriteStar,
		RowActions,
		RowCheckbox,
		SenderCell,
		SubjectCell,
	},

	props: {
		row: {
			type: Object as PropType<MessageRowData>,
			required: true,
		},
		columns: {
			type: Array as PropType<ColumnHead[]>,
			required: true,
		},
		listImprovementsEnabled: {
			type: Boolean,
			required: true,
		},
	},

	setup()
	{
		// resolved through the application this component belongs to, so each grid reads its own state
		return {
			grid: useGridStore(),
			selection: inject(gridSelectionKey),
			column: GridColumn,
		};
	},

	computed: {
		/** Placeholders by the name of their column, so a cell asks for its own and nothing else. */
		bindings(): Record<string, RowBinding>
		{
			const map: Record<string, RowBinding> = {};

			this.row.bindings.forEach((binding: RowBinding): void => {
				map[binding.column] = binding;
			});

			return map;
		},

		starOffered(): boolean
		{
			return isFavoriteOffered(this.row.favoriteAvailable, this.listImprovementsEnabled);
		},

		selected(): boolean
		{
			return this.grid.selectedIdSet.has(this.row.id);
		},

		/**
		 * The screen has acted on this row and waits for the server: the row is drawn and not shown, so
		 * that the screen can go on asking the grid about it while the request is in flight.
		 */
		hidden(): boolean
		{
			return this.grid.hiddenIds.includes(this.row.id);
		},

		/** The class is the mark the scenarios of the move find a locked row by (`messagegrid.js:93`). */
		migrationLocked(): boolean
		{
			return this.grid.migrationLockedMailboxIdSet.has(this.row.mailboxId);
		},

		/** The menu of the row, with what the move refuses taken out of reach while it lasts. */
		actions(): RowAction[]
		{
			return this.migrationLocked ? lockDangerousActions(this.row.actions) : this.row.actions;
		},
	},

	methods: {
		/**
		 * The cell of a binding is keyed by what the binding is and not by the column it stands in. Its
		 * placeholder belongs to `mail.client.binding`, which replaces the node with a button of its own
		 * (`binding.js:66`) and looks for placeholders by a class that button does not carry
		 * (`binding.js:88`). The identifier of a row outlives a request, so without a key of its own a
		 * reload bringing the same rows back would leave the button built for the previous answer.
		 */
		cellKey(head: ColumnHead): string
		{
			const binding = this.bindings[head.id];

			if (!binding)
			{
				return head.id;
			}

			return [
				head.id,
				binding.bindId,
				binding.bindHref,
				binding.createHref,
				binding.errorType,
			].join('|');
		},

		/**
		 * A click anywhere in the row marks it, the way it did in the platform grid - the controls of the
		 * row excepted. The click travels on: above the grid it is what closes the open popups.
		 */
		handleClick(event: MouseEvent): void
		{
			if (marksRow(event))
			{
				this.selection?.toggleRow(this.row.id);
			}
		},
	},

	template: `
		<tr
			class="main-grid-row main-grid-row-body"
			:class="{ 'main-grid-row-checked': selected, 'js-migration-disabled': migrationLocked }"
			:data-id="row.id"
			:data-mailbox-id="row.mailboxId"
			:unseen="row.unseen ? 'true' : 'false'"
			:new-message="row.isNew ? 'true' : 'false'"
			:style="hidden ? { display: 'none' } : null"
			@click="handleClick"
		>
			<td class="main-grid-cell main-grid-cell-checkbox">
				<span class="main-grid-cell-content"><RowCheckbox :rowId="row.id"/></span>
			</td>
			<td class="main-grid-cell main-grid-cell-action">
				<span class="main-grid-cell-content">
					<RowActions v-if="actions.length > 0" :rowId="row.id" :actions="actions"/>
				</span>
			</td>
			<td
				v-for="head in columns"
				:key="cellKey(head)"
				class="main-grid-cell main-grid-cell-left"
				:data-column-id="head.id"
			>
				<div class="main-grid-cell-inner">
					<span class="main-grid-cell-content">
						<span v-if="head.id === column.Favorite" class="mail-msg-list-status">
							<FavoriteStar v-if="starOffered" :rowId="row.id" :isFavorite="row.isFavorite"/>
						</span>
						<SenderCell v-else-if="head.id === column.From" :row="row"/>
						<SubjectCell
							v-else-if="head.id === column.Subject"
							:row="row"
							:listImprovementsEnabled="listImprovementsEnabled"
						/>
						<DateCell
							v-else-if="head.id === column.Date"
							:date="row.date"
							:rowId="row.id"
							:unseen="row.unseen"
						/>
						<BindingCell
							v-else-if="bindings[head.id]"
							:binding="bindings[head.id]"
							:rowId="row.id"
							:messageId="row.messageId"
						/>
					</span>
				</div>
			</td>
			<td class="main-grid-cell"></td>
		</tr>
	`,
});
