import { Dom } from 'main.core';
import { Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';
import { defineComponent } from 'ui.vue3';
import { AirButtonStyle, Button as UiButton, ButtonSize, ButtonState } from 'ui.vue3.components.button';

import { Phrase } from '../../const';
import { generateSubject } from '../../feature/generate-subject/generate-subject';
import { useComposeEditor } from '../../infrastructure/adapter/editor/editor';
import { loc } from '../../lib/loc/loc';
import { useComposeState } from '../../model/compose/compose';

import './generate-subject-button.css';

const TestId = 'mail-compose-generate-subject';

/**
 * The control that starts the subject generation. It stands in the subject row next to the one that reveals
 * the bcc field, and it is gone entirely when the server did not report the generation as available: the
 * availability arrives with the initial data of the form and is never derived here.
 *
 * The waiting state of the button is the whole indication this component owns: the design system draws the
 * loader while the control stays reachable. The other half of the indication, the phrase drawn over the
 * locked field, belongs to the subject field. Nothing is requested and nothing is subscribed to from here:
 * the click goes straight to the scenario, which owns the life of the request.
 */
// @vue/component
export const GenerateSubjectButton = defineComponent({
	name: 'MailComposeGenerateSubjectButton',

	components: {
		UiButton,
	},

	props: {
		/** The applied subject is a change of the letter, and a change is reported under the form it changed. */
		formId: {
			type: String,
			required: true,
		},
	},

	setup()
	{
		return {
			state: useComposeState(),
			editor: useComposeEditor(),
			buttonStyle: AirButtonStyle.TINTED_BITRIX_GPT,
			buttonSize: ButtonSize.SMALL,
			buttonIcon: Outline.AI_STARS,
			testId: TestId,
		};
	},

	computed: {
		isShown(): boolean
		{
			return this.state.subjectGeneration.available;
		},

		isRunning(): boolean
		{
			return this.state.subjectGeneration.isRunning;
		},

		text(): string
		{
			return loc(Phrase.SubjectGenerationButton);
		},

		/**
		 * The waiting look without the `disabled` attribute the `loading` property brings along with it. A
		 * disabled control loses the focus to `<body>` and drops out of the tab order for the whole wait, and
		 * that wait lasts up to 30 seconds. The state slot draws the very same loader and leaves the button
		 * reachable, the same choice the subject field makes when it takes `readonly` over `disabled`.
		 */
		waitingState(): string | null
		{
			return this.isRunning ? ButtonState.WAITING : null;
		},
	},

	watch: {
		isRunning(running: boolean): void
		{
			this.markWaiting(running);
		},
	},

	methods: {
		handleClick(): void
		{
			// The control stays clickable while it waits, so the repeat is closed here and not by the browser.
			if (this.isRunning)
			{
				return;
			}

			void generateSubject({
				editor: this.editor,
				state: this.state,
				formId: this.formId,
				getControlNode: this.getControlNode,
			});
		},

		/**
		 * The tariff promo of a spent quota anchors on this node. The rendered button stands next to the
		 * placeholder of its Vue wrapper rather than inside it, so it is located by `data-testid`.
		 */
		getControlNode(): HTMLElement | null
		{
			const row = this.$refs.control as HTMLElement | undefined;

			return row?.querySelector<HTMLElement>(`[data-testid="${TestId}"]`) ?? null;
		},

		/**
		 * A control that keeps the focus has to say for itself that it is busy and takes no second press.
		 * `UiButton` carries no property for either attribute, so both go on the rendered control.
		 */
		markWaiting(running: boolean): void
		{
			const flag = running ? 'true' : null;

			Dom.attr(this.getControlNode(), { 'aria-busy': flag, 'aria-disabled': flag });
		},
	},

	template: `
		<div
			v-if="isShown"
			ref="control"
			class="mail-compose-generate-subject-button"
			data-testid="mail-compose-generate-subject-button"
		>
			<UiButton
				:text="text"
				:style="buttonStyle"
				:size="buttonSize"
				:leftIcon="buttonIcon"
				:state="waitingState"
				:dataset="{ testid: testId }"
				@click="handleClick"
			/>
		</div>
	`,
});
