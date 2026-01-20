import { BaseEvent } from 'main.core.events';

import { EventType } from 'im.v2.const';
import { Analytics } from 'im.v2.lib.analytics';
import { Notifier } from 'im.v2.lib.notifier';

import { AudioManager } from './classes/audio-manager';

import './css/audio-input.css';

import type { JsonObject } from 'main.core';
import type { EventEmitter } from 'main.core.events';

// @vue/component
export const AudioInput = {
	name: 'AudioInput',
	props: {
		dialogId: {
			type: String,
			required: true,
		},
	},
	emits: ['inputStart', 'inputResult'],
	data(): JsonObject
	{
		return {
			audioMode: false,
			audioUsed: false,
		};
	},
	watch:
	{
		audioMode(newValue, oldValue)
		{
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
	template: `
		<div
			v-if="isAudioModeAvailable()"
			@click="onClick"
			class="bx-im-copilot-audio-input__container"
			:class="{'--active': audioMode}"
		></div>
	`,
};
