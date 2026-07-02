import { type JsonObject } from 'main.core';
import { EventEmitter, type BaseEvent } from 'main.core.events';
import { BIcon, Outline as OutlineIcons } from 'ui.icon-set.api.vue';

import { Spinner, SpinnerSize, SpinnerColor } from 'im.v2.component.elements.loader';
import { EventType } from 'im.v2.const';

import { OpenLinesMessageComponent } from 'imopenlines.v2.const';
import { useDelay } from 'imopenlines.v2.lib.utils';

import { SilentModePopup } from './silent-mode-popup';

type OpenLinesComponentId = $Values<typeof OpenLinesMessageComponent>;

const POPUP_SHOW_DELAY = 600;

// @vue/component
export const SilentMode = {
	name: 'SilentMode',
	components: { BIcon, SilentModePopup, Spinner },
	props: {
		dialogId: {
			type: String,
			required: true,
		},
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
	computed: {
		OutlineIcons: () => OutlineIcons,
		SpinnerSize: () => SpinnerSize,
		SpinnerColor: () => SpinnerColor,
	},
	created()
	{
		this.delayedPopup = useDelay(POPUP_SHOW_DELAY);
		this.onBeforeAddMessageToModel = this.onBeforeAddMessageToModel.bind(this);
		EventEmitter.subscribe(EventType.sending.onBeforeAddMessageToModel, this.onBeforeAddMessageToModel);
	},
	mounted()
	{
		this.selectorElement = this.$refs.silentModeButton;
	},
	beforeUnmount()
	{
		this.delayedPopup.stop();
		EventEmitter.unsubscribe(EventType.sending.onBeforeAddMessageToModel, this.onBeforeAddMessageToModel);
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
		onBeforeAddMessageToModel(event: BaseEvent): ?{ componentId: OpenLinesComponentId }
		{
			const { dialogId } = event.getData();
			if (dialogId !== this.dialogId)
			{
				return null;
			}

			if (!this.isActive)
			{
				return null;
			}

			return { componentId: OpenLinesMessageComponent.HiddenMessage };
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
				class="bx-imol-textarea-icon"
				:class="{ '--active': isActive }"
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
