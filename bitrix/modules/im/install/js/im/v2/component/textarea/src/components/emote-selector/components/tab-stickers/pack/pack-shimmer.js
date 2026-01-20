import '../css/shimmer.css';

const SHIMMER_ROWS_COUNT = 2;
const SHIMMER_ITEMS_COUNT = 5;

// @vue/component
export const PackShimmer = {
	name: 'PackShimmer',
	computed: {
		SHIMMER_ROWS_COUNT: () => SHIMMER_ROWS_COUNT,
		SHIMMER_ITEMS_COUNT: () => SHIMMER_ITEMS_COUNT,
	},
	template: `
		<div>
			<div v-for="i in SHIMMER_ROWS_COUNT" :key="i" class="bx-im-stickers-pack-item__container">
				<div class="bx-im-elements-gradient-shimmer bx-im-stickers-pack-item__header-shimmer"></div>
				<div class="bx-im-stickers-pack-item__grid">
					<div v-for="j in SHIMMER_ITEMS_COUNT * i" :key="i + '-' + j" class="bx-im-sticker-item">
						<div class="bx-im-elements-gradient-shimmer bx-im-sticker-item__shimmer"></div>
					</div>
				</div>
			</div>
		</div>
	`,
};
