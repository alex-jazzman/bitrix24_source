import { defineComponent, type PropType } from 'ui.vue3';

import { type ColumnHead, GridColumn, Phrase, TestId, UndoSendPendingRowTestIdPrefix } from '../../const';
import { loc } from '../../lib/loc/loc';
import { type ProjectionRow as ProjectionRowData } from '../../model/grid/types';

/**
 * The class the checkbox of a row carries on its own input, and the mark that stops the screen from
 * marking the row by it (`row.js:1174`). The screen wrote the second onto the checkbox of this very
 * row itself (`list.es6.js:276`).
 */
const CheckboxClass = 'main-grid-row-checkbox';

/**
 * The row of a letter that is being sent and can still be called back. One record is drawn whichever
 * way it arrived - with the page of the list, or from the screen when the letter left the compose
 * form.
 *
 * The cells and the marks on the cell of the subject are the ones the screen drew before the new
 * grid: the screen finds the row by the number of the send (`list.es6.js:303`) and reads the moment
 * of its next ask for the list off the same node (`list.es6.js:334`).
 *
 * It is no message and answers as none: it may not be marked, holds no menu, and stands until a page
 * of the list says otherwise.
 */
// @vue/component
export const ProjectionRow = defineComponent({
	name: 'MailMessageGridProjectionRow',

	props: {
		row: {
			type: Object as PropType<ProjectionRowData>,
			required: true,
		},
		columns: {
			type: Array as PropType<ColumnHead[]>,
			required: true,
		},
	},

	setup()
	{
		return {
			checkboxClass: CheckboxClass,
			column: GridColumn,
			testId: TestId.ProjectionRow,
		};
	},

	computed: {
		/** Inherited letter for letter: the scenarios of the screen match the row by this one. */
		pendingTestId(): string
		{
			return `${UndoSendPendingRowTestIdPrefix}${this.row.operationId}`;
		},

		/** The checkbox carries no text, and this one is disabled rather than absent, as it was before. */
		selectLabel(): string
		{
			return loc(Phrase.RowSelect);
		},
	},

	template: `
		<tr class="main-grid-row main-grid-row-body" :data-id="row.id" :data-testid="testId">
			<td class="main-grid-cell main-grid-cell-checkbox">
				<span class="main-grid-cell-content">
					<input
						type="checkbox"
						disabled
						data-disabled="1"
						:class="checkboxClass"
						:aria-label="selectLabel"
					/>
				</span>
			</td>
			<td class="main-grid-cell main-grid-cell-action">
				<span class="main-grid-cell-content"></span>
			</td>
			<td
				v-for="head in columns"
				:key="head.id"
				class="main-grid-cell main-grid-cell-left"
				:data-column-id="head.id"
			>
				<div class="main-grid-cell-inner">
					<span class="main-grid-cell-content">
						<span
							v-if="head.id === column.From"
							class="mail-name-block mail-msg-list-cell-nowrap mail-msg-list-cell-flex"
						>
							<span class="mail-msg-from-title">{{ row.sender }}</span>
						</span>
						<span
							v-else-if="head.id === column.Subject"
							class="mail-title-block mail-msg-list-cell-flex"
							:data-testid="pendingTestId"
							:data-undo-send-id="row.operationId"
							:data-undo-send-refresh-at="row.refreshAt"
						>
							<span class="mail-msg-list-subject">{{ row.subject }}</span>
							<span class="mail-undo-send-pending-status"> &mdash; {{ row.status }}</span>
						</span>
						<span
							v-else-if="head.id === column.Date && row.date.short"
							:title="row.date.title"
						><span class="mail-msg-date-title">{{ row.date.short }}</span></span>
					</span>
				</div>
			</td>
			<td class="main-grid-cell"></td>
		</tr>
	`,
});
