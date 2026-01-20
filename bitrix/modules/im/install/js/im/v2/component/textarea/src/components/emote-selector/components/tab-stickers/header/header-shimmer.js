import '../css/shimmer.css';

const SHIMMER_ITEMS_COUNT = 8;

// @vue/component
export const HeaderShimmer = {
	name: 'HeaderShimmer',
	computed: {
		SHIMMER_ITEMS_COUNT: () => SHIMMER_ITEMS_COUNT,
	},
	template: `
		<div class="bx-im-stickers-header-shimmer__container">
			<div v-for="i in SHIMMER_ITEMS_COUNT" :key="i" class="bx-im-stickers-header__item">
				<div class="bx-im-elements-gradient-shimmer bx-im-stickers-header__shimmer"></div>
			</div>
		</div>
	`,
};
