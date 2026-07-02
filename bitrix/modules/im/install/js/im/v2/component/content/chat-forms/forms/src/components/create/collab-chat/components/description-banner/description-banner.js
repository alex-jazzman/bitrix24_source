import { type JsonObject } from 'main.core';
import { BIcon, Outline as OutlineIcons } from 'ui.icon-set.api.vue';

import { PromoId } from 'im.v2.const';
import { PromoManager } from 'im.v2.lib.promo';

import './css/description-banner.css';

// @vue/component
export const DescriptionBanner = {
	name: 'DescriptionBanner',
	components: { BIcon },
	emits: ['close'],
	data(): JsonObject
	{
		return {
			showDescriptionBanner: PromoManager.getInstance().needToShow(PromoId.createCollabNestedChatDescription),
		};
	},
	computed: {
		OutlineIcons: () => OutlineIcons,
		preparedText(): string
		{
			return this.loc('IM_CREATE_COLLAB_CHAT_BANNER_TEXT', {
				'#BR#': '\n',
			});
		},
	},
	methods: {
		onClose()
		{
			this.showDescriptionBanner = false;
			void PromoManager.getInstance().markAsWatched(PromoId.createCollabNestedChatDescription);
		},
		loc(phraseCode: string, replacements: {[p: string]: string} = {}): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
		},
	},
	template: `
		<div v-if="showDescriptionBanner" class="bx-im-create-collab-chat-description-banner__container">
			<div class="bx-im-create-collab-chat-description-banner__title">
				{{ loc('IM_CREATE_COLLAB_CHAT_BANNER_TITLE') }}
			</div>
			<div class="bx-im-create-collab-chat-description-banner__text">
				{{ preparedText }}
			</div>
			<BIcon
				:name="OutlineIcons.CROSS_L"
				:hoverable="true"
				class="bx-im-create-collab-chat-description-banner__close"
				@click="onClose"
			/>
		</div>
	`,
};
