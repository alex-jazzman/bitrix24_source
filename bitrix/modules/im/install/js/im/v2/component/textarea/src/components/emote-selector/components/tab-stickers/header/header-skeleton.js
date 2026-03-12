import { Shimmer } from 'im.v2.component.elements.loader';

import '../css/header/header-skeleton.css';

const STICKERS_COUNT = 7;

// @vue/component
export const HeaderSkeleton = {
	name: 'HeaderSkeleton',
	components: { Shimmer },
	computed: {
		STICKERS_COUNT: () => STICKERS_COUNT,
	},
	template: `
		<div class="bx-im-stickers-header-skeleton__container">
			<Shimmer v-for="sticker in STICKERS_COUNT" :key="sticker" :width="36" :height="36" />
		</div>
	`,
};
