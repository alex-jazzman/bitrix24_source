import { Event as BEvent, Loc, Tag, Text } from 'main.core';

import { PopupPrefixId } from '../../../../../user-mini-profile';

import type { HintParams } from 'ui.vue3.directives.hint';

const HelpArticleCode = 'redirect=detail&code=17980386';

function openHelper(event: Event): void
{
	event.preventDefault();
	if (top.BX?.Helper)
	{
		top.BX.Helper.show(HelpArticleCode);
	}
}

function parseHintText(): { beforeText: ?string, linkText: ?string, afterText: ?string }
{
	const phrase = Loc.getMessage('INTRANET_USER_MINI_PROFILE_ROLE_FIRST_ADMIN_HINT');
	const parts = phrase.split('#HELP_LINK#');

	return {
		beforeText: parts[0] || null,
		linkText: parts[1] || null,
		afterText: parts[2] || null,
	};
}

function createHintContent(): HTMLElement
{
	const hintText = parseHintText();

	const link = Tag.render`
		<a class="intranet-user-mini-profile__first-admin-badge_hint-link">${hintText.linkText}</a>
	`;
	BEvent.bind(link, 'click', openHelper);

	return Tag.render`
		<div class="intranet-user-mini-profile__first-admin-badge_hint-content">
			<div class="intranet-user-mini-profile__first-admin-badge_hint-content_hint-block">
				<span>${hintText.beforeText}</span>
				<span>${link}</span>
				<span>${hintText.afterText}</span>
			</div>
		</div>
	`;
}

export function getFirstAdminHintParams(): HintParams
{
	return {
		interactivity: true,
		popupOptions: {
			id: `${PopupPrefixId}first-admin-hint-${Text.getRandom()}`,
			className: 'intranet-user-mini-profile__first-admin-badge_hint',
			darkMode: false,
			offsetTop: 2,
			background: 'var(--ui-color-bg-content-inapp)',
			padding: 6,
			angle: true,
			targetContainer: document.body,
			offsetLeft: 20,
			cacheable: false,
			content: createHintContent(),
		},
	};
}
