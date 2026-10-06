import { Dom } from 'main.core';
import { BInput, InputDesign, InputSize } from 'ui.system.input.vue';
import { TextSm } from 'ui.system.typography.vue';
import { defineComponent } from 'ui.vue3';

import { Phrase } from '../../const';
import { loc } from '../../lib/loc/loc';
import { useComposeState } from '../../model/compose/compose';

import './subject-field.css';

/**
 * The subject of a reply or a forward arrives ready, prefix and all, and nothing here validates it: an
 * empty subject does not hold the send back and the server titles such a message itself. The substitution
 * menu of the old form belongs to CRM and is not ported.
 */
// @vue/component
export const SubjectField = defineComponent({
	name: 'MailComposeSubjectField',

	components: {
		BInput,
		TextSm,
	},

	setup()
	{
		return {
			state: useComposeState(),
			// No box around the subject: the field is the line itself.
			design: InputDesign.Naked,
			size: InputSize.Md,
		};
	},

	computed: {
		subject: {
			get(): string
			{
				return this.state.subject;
			},
			set(value: string): void
			{
				this.state.subject = value;
			},
		},

		/** The same phrase labels the visible row and the input for assistive technology. */
		label(): string
		{
			return loc(Phrase.SubjectLabel);
		},

		placeholder(): string
		{
			return loc(Phrase.SubjectPlaceholder);
		},
	},

	mounted(): void
	{
		this.denyAutofill();
	},

	methods: {
		/**
		 * A browser that takes the real `<form>` of the screen for a login form offers credentials to the
		 * first field it finds. `ui.entity-selector` marks its own fields; the input of the design system has
		 * no property for it, so the attribute is set here.
		 */
		denyAutofill(): void
		{
			const field = (this.$refs.input as { $el: HTMLElement }).$el;

			Dom.attr(field.querySelector('input'), 'autocomplete', 'off');
		},
	},

	template: `
		<TextSm class-name="mail-compose-subject-field__label">{{ label }}:</TextSm>
		<BInput
			ref="input"
			v-model="subject"
			class="mail-compose-subject-field"
			:design="design"
			:size="size"
			:placeholder="placeholder"
			:aria-label="label"
			stretched
			data-testid="mail-compose-subject-field"
		/>
	`,
});
