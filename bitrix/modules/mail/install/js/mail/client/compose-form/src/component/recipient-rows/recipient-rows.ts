import { TextSm } from 'ui.system.typography.vue';
import { defineComponent } from 'ui.vue3';

import { loc } from '../../lib/loc/loc';
import { type RecipientFieldKind, useComposeState } from '../../model/compose/compose';
import { RecipientField, RecipientFieldPhrase } from '../recipient-field/recipient-field';

import './recipient-rows.css';

/** Render order of the rows, top to bottom. */
const FieldOrder: RecipientFieldKind[] = ['to', 'cc', 'bcc'];

type RecipientRow = {
	field: RecipientFieldKind,
	label: string,
	labelId: string,
};

/**
 * The chosen addresses are the tags of the field's own picker rather than chips of our own: a second view
 * over one set of addresses would show every address twice.
 *
 * `to` and `cc` are expanded from the start, `bcc` only on request, and expanding is one way: folding a
 * field back would take the addresses already typed into it away with it.
 */
// @vue/component
export const RecipientRows = defineComponent({
	name: 'MailComposeRecipientRows',

	components: {
		RecipientField,
		TextSm,
	},

	setup()
	{
		return {
			state: useComposeState(),
		};
	},

	computed: {
		rows(): RecipientRow[]
		{
			return FieldOrder
				.filter((field) => field !== 'bcc' || this.isBccExpanded)
				.map((field) => {
					return {
						field,
						label: loc(RecipientFieldPhrase[field]),
						labelId: `mail-compose-form-recipient-label-${field}`,
					};
				});
		},

		/** The `bcc` row appears with this flag, and the focus follows it. */
		isBccExpanded(): boolean
		{
			return this.state.bccExpanded;
		},

	},

	watch: {
		isBccExpanded(isExpanded: boolean): void
		{
			if (isExpanded)
			{
				// The row is drawn on the next tick, and only then is there anything to focus.
				void this.$nextTick(() => {
					this.focusAddControl('bcc');
				});
			}
		},
	},

	methods: {
		/** The built-in add control of the selector is the only control of a row and takes the focus. */
		focusAddControl(field: RecipientFieldKind): void
		{
			const rows = this.$el as HTMLElement;
			const control = rows.querySelector<HTMLElement>(
				`[data-testid="mail-compose-recipient-field-${field}"]`
				+ ' [data-testid="ui-tag-selector-add-item-button"] button',
			);

			control?.focus();
		},
	},

	template: `
		<div class="mail-compose-recipient-rows" data-testid="mail-compose-recipient-rows">
			<div
				v-for="row in rows"
				:key="row.field"
				class="mail-compose-recipient-rows__row"
				:data-testid="'mail-compose-recipient-row-' + row.field"
			>
				<TextSm
					:id="row.labelId"
					class-name="mail-compose-recipient-rows__label"
				>{{ row.label }}:</TextSm>
				<RecipientField
					:field="row.field"
					:aria-labelledby="row.labelId"
				/>
			</div>
		</div>
	`,
});
