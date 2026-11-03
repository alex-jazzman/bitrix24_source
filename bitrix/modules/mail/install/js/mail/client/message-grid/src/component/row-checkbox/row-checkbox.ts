import { Vue as CheckboxVue } from 'ui.system.checkbox';
import { defineComponent, inject } from 'ui.vue3';

import { GridMode, gridSelectionKey, Phrase, TestId } from '../../const';
import { loc } from '../../lib/loc/loc';
import { useGridStore } from '../../model/grid/grid';

/**
 * Taken out of the parent extension: `ui.system.checkbox.vue` declares no dependency of its own, so
 * importing it directly leaves the namespace it publishes into undefined at run time.
 */
const Checkbox = CheckboxVue.Checkbox;

/**
 * The name the checkbox of a row of the legacy grid carried on its own input
 * (`main.ui.grid/templates/.default/template.php:407`), reproduced letter for letter for the
 * scenarios of the screen. The component of the design system passes what it is given down to its
 * input, so the name lands beside `ui-checkbox__input` rather than on the label around it.
 */
const LegacyCheckboxClass = 'main-grid-row-checkbox';

/**
 * The checkbox of one row. The registry is resolved through the application this component belongs
 * to; the change goes through the selection the application handed down, so the rules of it stay in
 * one place and the neighbours of the grid hear about it.
 */
// @vue/component
export const RowCheckbox = defineComponent({
	name: 'MailMessageGridRowCheckbox',

	components: {
		Checkbox,
	},

	props: {
		rowId: {
			type: String,
			required: true,
		},
	},

	setup()
	{
		return {
			grid: useGridStore(),
			selection: inject(gridSelectionKey),
			testId: TestId.RowCheckbox,
			legacyClass: LegacyCheckboxClass,
		};
	},

	computed: {
		checked(): boolean
		{
			return this.grid.selectedIdSet.has(this.rowId);
		},

		/** The checkbox carries no text, so this is the whole of its name for a screen reader. */
		label(): string
		{
			return loc(this.grid.mode === GridMode.Draft ? Phrase.DraftSelect : Phrase.RowSelect);
		},
	},

	methods: {
		handleChange(): void
		{
			this.selection?.toggleRow(this.rowId);
		},
	},

	template: `
		<Checkbox
			:modelValue="checked"
			:class="legacyClass"
			:data-testid="testId"
			:aria-label="label"
			@update:modelValue="handleChange"
		/>
	`,
});
