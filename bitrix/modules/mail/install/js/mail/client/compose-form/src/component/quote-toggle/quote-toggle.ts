import { defineComponent } from 'ui.vue3';
import { AirButtonStyle, Button as UiButton, ButtonSize } from 'ui.vue3.components.button';

import { Phrase } from '../../const';
import { buildUnfoldedBody } from '../../feature/build-message-body/build-message-body';
import { useComposeEditor } from '../../infrastructure/adapter/editor/editor';
import { EditorViewMode, type EditorUnsubscribe } from '../../infrastructure/adapter/editor/types';
import { loc } from '../../lib/loc/loc';
import { useComposeState } from '../../model/compose/compose';

import './quote-toggle.css';

const ControlTestId = 'mail-compose-quote-show';

/**
 * A reply starts with the quote folded: it stays out of the body until the user asks for it. The quote
 * itself lives inside the editor document, which Vue does not own, so it is reached through the adapter.
 */
// @vue/component
export const QuoteToggle = defineComponent({
	name: 'MailComposeQuoteToggle',

	components: {
		UiButton,
	},

	setup()
	{
		return {
			state: useComposeState(),
			editor: useComposeEditor(),
			// Own subscriptions only: the editor adapter is shared with the rest of the form and outlives it.
			subscriptions: [] as EditorUnsubscribe[],
			controlStyle: AirButtonStyle.PLAIN,
			controlSize: ButtonSize.SMALL,
			controlTestId: ControlTestId,
		};
	},

	computed: {
		/** `quoteFolded` is false both when the quote is already in the body and when there is no quote. */
		isShown(): boolean
		{
			return this.state.body.quoteFolded;
		},

		text(): string
		{
			return loc(Phrase.QuoteShow);
		},
	},

	mounted(): void
	{
		this.subscriptions.push(this.editor.subscribeViewModeChange(this.handleViewModeChange));
	},

	beforeUnmount(): void
	{
		this.subscriptions.forEach((unsubscribe: EditorUnsubscribe): void => {
			unsubscribe();
		});
		this.subscriptions.length = 0;
	},

	methods: {
		handleClick(): void
		{
			this.unfold();
		},

		/**
		 * Leaving the visual mode unfolds the quote by force: the other modes show the body as one text, and
		 * a quote kept out of the body would be lost from the message the user then edits.
		 */
		handleViewModeChange(mode: string): void
		{
			if (mode !== EditorViewMode.Visual)
			{
				this.unfold();
			}
		},

		/**
		 * The body is written first and the state follows only on success: a state that counts the quote as
		 * unfolded while it is in neither the body nor the state would lose it.
		 */
		unfold(): void
		{
			if (!this.state.body.quoteFolded)
			{
				return;
			}

			if (!this.editor.setBody(buildUnfoldedBody(this.editor, this.state.body)))
			{
				return;
			}

			this.state.body.quoteFolded = false;
			this.editor.focus();
			// The body now carries the original message, so CoPilot works over the whole of it.
			this.editor.updateCopilotContext({ isAddedQuote: true });
		},
	},

	template: `
		<div
			v-if="isShown"
			class="mail-compose-quote-toggle"
			data-testid="mail-compose-quote-toggle"
		>
			<UiButton
				:text="text"
				:style="controlStyle"
				:size="controlSize"
				:dataset="{ testid: controlTestId }"
				@click="handleClick"
			/>
		</div>
	`,
});
