import { defineComponent, type PropType } from 'ui.vue3';

import { GridMode, Phrase, TestId } from '../../const';
import { toggleRowActionsMenu } from '../../feature/row-actions-menu/row-actions-menu';
import { loc } from '../../lib/loc/loc';
import { useGridStore } from '../../model/grid/grid';
import { type RowAction } from '../../model/grid/types';

/**
 * The button that opens the menu of a row. The menu itself is the menu of the platform rather than
 * the one of the design system: the items come from the server as descriptions with handler strings,
 * the submenu of the folders loads its levels on hover and the submenu of the labels stays open
 * while it is being ticked.
 */
// @vue/component
export const RowActions = defineComponent({
	name: 'MailMessageGridRowActions',

	props: {
		rowId: {
			type: String,
			required: true,
		},
		actions: {
			type: Array as PropType<RowAction[]>,
			required: true,
		},
	},

	setup()
	{
		// resolved through the application this component belongs to, so each grid reads its own state
		return {
			grid: useGridStore(),
			testId: TestId.RowActions,
		};
	},

	computed: {
		/** The button carries no text, so this is the whole of its name for a screen reader. */
		label(): string
		{
			return loc(this.grid.mode === GridMode.Draft ? Phrase.DraftActions : Phrase.RowActions);
		},
	},

	methods: {
		handleClick(): void
		{
			toggleRowActionsMenu({
				gridId: this.grid.gridId,
				rowId: this.rowId,
				actions: this.actions,
				folders: this.grid.folders,
				bindElement: this.$el as HTMLElement,
			});
		},
	},

	template: `
		<a
			href="#"
			class="main-grid-row-action-button"
			:data-testid="testId"
			:aria-label="label"
			aria-haspopup="true"
			aria-expanded="false"
			@click.prevent="handleClick"
		></a>
	`,
});
