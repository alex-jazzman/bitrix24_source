import { Loc } from 'main.core';
import { useCallStore } from 'call.store';
import { VideoGrid } from './grid/video-grid';
import { Toolbar } from './toolbar/toolbar';

// @vue/component
export const Screen = {
	name: 'call-screen',
	components: {
		VideoGrid,
		Toolbar,
	},
	inject: {
		callActionBridge: {
			default: () => ({ emit: () => {} }),
		},
	},
	setup()
	{
		const callStore = useCallStore();

		return { callStore };
	},
	computed: {
		uiState()
		{
			return this.callStore.uiState;
		},
		isIncoming()
		{
			return this.callStore.isIncoming;
		},
		viewState()
		{
			return this.callStore.viewState;
		},
		isProceedingOutgoing()
		{
			return this.uiState === 'Preparing' && !this.callStore.isIncoming;
		},
		isProceedingIncoming()
		{
			return this.uiState === 'Preparing' && this.callStore.isIncoming;
		},
		isConnected()
		{
			return this.uiState === 'Connected';
		},
		isFolded()
		{
			return this.callStore.viewState === 'Folded';
		},
		callTitle()
		{
			return this.callStore.callTitle;
		},
		answerText()
		{
			return Loc.getMessage('CALL_VUE_BUTTON_ANSWER');
		},
		declineText()
		{
			return Loc.getMessage('CALL_VUE_BUTTON_DECLINE');
		},
		callingText()
		{
			return Loc.getMessage('CALL_VUE_STATUS_CALLING');
		},
		hangupText()
		{
			return Loc.getMessage('CALL_VUE_BUTTON_HANGUP');
		},
	},
	methods: {
		onButtonClick(buttonName)
		{
			this.callActionBridge.emit('onButtonClick', { buttonName });
		},
	},
	template: /* HTML */`
		<div class="call-screen" :class="{ '--folded': isFolded }">
			<template v-if="isFolded">
				<div class="call-screen_folded">
					<span class="call-screen_folded-title">{{ callTitle }}</span>
				</div>
			</template>
			<template v-else-if="isProceedingIncoming">
				<div class="call-screen_incoming">
					<span class="call-screen_incoming-title">{{ callTitle }}</span>
					<div class="call-screen_incoming-actions">
						<button
							class="call-screen_button --answer"
							@click="onButtonClick('answer')"
						>{{ answerText }}</button>
						<button
							class="call-screen_button --decline"
							@click="onButtonClick('hangup')"
						>{{ declineText }}</button>
					</div>
				</div>
			</template>
			<template v-else-if="isProceedingOutgoing">
				<div class="call-screen_outgoing">
					<span class="call-screen_outgoing-title">{{ callTitle }}</span>
					<span class="call-screen_outgoing-status">{{ callingText }}</span>
					<div class="call-screen_outgoing-actions">
						<button
							class="call-screen_button --danger"
							@click="onButtonClick('hangup')"
						>{{ hangupText }}</button>
					</div>
				</div>
			</template>
		<template v-else-if="isConnected">
			<VideoGrid />
			<Toolbar />
		</template>
		</div>
	`,
};
