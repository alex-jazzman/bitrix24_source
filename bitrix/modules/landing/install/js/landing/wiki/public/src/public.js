import {Event, Type, Text, Dom} from 'main.core';
import {SliderHacks} from 'landing.sliderhacks';

/**
 * Rejects hrefs whose scheme can execute code (DOM-XSS): javascript:, data:,
 * vbscript:, file:. Everything else is safe - http(s), mailto:, tel:,
 * #anchors, relative paths, schemeless values. Whitespace and control chars
 * are stripped before the scheme is matched, otherwise `java\tscript:` slips
 * through (the url parser drops the tab itself).
 * Duplicated on purpose across separate landing build contexts - keep the
 * copies in sync.
 * @param {string} href
 * @returns {boolean}
 */
function isSafeHref(href: string): boolean
{
	// eslint-disable-next-line no-control-regex
	const value = String(href || '').trim().replace(/[\x00-\x20]/g, '');

	// file: is kept in its marker form: on mobile hits Block does not resolve
	// the disk download link and the app resolves the marker itself. Mirror of
	// Sanitizer::MARKER_ONLY_URL_SCHEMES
	if (/^file:#diskFile\d+$/i.test(value))
	{
		return true;
	}

	const match = value.match(/^([a-z][a-z0-9+.-]*):/i);
	const scheme = match ? match[1].toLowerCase() : '';

	return ['javascript', 'data', 'vbscript', 'file'].indexOf(scheme) === -1;
}

Event.bind(document, 'click', (event: MouseEvent) => {
	if (Type.isDomNode(event.target))
	{
		const link = event.target.closest('a:not(.ui-btn):not([data-fancybox])');
		if (Type.isDomNode(link))
		{
			const isCurrentPageLink =
				Type.isStringFilled(link.href)
				&& link.hash !== ''
				&& link.pathname === document.location.pathname
				&& link.hostname === document.location.hostname;
			if (Type.isStringFilled(link.href) && link.target !== '_blank' && !isCurrentPageLink)
			{
				// preventDefault stays outside the scheme check: it is what keeps
				// the browser from running a javascript: href on its own
				event.preventDefault();

				// reloadSlider puts the url into iframe.src and pushHistory feeds
				// the same sink on the next back/forward click, so values stored
				// before the server-side sanitizer are filtered here as well
				if (isSafeHref(link.href))
				{
					BX.Landing.Pub.TopPanel.pushHistory(link.href);
					void SliderHacks.reloadSlider(link.href);
				}
			}
		}

		const pseudoLink = event.target.closest('[data-pseudo-url]');
		if (Type.isDomNode(pseudoLink))
		{
			const urlParams = Dom.attr(pseudoLink, 'data-pseudo-url');

			if (
				Text.toBoolean(urlParams.enabled)
				&& Type.isStringFilled(urlParams.href)
				&& urlParams.href.indexOf('/bitrix/services/main/ajax.php?action=landing.api.diskFile.download') !== 0
			)
			{
				// the executable scheme is dropped before the query is glued on:
				// landing/public.js is loaded on the same page and resolves the
				// legitimate help: markers rewritten by Landing::parseLocalUrl
				if (!isSafeHref(urlParams.href))
				{
					return;
				}

				if (urlParams.query)
				{
					urlParams.href += (urlParams.href.includes('?')) ? '&' : '?';
					urlParams.href += urlParams.query;
				}

				if (urlParams.target === '_self')
				{
					event.stopImmediatePropagation();
					BX.Landing.Pub.TopPanel.pushHistory(urlParams.href);
					void SliderHacks.reloadSlider(urlParams.href);
				}
				else
				{
					top.open(urlParams.href, urlParams.target);
				}
			}
		}
	}
});
