import { Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';
import { TextSm } from 'ui.system.typography.vue';
import { defineComponent } from 'ui.vue3';
import { AirButtonStyle, Button as UiButton, ButtonSize } from 'ui.vue3.components.button';

import { Phrase } from '../../const';
import { loc } from '../../lib/loc/loc';
import { type RecipientFieldKind, useComposeState } from '../../model/compose/compose';
import { RecipientField, RecipientFieldPhrase } from '../recipient-field/recipient-field';

import './recipient-rows.css';

/** Render order of the rows, top to bottom. */
const FieldOrder: RecipientFieldKind[] = ['to', 'cc', 'bcc'];

/** The add control of a row is reached by this id from the template and from the focus of a revealed row. */
function addTestId(field: RecipientFieldKind): string
{
	return `mail-compose-recipient-add-${field}`;
}

type RecipientRow = {
	field: RecipientFieldKind,
	label: string,
	labelId: string,
	addTestId: string,
};

/** Part of `RecipientField` reached through refs. */
type FieldInstance = {
	openPicker(): void,
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
		UiButton,
	},

	setup()
	{
		return {
			state: useComposeState(),
			addStyle: AirButtonStyle.PLAIN_ACCENT,
			addSize: ButtonSize.SMALL,
			addIcon: Outline.PLUS_M,
			// Reached imperatively only, so kept out of the reactive state: a component proxy adds nothing
			// here and hides what is really held.
			fields: {} as Partial<Record<RecipientFieldKind, FieldInstance | null>>,
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
						addTestId: addTestId(field),
					};
				});
		},

		/** The `bcc` row appears with this flag, and the focus follows it. */
		isBccExpanded(): boolean
		{
			return this.state.bccExpanded;
		},

		addText(): string
		{
			return loc(Phrase.FieldAdd);
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
		setFieldRef(field: RecipientFieldKind, instance: unknown): void
		{
			this.fields[field] = instance as FieldInstance | null;
		},

		openPicker(field: RecipientFieldKind): void
		{
			this.fields[field]?.openPicker();
		},

		/**
		 * The add control is the only control of a row: the field around the addresses takes no focus. The
		 * rendered button stands next to the placeholder of its Vue wrapper rather than inside it, so it is
		 * located by `data-testid`.
		 */
		focusAddControl(field: RecipientFieldKind): void
		{
			const rows = this.$el as HTMLElement;

			rows.querySelector<HTMLElement>(`[data-testid="${addTestId(field)}"]`)?.focus();
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
					:ref="(instance) => setFieldRef(row.field, instance)"
					:field="row.field"
					:aria-labelledby="row.labelId"
					@picker-close="focusAddControl(row.field)"
				/>
				<UiButton
					:text="addText"
					:style="addStyle"
					:size="addSize"
					:left-icon="addIcon"
					:dataset="{ testid: row.addTestId }"
					@click="openPicker(row.field)"
				/>
			</div>
		</div>
	`,
});
