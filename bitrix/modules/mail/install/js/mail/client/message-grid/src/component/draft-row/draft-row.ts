import { defineComponent, inject, type PropType } from 'ui.vue3';

import { type ColumnHead, DraftRowTestIdPrefix, GridColumn, gridSelectionKey, Phrase, TestId } from '../../const';
import { openDraft } from '../../feature/open-draft/open-draft';
import { loc } from '../../lib/loc/loc';
import { marksRow } from '../../lib/row-click/row-click';
import { useGridStore } from '../../model/grid/grid';
import { type DraftRow as DraftRowData } from '../../model/grid/types';
import { RowActions } from '../row-actions/row-actions';
import { RowCheckbox } from '../row-checkbox/row-checkbox';

/**
 * One row of the list of drafts: a draft names its recipients where a message names its sender,
 * carries the beginning of its body beside its subject and knows neither star nor bindings.
 *
 * The cells are the ones of the drafts and not the ones of the redesigned row of a message: the row
 * of a draft keeps its own typography and class names, and the look of the embedded list is written
 * against them (`class.php:1024`, `style.css:1524`). Hence the date drawn here rather than by the
 * cell a message uses.
 *
 * The draft is opened by the screen, the way the items of the menu of the row ask for it, so one
 * place knows the compose form. The row closes with the empty cell of a row of messages.
 */
// @vue/component
export const DraftRow = defineComponent({
	name: 'MailMessageGridDraftRow',

	components: {
		RowActions,
		RowCheckbox,
	},

	props: {
		row: {
			type: Object as PropType<DraftRowData>,
			required: true,
		},
		columns: {
			type: Array as PropType<ColumnHead[]>,
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
			attachIconTestId: TestId.AttachIcon,
			recipientsTestId: TestId.DraftRecipientsLink,
			subjectTestId: TestId.DraftSubjectLink,
		};
	},

	computed: {
		testId(): string
		{
			return `${DraftRowTestIdPrefix}${this.row.draftId}`;
		},

		selected(): boolean
		{
			return this.grid.selectedIdSet.has(this.row.id);
		},

		/** The names of everybody the draft is addressed to, in one line. */
		recipients(): string
		{
			return this.row.recipients.names.join(loc(Phrase.AddressSeparator));
		},

		noRecipients(): string
		{
			return loc(Phrase.DraftNoRecipients);
		},

		attachHint(): string
		{
			return loc(Phrase.AttachIconHint);
		},
	},

	methods: {
		handleClick(event: MouseEvent): void
		{
			if (marksRow(event))
			{
				this.selection?.toggleRow(this.row.id);
			}
		},

		handleOpen(): void
		{
			openDraft(this.row.draftId);
		},
	},

	template: `
		<tr
			class="main-grid-row main-grid-row-body"
			:class="{ 'main-grid-row-checked': selected }"
			:data-id="row.id"
			:data-draft-id="row.draftId"
			:data-testid="testId"
			@click="handleClick"
		>
			<td class="main-grid-cell main-grid-cell-checkbox">
				<span class="main-grid-cell-content"><RowCheckbox :rowId="row.id"/></span>
			</td>
			<td class="main-grid-cell main-grid-cell-action">
				<span class="main-grid-cell-content">
					<RowActions v-if="row.actions.length > 0" :rowId="row.id" :actions="row.actions"/>
				</span>
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
							<a class="mail-msg-from-title" :data-testid="recipientsTestId" @click="handleOpen"><span
								v-if="row.recipients.isEmpty"
								class="mail-draft-no-recipients"
							>{{ noRecipients }}</span><template v-else>{{ recipients }}</template></a>
						</span>
						<span
							v-else-if="head.id === column.Subject"
							class="mail-title-block mail-msg-list-cell-flex"
						>
							<a
								class="mail-msg-list-subject"
								:data-testid="subjectTestId"
								:title="row.subject"
								@click="handleOpen"
							>{{ row.subject }}</a>
							<span v-if="row.preview" class="mail-draft-body-preview"> &mdash; {{ row.preview }}</span>
							<span
								v-if="row.hasAttachments"
								class="mail-msg-list-attach-icon"
								role="img"
								:data-testid="attachIconTestId"
								:title="attachHint"
							></span>
						</span>
						<span v-else-if="head.id === column.Date" :title="row.date.title"><span
							class="mail-msg-date-title"
						>{{ row.date.short }}</span></span>
					</span>
				</div>
			</td>
			<td class="main-grid-cell"></td>
		</tr>
	`,
});
