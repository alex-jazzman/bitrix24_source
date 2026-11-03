import { type JsonObject } from 'main.core';
import { type BaseEvent, type EventEmitter } from 'main.core.events';
import { BIcon, Outline as OutlineIcons } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import { EventType } from 'im.v2.const';
import { Analytics } from 'im.v2.lib.analytics';
import { Notifier } from 'im.v2.lib.notifier';

import { AudioManager } from './classes/audio-manager';

import 'im.v2.css.classes';

import './css/audio-input.css';

const ICON_SIZE = 24;

// @vue/component
export const AudioInput = {
	name: 'AudioInput',
	components: { BIcon },
	props: {
		dialogId: {
			type: String,
			required: true,
		},
		isDisabled: {
			default: false,
			type: Boolean,
		},
	},
	// `activeChange` reports whether the dictation is on: it holds the microphone, and the voice
	// recorder standing next to it may not take the device away in the meantime
	emits: ['inputStart', 'inputResult', 'activeChange'],
	data(): JsonObject
	{
		return {
			audioMode: false,
			audioUsed: false,
		};
	},
	computed:
	{
		ICON_SIZE: () => ICON_SIZE,
		iconName(): string
		{
			return this.audioMode ? OutlineIcons.STOP_M : OutlineIcons.MICROPHONE_ON;
		},
		audioButtonLabel(): string
		{
			return this.audioMode
				? this.loc('IM_TEXTAREA_ICON_SEND_VOICE_STOP_ARIA')
				: this.loc('IM_TEXTAREA_ICON_SEND_VOICE');
		},
	},
	watch:
	{
		audioMode(newValue, oldValue)
		{
			this.$emit('activeChange', newValue);

			if (oldValue === false && newValue === true)
			{
				this.startAudio();
			}

			if (oldValue === true && newValue === false)
			{
				this.stopAudio();
			}
		},
	},
	created()
	{
		this.getEmitter().subscribe(EventType.textarea.onAfterSendMessage, this.handleOnAfterSendMessage);
	},
	beforeUnmount()
	{
		this.getEmitter().unsubscribe(EventType.textarea.onAfterSendMessage, this.handleOnAfterSendMessage);
	},
	methods:
	{
		onClick()
		{
			if (this.isDisabled)
			{
				return;
			}

			if (this.audioMode)
			{
				this.audioMode = false;

				return;
			}

			this.audioMode = true;
		},
		startAudio()
		{
			this.getAudioManager().startRecognition();
			this.bindAudioEvents();
		},
		stopAudio()
		{
			this.getAudioManager().stopRecognition();
			this.unbindAudioEvents();
		},
		bindAudioEvents()
		{
			this.getAudioManager().subscribe(AudioManager.events.recognitionResult, (event: BaseEvent) => {
				const text: string = event.getData();
				this.$emit('inputResult', text);
				this.audioUsed = true;
			});
			this.getAudioManager().subscribe(AudioManager.events.recognitionStart, () => {
				this.$emit('inputStart');
			});
			this.getAudioManager().subscribe(AudioManager.events.recognitionEnd, () => {
				this.audioMode = false;
			});
			this.getAudioManager().subscribe(AudioManager.events.recognitionError, () => {
				this.audioMode = false;
				Notifier.speech.onRecognitionError();
			});
		},
		unbindAudioEvents()
		{
			this.getAudioManager().unsubscribeAll(AudioManager.events.recognitionResult);
			this.getAudioManager().unsubscribeAll(AudioManager.events.recognitionStart);
			this.getAudioManager().unsubscribeAll(AudioManager.events.recognitionEnd);
			this.getAudioManager().unsubscribeAll(AudioManager.events.recognitionError);
		},
		isAudioModeAvailable(): boolean
		{
			return AudioManager.isAvailable();
		},
		getAudioManager(): AudioManager
		{
			if (!this.audioManager)
			{
				this.audioManager = new AudioManager();
			}

			return this.audioManager;
		},
		handleOnAfterSendMessage()
		{
			if (this.audioUsed)
			{
				Analytics.getInstance().copilot.onUseAudioInput(this.dialogId);
				Analytics.getInstance().aiAssistant.onUseAudioInput(this.dialogId);

				this.audioUsed = false;
			}

			this.audioMode = false;
		},
		getEmitter(): EventEmitter
		{
			return this.$Bitrix.eventEmitter;
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	// Explicit Tab stop: WebKit keeps a bare <button> out of the Tab order until full keyboard access is
	// turned on in the OS.
	template: `
		<button
			v-if="isAudioModeAvailable()"
			type="button"
			tabindex="0"
			class="bx-im-copilot-audio-input__container bx-im-textarea__icon --focus-visible"
			:class="{
				'--active': audioMode,
				'--disabled': isDisabled,
			}"
			:disabled="isDisabled"
			:aria-label="audioButtonLabel"
			data-testid="im-textarea-audio-input-btn"
			@click="onClick"
		>
			<BIcon :name="iconName" :size="ICON_SIZE" hoverable />
		</button>
	`,
};
