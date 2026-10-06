import { Event, Loc, Tag } from 'main.core';

import { sendCatalogAnalytics } from '../utils/analytics';
import { renderIcon } from '../utils/icons.js';
import { openVibecodeDashboard, VIBECODE_DASHBOARD_URL } from '../utils/links';

export function renderPopupTitleLink(): HTMLElement
{
	const titleLabel = (Loc.getMessage('VIBECODECONNECTOR_CATALOG_TITLE') ?? '');

	const titleLinkNode = Tag.render`
		<a
			class="vibecode-catalog__title vibecode-catalog__title--link ui-headline --md --accent"
			href="${VIBECODE_DASHBOARD_URL}"
			target="_blank"
			rel="noopener noreferrer"
			aria-label="${titleLabel}"
			title="${titleLabel}"
		>
			<span class="vibecode-catalog__title-logo" aria-hidden="true">
				<span class="vibecode-catalog__title-logo-text">${titleLabel}</span>
			</span>
			<span class="vibecode-catalog__title-breadcrumb" aria-hidden="true">
				${renderIcon('chevron', 18)}
			</span>
		</a>
	`;

	Event.bind(titleLinkNode, 'click', (event: MouseEvent) => {
		event.preventDefault();
		event.stopPropagation();
		sendCatalogAnalytics({ event: 'click_vibecode', c_section: 'header' });
		openVibecodeDashboard();
	});

	return titleLinkNode;
}
