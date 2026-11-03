import { Dom, Event } from 'main.core';
import { BInput, InputDesign, InputSize } from 'ui.system.input.vue';
import { TextSm } from 'ui.system.typography.vue';
import { defineComponent } from 'ui.vue3';

import { Phrase } from '../../const';
import { invalidateSubjectGeneration } from '../../feature/generate-subject/generate-subject';
import { loc } from '../../lib/loc/loc';
import { useComposeState } from '../../model/compose/compose';
import { SubjectGenerationText } from '../subject-generation-text/subject-generation-text';

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
		SubjectGenerationText,
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
		/**
		 * The generation locks the field and empties what it shows, the way the mobile form does: the phrase
		 * of the wait stands over the field instead. The lock goes on every ending of the scenario, failures
		 * included, because the flag is the only thing the field reads.
		 */
		isGenerating(): boolean
		{
			return this.state.subjectGeneration.isRunning;
		},

		subject: {
			get(): string
			{
				// Nothing shows through the phrase of the wait; the subject itself is left untouched.
				return this.isGenerating ? '' : this.state.subject;
			},
			set(value: string): void
			{
				// The field shows no subject while it waits, so a write here would empty the real one.
				if (this.isGenerating)
				{
					return;
				}

				this.state.subject = value;
			},
		},

		/** The same phrase labels the visible row and the input for assistive technology. */
		label(): string
		{
			return loc(Phrase.SubjectLabel);
		},

		/** The hint of an empty field is a prompt to type, and the locked field takes nothing. */
		placeholder(): string
		{
			return this.isGenerating ? '' : loc(Phrase.SubjectPlaceholder);
		},
	},

	watch: {
		/**
		 * A field that keeps the focus while it stops taking input has to say so: the change of `readonly` on
		 * an already focused field is not spoken again, and a phrase that turns up next to it is not spoken
		 * on its own either. `BInput` puts the loose attributes of the component on its wrapper and not on
		 * the element of the value, so the flag is written the way the autofill one is.
		 */
		isGenerating(generating: boolean): void
		{
			Dom.attr(this.inputNode(), 'aria-busy', generating ? 'true' : null);
		},
	},

	mounted(): void
	{
		this.denyAutofill();
		Event.bind(this.fieldNode(), 'input', this.handleUserInput);
	},

	beforeUnmount(): void
	{
		Event.unbind(this.fieldNode(), 'input', this.handleUserInput);
	},

	methods: {
		/** Wrapper the design system renders; the input event of the element inside it bubbles up here. */
		fieldNode(): HTMLElement
		{
			return (this.$refs.input as { $el: HTMLElement }).$el;
		},

		/** The element of the value inside that wrapper: what the user stands in and types into. */
		inputNode(): HTMLInputElement | null
		{
			return this.fieldNode().querySelector('input');
		},

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

		/**
		 * A subject the user typed cancels the generation in flight: the result would overwrite what has just
		 * been written. The input event of the field and not a watch of the value is the source, because the
		 * setter is shared: a template, a restored draft and the result of the generation itself write
		 * through it, and a watch would have the generation cancel itself on its own result.
		 *
		 * The field is locked while the generation runs, so there is no user path here; the cancel stands as
		 * an invariant of the code.
		 */
		handleUserInput(): void
		{
			invalidateSubjectGeneration(this.state);
		},
	},

	template: `
		<TextSm class-name="mail-compose-subject-field__label">{{ label }}:</TextSm>
		<div class="mail-compose-subject-field__slot">
			<BInput
				ref="input"
				v-model="subject"
				class="mail-compose-subject-field"
				:design="design"
				:size="size"
				:placeholder="placeholder"
				:aria-label="label"
				:readonly="isGenerating"
				stretched
				data-testid="mail-compose-subject-field"
			/>
			<SubjectGenerationText v-if="isGenerating"/>
		</div>
	`,
});
