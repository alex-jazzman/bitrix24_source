import { BIcon, Outline as OutlineIcons } from 'ui.icon-set.api.vue';

import { Color } from 'im.v2.const';

import { RECENT_PACK_KEY } from '../tab-stickers';

import '../css/header-item.css';

const ICON_SIZE = 28;

// @vue/component
export const HeaderItem = {
	name: 'HeaderItem',
	components: { BIcon },
	props: {
		packKey: {
			type: String,
			required: true,
		},
		active: {
			type: Boolean,
			default: false,
		},
	},
	computed: {
		OutlineIcons: () => OutlineIcons,
		ICON_SIZE: () => ICON_SIZE,
		Color: () => Color,
		packName(): string
		{
			if (this.packKey === RECENT_PACK_KEY)
			{
				return this.loc('IM_TEXTAREA_STICKER_SELECTOR_STICKERS_RECENT');
			}

			const pack = this.$store.getters['messages/stickers/getPackByKey'](this.packKey);

			return pack?.name || '';
		},
		isRecent(): boolean
		{
			return this.packKey === RECENT_PACK_KEY;
		},
		classes(): { [className: string]: boolean }
		{
			return { '--active': this.active };
		},
		packCover(): string
		{
			return this.$store.getters['messages/stickers/getPackCover'](this.packKey);
		},
	},
	methods: {
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<div class="bx-im-stickers-header__item" :class="classes" :title="packName">
			<BIcon
				v-if="isRecent"
				:name="OutlineIcons.CLOCK"
				:color="Color.gray90"
				:title="loc('IM_TEXTAREA_STICKER_SELECTOR_STICKERS_RECENT')"
				:size="ICON_SIZE"
			/>
			<span v-else>
				<img v-if="packCover" :src="packCover" alt="" loading="lazy"/>
			</span>
		</div>
	`,
};
