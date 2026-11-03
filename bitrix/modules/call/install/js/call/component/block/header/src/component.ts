import { defineComponent } from 'ui.vue3';

import { CallLogo } from 'call.component.ui.logo';
import { CallHeaderSecurityIndicator } from './components/indicators/security-indicator/security-indicator';
import { CallRecordingIndicator } from 'call.component.block.record-indicator';
import { CallHeaderControlButton } from './components/buttons/control';
import { CallHeaderFullscreenButton } from './components/buttons/fullscreen';
import { CallHeaderParticipantButton } from './components/buttons/participant';
import { CallHeaderRateButton } from './components/buttons/rate';
import { CallHeaderViewModeButton } from './components/buttons/view-mode';

import { useUiStore } from 'call.store';
import type { UiStoreInstance } from 'call.store';
import type { LocFunction } from 'call.plugin.loc';

import './css/header.css';

export const CallHeader = defineComponent({
	name: 'CallHeader',
	components: {
		CallLogo,
		CallHeaderSecurityIndicator,
		CallRecordingIndicator,
		CallHeaderControlButton,
		CallHeaderFullscreenButton,
		CallHeaderParticipantButton,
		CallHeaderRateButton,
		CallHeaderViewModeButton,
	},
	inject: {
		loc: { default: (): LocFunction => (key: string): string => key },
		languageId: { default: 'en' },
	},
	setup(): { uiStore: UiStoreInstance }
	{
		return {
			uiStore: useUiStore(),
		};
	},
	computed: {
		isGridMode(): boolean
		{
			return this.uiStore.isGridMode;
		},
		isFullscreen(): boolean
		{
			return this.uiStore.isFullScreen;
		},
	},
	template: /* HTML */`
		<div class="call-header">
			<div class="call-header__left">
				<CallLogo color="white" :language="languageId"/>
				<CallHeaderSecurityIndicator/>
				<CallRecordingIndicator/>
			</div>
			<div class="call-header__right">
				<CallHeaderViewModeButton/>
				<CallHeaderFullscreenButton/>
				<CallHeaderRateButton/>
				<CallHeaderControlButton/>
				<CallHeaderParticipantButton/>
			</div>
		</div>
	`,
});
