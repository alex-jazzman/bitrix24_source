import { BIcon, Outline as OutlineIcons } from 'ui.icon-set.api.vue';

import '../css/components/sticker-fallback.css';

// @vue/component
export const StickerFallback = {
	name: 'StickerFallback',
	components: { BIcon },
	computed: {
		OutlineIcons: () => OutlineIcons,
	},
	methods: {
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<div class="bx-im-message-sticker-fallback__container">
			<div class="bx-im-message-sticker-fallback__content">
				<BIcon :name="OutlineIcons.ALERT" />
				{{ loc('IM_MESSAGE_STICKER_EMPTY') }}
			</div>
		</div>
	`,
};
