import { EventEmitter } from 'main.core.events';
import { BIcon, Outline as OutlineIcons } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';
import { markRaw } from 'ui.vue3';

import { CallManager } from 'im.v2.lib.call';
import { CALL_STATE_EVENTS } from 'im.v2.lib.voice-recorder';

import { VoiceRecorderPromo } from './voice-recorder-promo';

import './css/voice-recorder.css';

const ICON_SIZE = 26;
const MAIN_POINTER_BUTTON = 0;

// @vue/component
export const VoiceRecorderButton = {
	name: 'VoiceRecorderButton',
	components: { BIcon, VoiceRecorderPromo },
	props:
	{
		// the panel keeps a copy of this button to mark the place the recording runs in, and that copy
		// leads nowhere: it is hidden from the screen reader and taken out of the tab order. Out of the
		// tab order and not disabled - `disabled` would also stop the browser from reporting the
		// release of a hold that ended over this very element, and that release is what sends the record
		isRecording: {
			type: Boolean,
			default: false,
		},
		isDisabled: {
			type: Boolean,
			default: false,
		},
		// the dictation holds the microphone while it runs: the button names what took the device
		// instead of only greying out
		isAudioInputActive: {
			type: Boolean,
			default: false,
		},
	},
	// `press` starts the recording and says whether it is tied to a hold and whether a pointer stood
	// behind it
	emits: ['press'],
	data(): Object
	{
		return {
			hasActiveCall: false,
			// the promo hangs on the button itself, and the button exists as an element only once mounted
			promoBindElement: null,
		};
	},
	computed:
	{
		OutlineIcons: () => OutlineIcons,
		ICON_SIZE: () => ICON_SIZE,
		// a button that only greys out leaves the user guessing what took the microphone
		buttonHint(): string
		{
			if (this.hasActiveCall)
			{
				return this.loc('IM_TEXTAREA_VOICE_RECORDER_DISABLED_CALL');
			}

			if (this.isAudioInputActive)
			{
				return this.loc('IM_TEXTAREA_VOICE_RECORDER_DISABLED_DICTATION');
			}

			return this.loc('IM_TEXTAREA_VOICE_RECORDER_START');
		},
		isUnavailable(): boolean
		{
			return this.isDisabled || this.hasActiveCall;
		},
		canStartRecording(): boolean
		{
			return !this.isUnavailable && !this.isRecording;
		},
		// the copy of the button inside the panel shares the popup id with the button of the field, and a
		// promo bound to that copy would stand over the running recording
		showPromo(): boolean
		{
			return Boolean(this.promoBindElement) && !this.isRecording;
		},
	},
	created()
	{
		this.updateCallState();
		CALL_STATE_EVENTS.forEach((eventName) => EventEmitter.subscribe(eventName, this.updateCallState));
	},
	mounted()
	{
		this.promoBindElement = markRaw(this.$el);
	},
	beforeUnmount()
	{
		CALL_STATE_EVENTS.forEach((eventName) => EventEmitter.unsubscribe(eventName, this.updateCallState));
	},
	methods:
	{
		updateCallState()
		{
			this.hasActiveCall = Boolean(CallManager.getInstance().hasCurrentCall());
		},
		handlePointerDown(event: PointerEvent)
		{
			if (!this.canStartRecording || event.button !== MAIN_POINTER_BUTTON)
			{
				return;
			}

			// the hold owns the pointer from here: no caret jump into the field, no text selection
			event.preventDefault();
			this.$emit('press', { isLocked: false, isStartedFromPointer: true });
		},
		handleActivationKeydown(event: KeyboardEvent)
		{
			if (!this.canStartRecording || (event.key !== 'Enter' && event.key !== ' '))
			{
				return;
			}

			// kills the click the browser makes of the key, so the click handler starts no second recording
			event.preventDefault();

			// a repeat of a held key is not a second start
			if (event.repeat)
			{
				return;
			}

			this.$emit('press', { isLocked: true, isStartedFromPointer: false });
		},
		// a screen reader and a voice control activate a button through its default action, which
		// reaches the element as a click with no pointer behind it - `detail` 0. The pointer and the
		// keyboard have handlers of their own and never come here
		handleActivationClick(event: MouseEvent)
		{
			if (!this.canStartRecording || event.detail !== 0)
			{
				return;
			}

			this.$emit('press', { isLocked: true, isStartedFromPointer: false });
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<button
			:title="isRecording ? undefined : buttonHint"
			:aria-label="buttonHint"
			:aria-disabled="isUnavailable ? 'true' : undefined"
			:aria-hidden="isRecording ? 'true' : undefined"
			:tabindex="isRecording ? -1 : 0"
			:class="{
				'--disabled': isUnavailable,
				'--recording': isRecording,
			}"
			class="bx-im-voice-recorder-button"
			type="button"
			data-testid="im-textarea-voice-recorder-btn"
			@pointerdown="handlePointerDown"
			@keydown="handleActivationKeydown"
			@click="handleActivationClick"
		>
			<BIcon :name="OutlineIcons.MICROPHONE_ON" :size="ICON_SIZE" />
			<VoiceRecorderPromo v-if="showPromo" :bindElement="promoBindElement" />
		</button>
	`,
};
