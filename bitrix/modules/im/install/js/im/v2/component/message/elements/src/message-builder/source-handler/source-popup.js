import { type PopupOptions } from 'main.popup';

import { MessengerPopup } from 'im.v2.component.elements.popup';
import { Utils } from 'im.v2.lib.utils';

import './source-popup.css';

export type SourceItem = {
	url: string,
	metaData?: {
		title: string,
		description: string,
	},
};

// @vue/component
export const SourcePopup = {
	name: 'SourcePopup',
	components: { MessengerPopup },
	props: {
		id: {
			type: String,
			required: true,
		},
		source: {
			type: Object,
			required: true,
		},
		bindElement: {
			type: Object,
			required: true,
		},
	},
	emits: ['close', 'mouseEnter', 'mouseLeave'],
	computed: {
		sourceItem(): SourceItem
		{
			return this.source;
		},
		popupConfig(): PopupOptions
		{
			return {
				bindElement: this.bindElement,
				targetContainer: document.body,
				autoHide: true,
				angle: { offset: 50 },
				bindOptions: { position: 'top' },
				padding: 0,
			};
		},
		metaData(): ?SourceItem['metaData']
		{
			return this.sourceItem.metaData;
		},
		title(): string
		{
			if (this.metaData?.title)
			{
				return this.metaData.title;
			}

			return Utils.text.getHostFromUrl(this.sourceItem.url);
		},
		description(): ?string
		{
			return this.metaData?.description;
		},
	},
	template: `
		<MessengerPopup
			:id="id"
			:config="popupConfig"
			@close="$emit('close')"
		>
			<div
				class="bx-im-source-popup__container"
				@mouseenter="$emit('mouseEnter')"
				@mouseleave="$emit('mouseLeave')"
			>
				<a :href="sourceItem.url" target="_blank" class="bx-im-source-popup__link">
					<div class="bx-im-source-popup__title --ellipsis">
						{{ title }}
					</div>
					<div 
						v-if="description" 
						class="bx-im-source-popup__description --line-clamp-2"
					>
						{{ description }}
					</div>
					<div class="bx-im-source-popup__url">{{ sourceItem.url }}</div>
				</a>
			</div>
		</MessengerPopup>
	`,
};
