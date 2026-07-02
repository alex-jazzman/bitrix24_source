import { type JsonObject } from 'main.core';

import { Utils } from 'im.v2.lib.utils';

import { SourcePopup, type SourceItem } from './source-popup';

const HIDE_DELAY = 100;

// @vue/component
export const SourceHandler = {
	name: 'SourceHandler',
	components: { SourcePopup },
	props: {
		block: {
			type: Object,
			required: true,
		},
		messageId: {
			type: Number,
			required: true,
		},
	},
	data(): JsonObject
	{
		return {
			showPopup: false,
			currentSource: null,
			bindElement: null,
		};
	},
	computed: {
		popupId(): string
		{
			const uuid = Utils.text.getUuidV4();

			return `im-source-popup-${uuid}`;
		},
	},
	methods: {
		onClick(event: PointerEvent)
		{
			const sourceElement = event.target.closest('[data-source-id]');
			if (!sourceElement)
			{
				return;
			}

			const source = this.getSourceForId(sourceElement.dataset.sourceId);
			if (!source)
			{
				return;
			}

			Utils.browser.openLink(source.url);
		},
		onMouseOver(event: MouseEvent)
		{
			const sourceElement = event.target.closest('[data-source-id]');
			if (!sourceElement)
			{
				this.startHideTimer();

				return;
			}

			const hasActivePopupForElement = this.bindElement === sourceElement && this.showPopup;
			if (hasActivePopupForElement)
			{
				this.clearHideTimer();

				return;
			}

			const source = this.getSourceForId(sourceElement.dataset.sourceId);
			if (!source)
			{
				return;
			}

			this.clearHideTimer();
			this.showPopup = false;
			this.currentSource = source;
			this.bindElement = sourceElement;
			void this.$nextTick(() => {
				this.showPopup = true;
			});
		},
		onMouseLeave()
		{
			this.startHideTimer();
		},
		onPopupMouseEnter()
		{
			this.clearHideTimer();
		},
		startHideTimer()
		{
			clearTimeout(this.hideTimeout);
			this.hideTimeout = setTimeout(() => {
				this.showPopup = false;
			}, HIDE_DELAY);
		},
		clearHideTimer()
		{
			clearTimeout(this.hideTimeout);
		},
		getSourceForId(sourceId: string): ?SourceItem
		{
			const blockSources = this.block.sources ?? {};
			const rawSource = blockSources[sourceId];
			if (!rawSource)
			{
				return null;
			}

			return rawSource;
		},
	},
	template: `
		<div @click="onClick" @mouseover="onMouseOver" @mouseleave="onMouseLeave">
			<slot></slot>
		</div>
		<SourcePopup
			v-if="showPopup"
			:id="popupId"
			:source="currentSource"
			:bindElement="bindElement"
			@close="showPopup = false"
			@mouseEnter="onPopupMouseEnter"
			@mouseLeave="onMouseLeave"
		/>
	`,
};
