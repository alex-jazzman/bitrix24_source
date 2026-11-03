import { defineComponent, type PropType } from 'ui.vue3';

import { type ColumnHead, GridMode, type GridModeValue, Phrase, TestId } from '../../const';
import { TableFader } from '../../feature/table-fader/table-fader';
import { TableStretcher } from '../../feature/table-stretcher/table-stretcher';
import { resolveColumns } from '../../lib/column/column';
import { loc } from '../../lib/loc/loc';
import { useGridStore } from '../../model/grid/grid';
import {
	type DraftRow as DraftRowData,
	type MessageRow as MessageRowData,
	type ProjectionRow as ProjectionRowData,
} from '../../model/grid/types';
import { DraftRow } from '../draft-row/draft-row';
import { EmptyStub } from '../empty-stub/empty-stub';
import { MessageRow } from '../message-row/message-row';
import { MoreButton } from '../more-button/more-button';
import { ProjectionRow } from '../projection-row/projection-row';

/**
 * What an empty table says. Whichever of the words it is, it is said in the cell of the one empty
 * row: the cell is what gives the word the white backing and the rounded top of the first row.
 */
const EmptyRow = Object.freeze({
	None: 'none',
	Plain: 'plain',
	Draft: 'draft',
	Stub: 'stub',
} as const);

/**
 * Columns without a name of their own: the selection control and the menu open every row, and one
 * more closes the head. The empty row spans them along with the named ones.
 */
const ServiceColumns = 3;

/**
 * The table of the list: the head that holds the widths of the columns, and a row per record.
 *
 * The head carries no visible text - the screen gives every column a width and hides its name - but
 * is still drawn, because the widths are written against the classes of its cells. Two service cells
 * open every row before the named columns: the selection control and the menu of the row.
 *
 * The foot below the table stands whether or not it draws anything, as it does in the platform grid:
 * a foot that draws nothing hands the bottom of the grid back to the table through its own class.
 */
// @vue/component
export const GridTable = defineComponent({
	name: 'MailMessageGridTable',

	components: {
		DraftRow,
		EmptyStub,
		MessageRow,
		MoreButton,
		ProjectionRow,
	},

	props: {
		mode: {
			type: String as PropType<GridModeValue>,
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
			// one per table, and kept outside the reactive state: a proxy of it would lose its own fields
			fader: new TableFader(),
			stretcher: new TableStretcher(),
			tableTestId: TestId.Table,
			emptyRowTestId: TestId.EmptyRow,
			draftEmptyTestId: TestId.DraftEmpty,
		};
	},

	computed: {
		columns(): ColumnHead[]
		{
			return resolveColumns(this.mode, this.listImprovementsEnabled);
		},

		/**
		 * The rows of one of the two lists; the other getter answers empty. A grid draws the list it was
		 * started for and never both.
		 */
		messageRows(): MessageRowData[]
		{
			return this.grid.messageRows;
		},

		draftRows(): DraftRowData[]
		{
			return this.grid.draftRows;
		},

		/**
		 * Rows the screen put in front of the loaded ones: first in the table and above the word of an
		 * empty list, which is where the screen asked for them (`list.es6.js:270`).
		 */
		projectionRows(): ProjectionRowData[]
		{
			return this.grid.projections;
		},

		/**
		 * An empty list of drafts says its own word; an empty list of messages says the word of the
		 * module where the screen armed it, and the plain word of the platform everywhere else.
		 */
		emptyRow(): string
		{
			if (!this.grid.isEmpty)
			{
				return EmptyRow.None;
			}

			if (this.mode === GridMode.Draft)
			{
				return this.grid.total === 0 ? EmptyRow.Draft : EmptyRow.None;
			}

			return this.grid.stubArmed ? EmptyRow.Stub : EmptyRow.Plain;
		},

		emptyRowDrawn(): boolean
		{
			return this.emptyRow !== EmptyRow.None;
		},

		/**
		 * Read off the page rather than off the screen: the filter reloads the list without reloading
		 * the screen, so a word taken once at mounting would outlive the state it was taken from.
		 */
		emptyText(): string
		{
			return loc(this.grid.filterApplied ? Phrase.NoDataFiltered : Phrase.NoData);
		},

		draftEmptyText(): string
		{
			return loc(Phrase.DraftEmpty);
		},

		emptyColspan(): number
		{
			return this.columns.length + ServiceColumns;
		},
	},

	mounted(): void
	{
		this.fader.start({
			fade: this.$refs.fade as HTMLElement,
			container: this.$refs.container as HTMLElement,
			table: this.$refs.table as HTMLTableElement,
			earLeft: this.$refs.earLeft as HTMLElement,
			earRight: this.$refs.earRight as HTMLElement,
		});
		this.stretcher.start({
			root: this.$refs.root as HTMLElement,
			container: this.$refs.container as HTMLElement,
			table: this.$refs.table as HTMLTableElement,
			panels: this.$refs.panels as HTMLElement,
		});
		this.adjustEmptyTable();
	},

	updated(): void
	{
		this.adjustEmptyTable();
	},

	beforeUnmount(): void
	{
		this.fader.destroy();
		this.stretcher.destroy();
	},

	methods: {
		headTitle(head: ColumnHead): string
		{
			return head.showName ? loc(head.phrase) : '';
		},

		/**
		 * Asked after every render rather than watched: the empty row comes and goes with the state, and
		 * the word inside its cell is a different node every time.
		 */
		adjustEmptyTable(): void
		{
			// whichever of the three words the empty row draws, it stands alone in that cell
			const cell = this.$refs.emptyCell as HTMLElement | undefined;
			const block = (cell?.firstElementChild ?? null) as HTMLElement | null;

			if (block)
			{
				this.stretcher.stretch(block);

				return;
			}

			this.stretcher.release();
		},
	},

	template: `
		<div
			class="main-grid"
			:class="{ 'main-grid-empty-footer': !grid.footDrawn, 'main-grid-empty-stub': emptyRowDrawn }"
			ref="root"
		>
			<div class="main-grid-wrapper">
				<div class="main-grid-fade" ref="fade">
					<div class="main-grid-fade-shadow-left"></div>
					<div class="main-grid-fade-shadow-right"></div>
					<div class="main-grid-ear main-grid-ear-left" ref="earLeft"></div>
					<div class="main-grid-ear main-grid-ear-right" ref="earRight"></div>
					<div class="main-grid-container" ref="container">
						<table
							class="main-grid-table"
							:class="{ 'main-grid-table-fade': grid.faded }"
							:data-testid="tableTestId"
							ref="table"
						>
							<thead class="main-grid-header">
								<tr class="main-grid-row-head">
									<th class="main-grid-cell-head main-grid-cell-static main-grid-cell-checkbox">
										<span class="main-grid-cell-head-container"></span>
									</th>
									<th class="main-grid-cell-head main-grid-cell-static main-grid-cell-action"></th>
									<th
										v-for="head in columns"
										:key="head.id"
										class="main-grid-cell-head"
										:class="head.headClass"
									>
										<div class="main-grid-cell-inner">
											<span class="main-grid-cell-head-container">
												<span class="main-grid-head-title">{{ headTitle(head) }}</span>
											</span>
										</div>
									</th>
									<th class="main-grid-cell-head main-grid-cell-static main-grid-special-empty"></th>
								</tr>
							</thead>
							<tbody>
								<tr
									v-if="emptyRowDrawn"
									class="main-grid-row main-grid-row-empty main-grid-row-body"
								>
									<td class="main-grid-cell main-grid-cell-center" :colspan="emptyColspan" ref="emptyCell">
										<div v-if="emptyRow === 'draft'" class="mail-draft-list-empty" :data-testid="draftEmptyTestId">
											{{ draftEmptyText }}
										</div>
										<EmptyStub v-else-if="emptyRow === 'stub'"/>
										<div v-else class="main-grid-empty-block" :data-testid="emptyRowTestId">
											<div class="main-grid-empty-inner">
												<div class="main-grid-empty-image"></div>
												<div class="main-grid-empty-text">{{ emptyText }}</div>
											</div>
										</div>
									</td>
								</tr>
								<ProjectionRow
									v-for="row in projectionRows"
									:key="row.id"
									:row="row"
									:columns="columns"
								/>
								<MessageRow
									v-for="row in messageRows"
									:key="row.id"
									:row="row"
									:columns="columns"
									:listImprovementsEnabled="listImprovementsEnabled"
								/>
								<DraftRow
									v-for="row in draftRows"
									:key="row.id"
									:row="row"
									:columns="columns"
								/>
							</tbody>
						</table>
					</div>
				</div>
			</div>
			<div class="main-grid-bottom-panels" ref="panels">
				<MoreButton/>
			</div>
		</div>
	`,
});
