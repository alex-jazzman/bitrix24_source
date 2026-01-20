import 'main.polyfill.intersectionobserver';

import { StickerItem } from './sticker-item';
import { RECENT_PACK_KEY } from '../tab-stickers';

import '../css/pack-item.css';

import type { ImModelStickerPack } from 'im.v2.model';

// @vue/component
export const PackItem = {
	name: 'PackItem',
	components: { StickerItem },
	props: {
		packKey: {
			type: String,
			required: true,
		},
		dialogId: {
			type: String,
			required: true,
		},
	},
	emits: ['close', 'activePackChange'],
	computed: {
		pack(): ImModelStickerPack
		{
			if (this.isRecent)
			{
				return {
					name: this.loc('IM_TEXTAREA_STICKER_SELECTOR_STICKERS_RECENT'),
					stickers: this.recent,
				};
			}

			return this.$store.getters['messages/stickers/getPackByKey'](this.packKey);
		},
		isRecent(): boolean
		{
			return this.packKey === RECENT_PACK_KEY;
		},
		recent(): string[]
		{
			return this.$store.getters['messages/stickers/getRecent'];
		},
		stickers(): string[]
		{
			return this.pack.stickers;
		},
	},
	mounted()
	{
		this.getObserver().observe(this.$refs.packItem);
	},
	beforeUnmount()
	{
		this.getObserver().unobserve(this.$refs.packItem);
	},
	methods: {
		getObserver(): IntersectionObserver
		{
			if (this.observer)
			{
				return this.observer;
			}

			this.observer = new IntersectionObserver((entries) => {
				entries.forEach((entry) => {
					if (entry.intersectionRatio > 0.5)
					{
						this.$emit('activePackChange', this.packKey);
					}
				});
			}, {
				threshold: [0, 0.5, 1],
			});

			return this.observer;
		},
		onClose(): void
		{
			this.$emit('close');
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<div class="bx-im-stickers-pack-item__container" ref="packItem">
			<div class="bx-im-stickers-pack-item__header">
				{{ pack.name }}
			</div>
			<div class="bx-im-stickers-pack-item__grid">
				<StickerItem
					v-for="key in stickers"
					:dialogId="dialogId"
					:key="key"
					:stickerKey="key"
					@close="onClose"
				/>
			</div>
		</div>
	`,
};
