import { ChatTextarea } from 'im.v2.component.textarea';

import { SilentModeService } from 'imopenlines.v2.provider.service';

import { SilentModeManager } from './classes/silent-mode-manager';
import { SilentMode } from './components/silent-mode';

import type { JsonObject } from 'main.core';

import './css/textarea.css';

// @vue/component
export const OpenLinesTextarea = {
	name: 'OpenLinesTextarea',
	components: { ChatTextarea, SilentMode },
	props:
	{
		dialogId: {
			type: String,
			default: '',
		},
	},
	data(): JsonObject
	{
		return {
			isSilentModeLoading: false,
		};
	},
	computed:
	{
		isSilentModeActive(): boolean
		{
			return this.silentModeManager.getStatus(this.dialogId);
		},
	},
	created()
	{
		this.silentModeManager = new SilentModeManager(this.$store, new SilentModeService());
	},
	methods:
	{
		async onSilentModeToggle(): Promise<void>
		{
			this.isSilentModeLoading = true;
			await this.silentModeManager.toggle(this.dialogId);
			this.isSilentModeLoading = false;
		},
	},
	template: `
		<ChatTextarea
			:dialogId="dialogId"
			:key="dialogId"
		>
			<template #bottom-panel-buttons>
				<div class="bx-imol-textarea-buttons">
					<SilentMode
						:isActive="isSilentModeActive"
						:isLoading="isSilentModeLoading"
						@toggle="onSilentModeToggle"
					/>
				</div>
			</template>
		</ChatTextarea>
	`,
};
