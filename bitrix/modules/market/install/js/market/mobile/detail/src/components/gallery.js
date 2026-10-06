export const Gallery = {
	props: {
		images: {
			type: Array,
			default: () => [],
		},
	},
	template: `
		<div class="market-mobile-detail-gallery__items">
			<div
				v-for="(imageData, index) in images"
				:key="'img-' + index"
				class="market-mobile-detail-gallery__item"
			>
				<img :src="imageData.PREVIEW">
			</div>
		</div>
	`,
};
