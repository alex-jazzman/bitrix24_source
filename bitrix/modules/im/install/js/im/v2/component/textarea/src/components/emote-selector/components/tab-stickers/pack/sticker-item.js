import '../css/sticker-item.css';

// @vue/component
export const StickerItem = {
	name: 'StickerItem',
	props: {
		sticker: {
			type: Object,
			required: true,
		},
	},
	template: `
		<div class="bx-im-sticker-item">
			<img :src="sticker.uri" alt="" loading="lazy" draggable="false" />
		</div>
	`,
};
