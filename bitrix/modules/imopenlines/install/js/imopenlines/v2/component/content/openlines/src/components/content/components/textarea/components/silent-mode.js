import { BIcon, Outline as OutlineIcons } from 'ui.icon-set.api.vue';
import { Spinner, SpinnerSize, SpinnerColor } from 'im.v2.component.elements.loader';
import { Color } from 'im.v2.const';

import { SilentModePopup } from './silent-mode-popup';
import { useDelay } from '../utils/delay';

import type { JsonObject } from 'main.core';

const ICON_SIZE = 24;
const POPUP_SHOW_DELAY = 600;

// @vue/component
export const SilentMode = {
	name: 'SilentMode',
	components: { BIcon, SilentModePopup, Spinner },
	props:
	{
		isActive: {
			type: Boolean,
			required: true,
		},
		isLoading: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['toggle'],
	data(): JsonObject
	{
		return {
			selectorElement: null,
			showPopup: false,
		};
	},
	computed:
	{
		OutlineIcons: () => OutlineIcons,
		Color: () => Color,
		ICON_SIZE: () => ICON_SIZE,
		SpinnerSize: () => SpinnerSize,
		SpinnerColor: () => SpinnerColor,
		iconColor(): string
		{
			return this.isActive ? Color.accentBlue : Color.gray40;
		},
	},
	created()
	{
		this.delayedPopup = useDelay(POPUP_SHOW_DELAY);
	},
	mounted()
	{
		this.selectorElement = this.$refs.silentModeButton;
	},
	beforeUnmount()
	{
		this.delayedPopup.stop();
	},
	methods:
	{
		onToggle(): void
		{
			if (this.isLoading)
			{
				return;
			}

			this.$emit('toggle');
		},
		onPopupOpen(): void
		{
			const shouldShowPopup = this.isActive && !this.isLoading;
			if (shouldShowPopup)
			{
				this.delayedPopup.start(() => {
					this.showPopup = true;
				});
			}
		},
		onPopupClose(): void
		{
			this.delayedPopup.stop();
			this.showPopup = false;
		},
	},
	template: `
		<span
			ref="silentModeButton"
			@mouseenter="onPopupOpen"
			@mouseleave="onPopupClose"
		>
			<Spinner
				v-if="isLoading"
				:size="SpinnerSize.XS"
				:color="SpinnerColor.blue"
			/>
			<BIcon
				v-else
				:name="OutlineIcons.CROSSED_EYE"
				:size="ICON_SIZE"
				:color="iconColor"
				class="bx-im-textarea__icon"
				@click="onToggle"
			/>
		</span>
		<SilentModePopup
			v-if="showPopup"
			:bindElement="selectorElement"
			@close="onPopupClose"
		/>
	`,
};
