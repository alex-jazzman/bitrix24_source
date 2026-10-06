export class Pseudolinks
{
	/**
	 * Constructor.
	 */
	constructor()
	{
		const checkPageLoaded = setInterval(() => {
			if (document.readyState === 'complete')
			{
				this.initPseudoLinks();
				clearInterval(checkPageLoaded);
			}
		}, 500);
	}

	/**
	 * Click callback.
	 *
	 * @return {void}
	 */
	initPseudoLinks()
	{
		const pseudoLinks = [].slice.call(document.querySelectorAll('[data-pseudo-url*="{"]'));
		if (pseudoLinks.length > 0)
		{
			pseudoLinks.forEach((link) => {
				const linkOptionsJson = link.getAttribute('data-pseudo-url');
				const linkOptions = JSON.parse(linkOptionsJson);
				if (
					linkOptions.href
					&& linkOptions.enabled
					&& linkOptions.href.indexOf('/bitrix/services/main/ajax.php?action=landing.api.diskFile.download') !== 0
				)
				{
					if (linkOptions.target === '_self' || linkOptions.target === '_blank')
					{
						link.addEventListener('click', (event) => {
							event.preventDefault();
							let url = null;
							try
							{
								url = new URL(linkOptions.href);
							}
							catch (error)
							{
								console.error(error);
							}
							if (url)
							{
								const isSameHost = url.hostname === window.location.hostname;
								const isIframe = url.searchParams.get('IFRAME') === 'Y';

								if (isSameHost && !isIframe)
								{
									const isDifferentPath = url.pathname !== window.location.pathname;
									if (isDifferentPath)
									{
										BX.addClass(document.body, 'landing-page-transition');
										linkOptions.href = url.href;
										setTimeout(() => {
											this.openPseudoLinks(linkOptions, event);
										}, 400);
										setTimeout(() => {
											BX.removeClass(document.body, 'landing-page-transition');
										}, 3000);
									}
								}
								else
								{
									this.openPseudoLinks(linkOptions, event);
								}
							}
						});
					}
				}
			});
		}
	}

	openPseudoLinks(linkOptions, event)
	{
		if (linkOptions.href.indexOf('/bitrix/services/main/ajax.php?action=landing.api.diskFile.download') === 0)
		{
			return;
		}

		// values stored before the server-side sanitizer may carry an executable
		// scheme, so it is filtered here, on output as well
		if (!this.isSafeHref(linkOptions.href))
		{
			this.openResolvedHelpUrl(linkOptions.href);

			return;
		}

		if (linkOptions.query)
		{
			linkOptions.href += (linkOptions.href.indexOf('?') === -1) ? '?' : '&';
			linkOptions.href += linkOptions.query;
		}

		if (this.isValidURL(linkOptions.href))
		{
			top.open(linkOptions.href, linkOptions.target);
		}
	}

	isValidURL(url)
	{
		try
		{
			new URL(url);

			return true;
		}
		catch
		{
			return false;
		}
	}

	/**
	 * Rejects hrefs whose scheme can execute code (DOM-XSS): javascript:, data:,
	 * vbscript:, file:. Everything else is safe - http(s), mailto:, tel:,
	 * #anchors, relative paths, schemeless values. Whitespace and control chars
	 * are stripped before the scheme is matched, otherwise `java\tscript:` slips
	 * through (the url parser drops the tab itself). Duplicated on purpose across
	 * separate landing build contexts - keep the copies in sync.
	 *
	 * @param {string} href
	 * @return {boolean}
	 */
	isSafeHref(href)
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

	/**
	 * Landing::parseLocalUrl rewrites the help:#helpdesk=N and help:#slider=X
	 * markers into javascript: urls, so a legitimate help pseudo-link arrives
	 * here with an unsafe scheme. Both payloads are matched as a whole and the
	 * api is called directly, which keeps javascript: out of top.open. Anything
	 * else is dropped.
	 *
	 * @param {string} href
	 * @return {void}
	 */
	openResolvedHelpUrl(href)
	{
		const value = String(href).trim();

		const helpdesk = value.match(/^javascript:BX\.Helper\.show\('redirect=detail&code=(\d+)'\)$/);
		if (helpdesk)
		{
			if (BX.Helper)
			{
				BX.Helper.show('redirect=detail&code=' + helpdesk[1]);
			}

			return;
		}

		const slider = value.match(/^javascript:BX\.UI\.InfoHelper\.show\('(\w+)'\)$/);
		if (slider && BX.UI && BX.UI.InfoHelper)
		{
			BX.UI.InfoHelper.show(slider[1]);
		}
	}
}
