import { Loc, Dom } from 'main.core';
import { HeadlineXs, TextXs } from 'ui.system.typography.vue';

import { openHelpdeskArticle } from 'im.v2.lib.helpdesk';
import { Feature, FeatureManager } from 'im.v2.lib.feature';

import './css/description-banner.css';

const LINK_CSS_CLASS = 'bx-im-create-collab-description-banner__link';
const TITLE_LINK_MODIFIER = '--title';
const INVITE_LINK_MODIFIER = '--invite';
// A link lives inside the phrase and has to wrap with the text around it, so it stays an inline
// element and gets the semantics of a button instead of the tag of one.
const LINK_SEMANTICS = 'role="button" tabindex="0"';
const TITLE_LINK_TAG = `<span class="${LINK_CSS_CLASS} ${TITLE_LINK_MODIFIER} --solid"`
	+ ` data-testid="im-chat-form-collab-banner-title-link" ${LINK_SEMANTICS}>`;
const INVITE_LINK_TAG = `<span class="${LINK_CSS_CLASS} ${INVITE_LINK_MODIFIER} --dashed"`
	+ ` data-testid="im-chat-form-collab-banner-invite-link" ${LINK_SEMANTICS}>`;

// @vue/component
export const DescriptionBanner = {
	name: 'DescriptionBanner',
	components: { HeadlineXs, TextXs },
	computed: {
		isAirDesignEnabled(): boolean
		{
			return FeatureManager.isFeatureAvailable(Feature.isAirDesignEnabled);
		},
		preparedTitle(): string
		{
			return Loc.getMessage('IM_CREATE_COLLAB_BANNER_TITLE', {
				'[learn-more]': TITLE_LINK_TAG,
				'[/learn-more]': '</span>',
			});
		},
		preparedInviteText(): string
		{
			return Loc.getMessage('IM_CREATE_COLLAB_BANNER_TEXT_2', {
				'[learn-more]': INVITE_LINK_TAG,
				'[/learn-more]': '</span>',
			});
		},
	},
	methods: {
		// The listener sits on the whole phrase, so the link inside it is recognised by its own
		// modifier; a keyboard activation of the link reaches the very same check.
		onTitleClick(event: Event)
		{
			if (!Dom.hasClass(event.target, TITLE_LINK_MODIFIER))
			{
				return;
			}

			const ARTICLE_CODE = '22706764';
			openHelpdeskArticle(ARTICLE_CODE);
		},
		onInviteClick(event: Event)
		{
			if (!Dom.hasClass(event.target, INVITE_LINK_MODIFIER))
			{
				return;
			}

			const ARTICLE_CODE = '22706836';
			openHelpdeskArticle(ARTICLE_CODE);
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	// The card and the illustration are shared: air only retunes their colours and spacing through
	// the custom properties of the block. The air branch of the markup replaces the typography with
	// design system components, and the links stay in the text as spans of the phrase itself.
	template: `
		<div
			class="bx-im-create-collab-description-banner__container"
			data-testid="im-chat-form-collab-banner"
			ref="container"
		>
			<div class="bx-im-create-collab-description-banner__icon"></div>
			<div class="bx-im-create-collab-description-banner__content">
				<template v-if="isAirDesignEnabled">
					<HeadlineXs className="bx-im-chat-forms-collab-banner__title">
						<span
							v-html="preparedTitle"
							@click="onTitleClick"
							@keydown.enter.prevent="onTitleClick"
							@keydown.space.prevent="onTitleClick"
						></span>
					</HeadlineXs>
					<TextXs
						tag="div"
						className="bx-im-chat-forms-collab-banner__text"
					>{{ loc('IM_CREATE_COLLAB_BANNER_TEXT_1') }}</TextXs>
					<TextXs tag="div" className="bx-im-chat-forms-collab-banner__text">
						<span
							v-html="preparedInviteText"
							@click="onInviteClick"
							@keydown.enter.prevent="onInviteClick"
							@keydown.space.prevent="onInviteClick"
						></span>
					</TextXs>
				</template>
				<template v-else>
					<div
						class="bx-im-create-collab-description-banner__title"
						v-html="preparedTitle"
						@click="onTitleClick"
						@keydown.enter.prevent="onTitleClick"
						@keydown.space.prevent="onTitleClick"
					></div>
					<div class="bx-im-create-collab-description-banner__text">
						{{ loc('IM_CREATE_COLLAB_BANNER_TEXT_1') }}
					</div>
					<div
						class="bx-im-create-collab-description-banner__text"
						v-html="preparedInviteText"
						@click="onInviteClick"
						@keydown.enter.prevent="onInviteClick"
						@keydown.space.prevent="onInviteClick"
					></div>
				</template>
			</div>
		</div>
	`,
};
