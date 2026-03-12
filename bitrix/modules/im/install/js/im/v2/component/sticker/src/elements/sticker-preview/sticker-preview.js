import { Event, ZIndexManager } from 'main.core';

import './sticker-preview.css';

import type { ImModelSticker } from 'im.v2.model';

// @vue/component
export const StickerPreview = {
	name: 'StickerPreview',
	props: {
		sticker: {
			type: Object,
			required: true,
		},
	},
	emits: ['close'],
	computed: {
		stickerItem(): ImModelSticker
		{
			return this.sticker;
		},
	},
	mounted()
	{
		Event.bind(document, 'mouseup', this.onMouseUp);
		ZIndexManager.register(this.$refs['preview-overlay']);
		ZIndexManager.bringToFront(this.$refs['preview-overlay']);
	},
	beforeUnmount()
	{
		ZIndexManager.unregister(this.$refs['preview-overlay']);
		Event.unbind(document, 'mouseup', this.onMouseUp);
	},
	methods: {
		onMouseUp()
		{
			this.$emit('close');
		},
	},
	template: `
		<Teleport to="body">
			<div class="bx-im-sticker-preview__overlay" ref="preview-overlay">
				<div class="bx-im-sticker-preview__container">
					<img :src="stickerItem.uri" alt="" draggable="false" class="bx-im-sticker-preview__image" />
				</div>
			</div>
		</Teleport>
	`,
};
