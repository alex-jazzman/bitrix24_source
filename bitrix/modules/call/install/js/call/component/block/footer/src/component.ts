import { defineComponent } from 'ui.vue3';

import { CallMicrophoneButton } from 'call.component.block.microphone-button';
import { CallCameraButton } from 'call.component.block.camera-button';
import { CallScreenShareButton } from 'call.component.block.screen-share-button';

import { useUiStore } from 'call.store';
import type { UiStoreInstance } from 'call.store';

import { CallFooterChatButton } from './components/buttons/chat';
import { CallFooterRaiseHandButton } from './components/buttons/raise-hand';
import { CallFooterRecordButton } from './components/buttons/record';
import { CallFooterDocumentButton } from './components/buttons/document';
import { CallFooterFollowUpButton } from './components/buttons/follow-up';
import { CallFooterMoreButton } from './components/buttons/more';
import { CallFooterHangupButton } from './components/buttons/hangup';
import { CallFooterHangupControlButton } from './components/buttons/hangup-control';
import { CallFooterMorePopup } from './components/popups/more-popup/more-popup';

import './css/footer.css';

type CenterButton = {
	key: string;
	component: object;
	threshold: number;
	props?: Record<string, unknown>;
	on?: Record<string, (...args: unknown[]) => void>;
};

export const CallFooter = defineComponent({
	name: 'CallFooter',
	components: {
		CallMicrophoneButton,
		CallCameraButton,
		CallFooterChatButton,
		CallFooterMoreButton,
		CallFooterHangupButton,
		CallFooterHangupControlButton,
		CallFooterMorePopup,
	},
	setup(): { uiStore: UiStoreInstance }
	{
		return {
			uiStore: useUiStore(),
		};
	},
	data(): { isMoreOpen: boolean }
	{
		return {
			isMoreOpen: false,
		};
	},
	computed: {
		centerButtons(): CenterButton[]
		{
			return [
				{ key: 'raise-hand', component: CallFooterRaiseHandButton, threshold: 640 },
				{ key: 'screen-share', component: CallScreenShareButton, threshold: 700, props: { 'test-id': 'call-footer-screen-share-button' } },
				{ key: 'record', component: CallFooterRecordButton, threshold: 760, on: { click: this.onRecordClick } },
				{ key: 'document', component: CallFooterDocumentButton, threshold: 820, on: { click: this.onDocumentClick } },
				{ key: 'follow-up', component: CallFooterFollowUpButton, threshold: 880 },
			];
		},
		collapsedButtons(): Set<string>
		{
			const w = this.uiStore.layoutWidth;

			return new Set(this.centerButtons.filter((btn) => w < btn.threshold).map((btn) => btn.key));
		},
		isMoreVisible(): boolean
		{
			return this.collapsedButtons.size > 0;
		},
	},
	watch: {
		isMoreVisible(visible: boolean): void
		{
			if (!visible)
			{
				this.isMoreOpen = false;
			}
		},
	},
	methods: {
		isInCenter(key: string): boolean
		{
			return !this.collapsedButtons.has(key);
		},
		toggleMore(): void
		{
			this.isMoreOpen = !this.isMoreOpen;
		},
		onRecordClick(): void
		{
			// TODO: open record menu when migrated
		},
		onDocumentClick(): void
		{
			// TODO: open document menu when migrated
		},
		onHangupControlClick(): void
		{
			// TODO: open hangup-control menu when migrated
		},
		onMicCornerClick(): void
		{
			// TODO: open microphone device popup when migrated
		},
		onCameraCornerClick(): void
		{
			// TODO: open camera device popup when migrated
		},
	},
	template: /* HTML */`
		<div class="call-footer">
			<div class="call-footer__buttons --left">
				<CallMicrophoneButton test-id="call-footer-microphone-button" @corner-click="onMicCornerClick" />
				<CallCameraButton test-id="call-footer-camera-button" @corner-click="onCameraCornerClick" />
			</div>
			<div class="call-footer__buttons --center">
				<CallFooterChatButton />
				<template v-for="btn in centerButtons" :key="btn.key">
					<Teleport
						v-if="isInCenter(btn.key) || isMoreOpen"
						to=".js-call-footer-more-popup"
						:disabled="isInCenter(btn.key)"
					>
						<component :is="btn.component" v-bind="btn.props || {}" v-on="btn.on || {}" />
					</Teleport>
				</template>
				<CallFooterMoreButton v-if="isMoreVisible" :is-open="isMoreOpen" @click="toggleMore" />
			</div>
			<div class="call-footer__buttons --right">
				<CallFooterHangupButton />
				<CallFooterHangupControlButton @click="onHangupControlClick" />
			</div>
			<CallFooterMorePopup v-if="isMoreOpen" />
		</div>
	`,
});
