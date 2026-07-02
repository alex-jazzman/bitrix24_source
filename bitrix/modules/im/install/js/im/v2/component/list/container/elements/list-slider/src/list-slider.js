import { type JsonObject } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { BIcon, Outline as OutlineIcons } from 'ui.icon-set.api.vue';

import { EventType } from 'im.v2.const';
import { SlideAnimation } from 'im.v2.component.animation';
import { EscEventAction } from 'im.v2.lib.esc-manager';

import './css/list-slider.css';

// @vue/component
export const RecentListSlider = {
	name: 'RecentListSlider',
	components: { SlideAnimation, BIcon },
	emits: ['beforeClose', 'afterClose'],
	data(): JsonObject
	{
		return {
			showSlider: true,
		};
	},
	computed: {
		OutlineIcons: () => OutlineIcons,
	},
	created()
	{
		EventEmitter.subscribe(EventType.recent.closeListSlider, this.onCloseSliderEvent);
	},
	beforeUnmount()
	{
		EventEmitter.unsubscribe(EventType.recent.closeListSlider, this.onCloseSliderEvent);
	},
	methods: {
		onCloseSlider()
		{
			this.$emit('beforeClose');
			this.showSlider = false;
		},
		onCloseSliderEvent(): $Values<typeof EscEventAction>
		{
			this.onCloseSlider();

			return EscEventAction.handled;
		},
	},
	template: `
		<SlideAnimation appear @after-leave="$emit('afterClose')">
			<div v-if="showSlider" class="bx-im-list-container-slider">
				<div class="bx-im-list-container-slider__header">
					<div class="bx-im-list-container-slider__header_content">
						<BIcon
							:name="OutlineIcons.CHEVRON_LEFT_L"
							:hoverable="true"
							class="bx-im-list-container-slider__back-icon"
							@click="onCloseSlider"
						/>
						<slot name="header"></slot>
					</div>
					<div v-if="$slots['subheader']" class="bx-im-list-container-slider__subheader_content">
						<slot name="subheader"></slot>
					</div>
				</div>
				<div class="bx-im-list-container-slider__content">
					<slot name="content"></slot>
				</div>
			</div>
		</SlideAnimation>
	`,
};
