import { Settings, ChatType } from 'im.v2.const';
import { Feature, FeatureManager } from 'im.v2.lib.feature';
import { Utils } from 'im.v2.lib.utils';
import { type ImModelChat } from 'im.v2.model';
import { Spinner, SpinnerColor, SpinnerSize } from 'im.v2.component.elements.loader';

import 'im.v2.css.classes';

import './css/send-button.css';

// @vue/component
export const SendButton = {
	components: { Spinner },
	props:
		{
			dialogId: {
				type: String,
				default: '',
			},
			editMode: {
				type: Boolean,
				default: false,
			},
			isDisabled: {
				type: Boolean,
				default: false,
			},
			isStopGenerationState: {
				type: Boolean,
				default: false,
			},
			// the press has been taken and its request is on its way: the button waits for the answer
			isLoading: {
				type: Boolean,
				default: false,
			},
		},
	// `click` is a semantic "send" emit (not the native DOM click event):
	// handleClick routes to `stop` while generating, otherwise emits `click`
	emits: ['click', 'stop'],
	setup(): Object
	{
		return { SpinnerColor, SpinnerSize };
	},
	computed:
		{
			dialog(): ImModelChat
			{
				return this.$store.getters['chats/get'](this.dialogId, true);
			},
			dialogTypeClass(): string
			{
				return `--${this.dialog.type}`;
			},
			hasCopilot2026Styles(): boolean
			{
				return this.dialog.type === ChatType.copilot
					&& FeatureManager.isFeatureAvailable(Feature.isBitrixGptV2Available);
			},
			// the only name the button has: in an edit it saves a message instead of sending a new one,
			// and the hint is what a reader is told the button does
			buttonHint(): string
			{
				if (this.isStopGenerationState)
				{
					return this.loc('IM_ELEMENTS_SEND_BUTTON_STOP_GENERATION');
				}

				// the press is already taken: what the button is for matters less than that it is working on it
				if (this.isLoading)
				{
					return this.loc('IM_ELEMENTS_SEND_BUTTON_SAVING_EDIT');
				}

				const phraseCode = this.editMode
					? 'IM_ELEMENTS_SEND_BUTTON_SAVE_EDIT'
					: 'IM_TEXTAREA_ICON_SEND_TEXT';

				return this.loc(phraseCode, {
					'#SEND_MESSAGE_COMBINATION#': this.sendCombination,
				});
			},
			sendCombination(): string
			{
				const sendByEnter = this.$store.getters['application/settings/get'](Settings.hotkey.sendByEnter);
				const ctrlKey = Utils.platform.isMac() ? 'Cmd' : 'Ctrl';

				return sendByEnter ? 'Enter' : `${ctrlKey} + Enter`;
			},
		},
	methods:
		{
			handleClick(event: PointerEvent)
			{
				if (this.isStopGenerationState)
				{
					this.$emit('stop');

					return;
				}

				if (this.isDisabled || this.isLoading)
				{
					return;
				}

				this.$emit('click', event);
			},
			loc(phraseCode: string, replacements: {[string]: string} = {}): string
			{
				return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
			},
		},
	// The explicit tabindex is the Tab stop itself: WebKit keeps a bare <button> out of the Tab order until
	// full keyboard access is turned on in the OS. The stop still disappears while the button is disabled,
	// which is what keeps the send button out of the walk on an empty field.
	template: `
		<button
			type="button"
			tabindex="0"
			:title="buttonHint"
			:aria-label="buttonHint"
			:data-testid="isStopGenerationState ? 'copilot-generation-stop-btn' : 'im-elements-send-btn'"
			class="bx-im-elements-send-button --focus-visible"
			:class="[{
				'--edit': editMode,
				// a button already working on the press is not a button waiting to be pressed
				'--disabled': isDisabled && !isStopGenerationState && !isLoading,
				'--loading': isLoading,
				'--copilot-2026': hasCopilot2026Styles,
				'--stop': isStopGenerationState,
			}, dialogTypeClass]"
			:disabled="isDisabled && !isStopGenerationState"
			:aria-busy="isLoading"
			@click="handleClick"
		>
			<Spinner v-if="isLoading" :size="SpinnerSize.XXS" :color="SpinnerColor.white" />
		</button>
	`,
};
