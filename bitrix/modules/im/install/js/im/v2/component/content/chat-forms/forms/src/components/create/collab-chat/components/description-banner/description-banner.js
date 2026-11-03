import { type JsonObject } from 'main.core';
import { BIcon, Outline as OutlineIcons } from 'ui.icon-set.api.vue';
import { HeadlineXs, TextXs } from 'ui.system.typography.vue';

import { PromoId } from 'im.v2.const';
import { Feature, FeatureManager } from 'im.v2.lib.feature';
import { PromoManager } from 'im.v2.lib.promo';

import './css/description-banner.css';

const AIR_CLOSE_ICON_SIZE = 18;

// @vue/component
export const DescriptionBanner = {
	name: 'DescriptionBanner',
	components: { BIcon, HeadlineXs, TextXs },
	emits: ['close'],
	setup(): Object
	{
		return { AIR_CLOSE_ICON_SIZE };
	},
	data(): JsonObject
	{
		return {
			showDescriptionBanner: PromoManager.getInstance().needToShow(PromoId.createCollabNestedChatDescription),
		};
	},
	computed: {
		OutlineIcons: () => OutlineIcons,
		isAirDesignEnabled(): boolean
		{
			return FeatureManager.isFeatureAvailable(Feature.isAirDesignEnabled);
		},
		preparedText(): string
		{
			return this.loc('IM_CREATE_COLLAB_CHAT_BANNER_TEXT_MSGVER_1', {
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
	// The gradient, the border and the illustration are shared: they already sit on air tokens.
	// The air branch replaces the typography with design system components and turns the cross
	// into a real button: an icon reacting to a click alone has no name and no keyboard.
	template: `
		<div
			v-if="showDescriptionBanner"
			class="bx-im-create-collab-chat-description-banner__container"
			data-testid="im-chat-form-collab-chat-banner"
		>
			<template v-if="isAirDesignEnabled">
				<HeadlineXs
					className="bx-im-chat-forms-collab-chat-banner__title"
				>{{ loc('IM_CREATE_COLLAB_CHAT_BANNER_TITLE') }}</HeadlineXs>
				<TextXs
					tag="div"
					className="bx-im-chat-forms-collab-chat-banner__text"
				>{{ preparedText }}</TextXs>
				<button
					type="button"
					class="bx-im-chat-forms-collab-chat-banner__close"
					:aria-label="loc('IM_CREATE_COLLAB_CHAT_BANNER_CLOSE_ARIA')"
					data-testid="im-chat-form-collab-chat-banner-close"
					@click="onClose"
				>
					<BIcon
						:name="OutlineIcons.CROSS_L"
						:size="AIR_CLOSE_ICON_SIZE"
						color="var(--ui-color-base-4)"
						hoverable
					/>
				</button>
			</template>
			<template v-else>
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
					data-testid="im-chat-form-collab-chat-banner-close"
					@click="onClose"
				/>
			</template>
		</div>
	`,
};
