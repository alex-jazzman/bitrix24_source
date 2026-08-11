import { Type } from 'main.core';
import { BIcon, Outline as OutlineIcons } from 'ui.icon-set.api.vue';

import { type ImModelMessageMapBlockType } from 'im.v2.model';

import { BaseBlock } from '../base/base';

import './map.css';

// @vue/component
export const MapBlock = {
	name: 'MapBlock',
	components: { BaseBlock, BIcon },
	props: {
		message: {
			type: Object,
			required: true,
		},
		block: {
			type: Object,
			required: true,
		},
		dialogId: {
			type: String,
			required: true,
		},
	},
	computed: {
		OutlineIcons: () => OutlineIcons,
		mapBlock(): ImModelMessageMapBlockType
		{
			return this.block;
		},
		hasStatus(): boolean
		{
			return Type.isStringFilled(this.mapBlock.status);
		},
		hasText(): boolean
		{
			return Type.isStringFilled(this.mapBlock.text);
		},
	},
	template: `
		<BaseBlock
			:message="message"
			:block="block"
			:dialogId="dialogId"
		>
			<div class="bx-im-message-block-map__container">
				<div class="bx-im-message-block-map__image-container">
					<img :src="mapBlock.imageUrl" :alt="mapBlock.text" class="bx-im-message-block-map__image">
					<div
						v-if="hasStatus"
						:title="mapBlock.status"
						class="bx-im-message-block-map__location-status --ellipsis"
					>
						{{ mapBlock.status }}
					</div>
				</div>
				<div v-if="hasText" class="bx-im-message-block-map__location">
					<BIcon :name="OutlineIcons.LOCATION" class="bx-im-message-block-map__location-icon" />
					<div
						:title="mapBlock.text" 
						class="bx-im-message-block-map__location-text --line-clamp-2"
					>
						{{ mapBlock.text }}
					</div>
				</div>
			</div>
		</BaseBlock>
	`,
};
