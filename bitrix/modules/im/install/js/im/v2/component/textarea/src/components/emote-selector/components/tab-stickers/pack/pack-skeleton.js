import { Shimmer } from 'im.v2.component.elements.loader';

import '../css/pack/pack-skeleton.css';

const PACK_COUNT = 2;
const STICKERS_IN_PACK = 8;

// @vue/component
export const PackSkeleton = {
	name: 'PackSkeleton',
	components: { Shimmer },
	computed: {
		STICKERS_IN_PACK: () => STICKERS_IN_PACK,
		PACK_COUNT: () => PACK_COUNT,
	},
	template: `
		<div v-for="pack in PACK_COUNT" :key="pack" class="bx-im-sticker-pack-skeleton__container">
			<div class="bx-im-sticker-pack-skeleton__header">
				<Shimmer :width="280" :height="12" />
			</div>
			<div class="bx-im-sticker-pack-skeleton__stickers">
				<Shimmer v-for="sticker in STICKERS_IN_PACK" :key="sticker" :width="62" :height="62" />
			</div>
		</div>
	`,
};
