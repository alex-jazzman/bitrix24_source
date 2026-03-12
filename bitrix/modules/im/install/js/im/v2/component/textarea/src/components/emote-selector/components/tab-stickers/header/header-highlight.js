import { ActionByUserType } from 'im.v2.const';
import { PermissionManager } from 'im.v2.lib.permission';

import '../css/header/header-highlight.css';

import type { JsonObject } from 'main.core';

const INITIAL_OFFSET = 12;
const ADD_BUTTON_WIDTH = 40;
const PACK_ITEM_WIDTH = 36;
const PACK_ITEM_GAP = 10;

// @vue/component
export const HeaderHighlight = {
	name: 'HeaderHighlight',
	props: {
		activeIndex: {
			type: Number,
			required: true,
		},
	},
	computed: {
		needAddButton(): boolean
		{
			return PermissionManager.getInstance().canPerformActionByUserType(ActionByUserType.createStickerPack);
		},
		offsetLeft(): number
		{
			const addButtonOffset = this.needAddButton ? ADD_BUTTON_WIDTH : 0;
			const elementIndex = Math.max(0, this.activeIndex);
			const itemWidth = PACK_ITEM_WIDTH + PACK_ITEM_GAP;

			return INITIAL_OFFSET + addButtonOffset + (itemWidth * elementIndex);
		},
		highlightStyles(): JsonObject
		{
			return {
				left: `${this.offsetLeft}px`,
			};
		},
	},
	template: `
		<div class="bx-im-sticker-header-highlight__container" :style="highlightStyles">
			<div class="bx-im-sticker-header-highlight__marker"></div>
		</div>
	`,
};
