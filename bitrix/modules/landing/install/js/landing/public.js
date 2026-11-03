;(function() {
	"use strict";

	BX(function() {
		if (typeof BX.Landing === "undefined" || typeof BX.Landing.Main === "undefined")
		{
			// region INIT
			BX.namespace("BX.Landing");

			const blocks = [].slice.call(document.getElementsByClassName("block-wrapper"));
			if (!!blocks && blocks.length)
			{
				blocks.forEach(function(block) {
					var event = new BX.Landing.Event.Block({block: block});
					BX.onCustomEvent("BX.Landing.Block:init", [event]);
				});
			}

			if (BX.Landing.EventTracker)
			{
				BX.Landing.EventTracker.getInstance().run();
			}
			// endregion

			// region EMPTY HEADINGS
			// a heading of a block left without text is still listed by a screen reader
			// as a nameless heading; it loses the role only, the look stays the same.
			// A heading named otherwise (aria-label, a named image or svg) keeps it
			const hasOwnName = (node) => {
				if ((node.getAttribute('aria-label') || '').trim() !== '')
				{
					return true;
				}

				return (node.getAttribute('aria-labelledby') || '').split(/\s+/).some((id) => {
					const label = id === '' ? null : document.getElementById(id);

					return label !== null && label.textContent.trim() !== '';
				});
			};

			const hasName = (node) => {
				if (node.nodeType === Node.TEXT_NODE)
				{
					return node.textContent.trim() !== '';
				}

				if (node.nodeType !== Node.ELEMENT_NODE || node.getAttribute('aria-hidden') === 'true')
				{
					return false;
				}

				if (node.tagName.toLowerCase() === 'img')
				{
					return (node.getAttribute('alt') || '').trim() !== '';
				}

				if (node.tagName.toLowerCase() === 'svg' || node.getAttribute('role') === 'img')
				{
					const title = node.querySelector('title');

					return hasOwnName(node) || (title !== null && title.textContent.trim() !== '');
				}

				return [].slice.call(node.childNodes).some((child) => hasName(child));
			};

			const headings = [].slice.call(document.querySelectorAll(
				'.block-wrapper h1, .block-wrapper h2, .block-wrapper h3,'
				+ ' .block-wrapper h4, .block-wrapper h5, .block-wrapper h6',
			));
			headings.forEach((heading) => {
				if (!heading.hasAttribute('role') && !hasOwnName(heading) && !hasName(heading))
				{
					heading.setAttribute('role', 'none');
				}
			});
			// endregion

			// region PSEUDO LINKS
			const pseudoLinks = [].slice.call(document.querySelectorAll('[data-pseudo-url*="{"]'));
			if (pseudoLinks.length > 0)
			{
				pseudoLinks.forEach((link) => {
					const linkOptions = BX.Landing.Utils.data(link, 'data-pseudo-url');
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
									// the base is what makes a stored relative value (#anchor, /path)
									// parseable: without it the constructor throws and the handler
									// silently drops the click. Same base isBlockLink uses. An
									// absolute url ignores the base, so an executable scheme still
									// lands in openPseudoLinks and is rejected there
									url = new URL(linkOptions.href, document.location);
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
												openPseudoLinks(linkOptions, event);
											}, 400);
											setTimeout(() => {
												BX.removeClass(document.body, 'landing-page-transition');
											}, 3000);
										}
										else if (isBlockLink(linkOptions.href))
										{
											onBlockLinkClick(event);
										}
									}
									else
									{
										openPseudoLinks(linkOptions, event);
									}
								}
							});
						}

						// stop click from children
						const childLinks = link.getElementsByTagName('a');
						if (childLinks.length > 0)
						{
							[].slice.call(childLinks).map(function (node)
							{
								stopPropagation(node);
							});
						}

						if (BX.hasClass(link, 'g-bg-cover'))
						{
							const child = link.firstElementChild;
							if (child)
							{
								stopPropagation(child);
							}
						}
					}
				});
			}
			// endregion

			// region STOP PROPAGATION for sub-elements in pseudo-link nodes - old variant
			const stopPropagationNodes = [].slice.call(document.querySelectorAll("[data-stop-propagation]"));
			if (stopPropagationNodes.length)
			{
				stopPropagationNodes.forEach(function(node) {
					stopPropagation(node);
				});
			}
			// endregion

			// region all LINKS FOR MOBILE
			if (typeof BXMobileApp !== 'undefined')
			{
				const allLinks = [].slice.call(document.querySelectorAll('a'));
				if (allLinks.length)
				{
					allLinks.forEach(function(link) {
						//file links
						if (link.href && link.href.indexOf('file:') === 0)
						{
							link.addEventListener('click', function(event) {
								event.preventDefault();
								BXMobileApp.PageManager.loadPageBlank({
									url: link.href,
									cache: false,
									bx24ModernStyle: true,
								});
							});
						}
					});
				}
			}
			// endregion

			// region SCROLL-TO for #block links
			const blocksLinks = [].slice.call(document.querySelectorAll('a[href*="#"]'))
			if (!!blocksLinks && blocksLinks.length)
			{
				blocksLinks.forEach(link => {
					const href = link.getAttribute("href");
					if (link.target === '_self' || link.target === '')
					{
						if (isBlockLink(href))
						{
							link.addEventListener("click", onBlockLinkClick);
						}
					}
				});
			}
			// endregion

			const setLinks = [].slice.call(document.querySelectorAll("a"));
			setLinks.forEach(function(link) {
				const href = link.getAttribute("href");
				if (link.target === '_self' && !isBlockLink(href))
				{
					link.addEventListener("click", event => {
						const url = new URL(link.href);
						if (
							url.hostname === window.location.host
							&& url.pathname !== window.location.pathname
							&& url.searchParams.get('IFRAME') !== "Y"
						)
						{
							event.preventDefault();
							BX.addClass(document.body, "landing-page-transition");
							setTimeout(() => {
								top.open(url.href, link.target);
							}, 400);
							setTimeout(() => {
								BX.removeClass(document.body, "landing-page-transition");
							}, 3000);
						}
					});
				}
			});

			// region FUNCTIONS
			function stopPropagation(node)
			{
				node.addEventListener("click", function(event) {
					event.stopPropagation();
				});
			}

			/**
			 * Check if url move to block at current page
			 * @param {string} url
			 * @returns {boolean}
			 */
			function isBlockLink(url)
			{
				if (url !== null && (url === '#' || url.startsWith('#/')))
				{
					return false;
				}

				if (isValidURL(url) || (url !== null && url.startsWith('/') && isValidURL(url, document.location)))
				{
					const urlObj = new URL(url, document.location);

					return urlObj.hash !== ''
						&& !urlObj.hash.startsWith('#/')
						&& urlObj.search === document.location.search
						&& urlObj.pathname === document.location.pathname
						&& urlObj.origin === document.location.origin;
				}

				if (url !== null && url.startsWith('#') && isValidAnchor(url))
				{
					return true;
				}

				return false;
			}

			function isValidURL(url, base)
			{
				try
				{
					new URL(url, base);

					return true;
				}
				catch
				{
					return false;
				}
			}

			/**
			 * Rejects hrefs whose scheme can execute code (DOM-XSS): javascript:,
			 * data:, vbscript:, file:. Everything else is safe - http(s), mailto:,
			 * tel:, #anchors, relative paths, schemeless values. Whitespace and
			 * control chars are stripped before the scheme is matched, otherwise
			 * `java\tscript:` slips through (the url parser drops the tab itself).
			 * Duplicated on purpose across separate landing build contexts -
			 * keep the copies in sync.
			 * @param {string} href
			 * @returns {boolean}
			 */
			function isSafeHref(href)
			{
				const value = String(href || '').trim().replace(/[\x00-\x20]/g, '');

				// file: is kept in its marker form: on mobile hits Block does not
				// resolve the disk download link and the app resolves the marker
				// itself. Mirror of Sanitizer::MARKER_ONLY_URL_SCHEMES
				if (/^file:#diskFile\d+$/i.test(value))
				{
					return true;
				}

				const match = value.match(/^([a-z][a-z0-9+.-]*):/i);
				const scheme = match ? match[1].toLowerCase() : '';

				return ['javascript', 'data', 'vbscript', 'file'].indexOf(scheme) === -1;
			}

			// height of float header
			let headerOffset = 0;
			const headerFix = document.querySelector('.u-header.u-header--sticky');
			if (!!headerFix)
			{
				const navbar = headerFix.querySelector('.navbar');
				if (!!navbar)
				{
					const navSection = BX.findParent(navbar, {class: 'u-header__section'});
					headerOffset = !!navSection
						? navSection.offsetHeight
						: navbar.offsetHeight;
				}
			}

			// scroll correction if open page by link with hash (to block)
			if (headerOffset && isBlockLink(document.URL))
			{
				document.addEventListener('DOMContentLoaded', () => {
					if (window.pageYOffset > 0)
					{
						window.scrollTo({
							top: window.pageYOffset - headerOffset,
						});
					}
				});
			}

			function onBlockLinkClick(event)
			{
				try
				{
					let targetSelector = null;
					let urlForHistory = null;
					const link = event.currentTarget;
					// hash/anchor can be not valid for various reasons
					if (link.tagName === 'A')
					{
						targetSelector = link.hash;
						urlForHistory = link.href;
					}
					else if (link.hasAttribute('data-pseudo-url'))
					{
						const linkOptions = BX.Landing.Utils.data(link, "data-pseudo-url");
						if (isValidAnchor(linkOptions.href))
						{
							linkOptions.href = window.location.origin + window.location.pathname + linkOptions.href;
						}
						const urlObj = new URL(linkOptions.href);
						targetSelector = urlObj.hash;
						urlForHistory = urlObj.href;
					}

					if (!targetSelector || !urlForHistory)
					{
						return;
					}

					const target = document.getElementById(targetSelector.slice(1));
					if (!target)
					{
						return;
					}

					window.scrollTo({
						top: target.offsetTop - headerOffset,
						behavior: 'smooth'
					});
					event.preventDefault();
					event.landingBlockLinkHandled = true;
					event.landingBlockLinkUrl = urlForHistory;
					link.blur(); // disable :focus after click
					history.pushState({}, '', urlForHistory);
				}
				catch (e) {}
			}

			function openPseudoLinks(linkOptions, event)
			{
				if (linkOptions.href.indexOf('/bitrix/services/main/ajax.php?action=landing.api.diskFile.download') === 0)
				{
					return;
				}

				// values stored before the server-side sanitizer may carry an
				// executable scheme, so it is filtered here, on output as well
				if (!isSafeHref(linkOptions.href))
				{
					openResolvedHelpUrl(linkOptions.href);

					return;
				}

				// mobile device
				if (typeof BXMobileApp !== "undefined")
				{
					BXMobileApp.PageManager.loadPageBlank({
						url: linkOptions.href,
						cache: false,
						bx24ModernStyle: true,
					});
				}
				// desktop
				else
				{
					if (
						linkOptions.target === '_self'
						&& isBlockLink(linkOptions.href)
					)
					{
						onBlockLinkClick(event);
					}
					else
					{
						if (linkOptions.query)
						{
							linkOptions.href += (linkOptions.href.indexOf('?') === -1) ? '?' : '&';
							linkOptions.href += linkOptions.query;
						}

						if (isValidURL(linkOptions.href))
						{
							top.open(linkOptions.href, linkOptions.target);
						}

						if (isValidAnchor(linkOptions.href))
						{
							onBlockLinkClick(event);
						}
					}
				}
			}

			/**
			 * Landing::parseLocalUrl rewrites the help:#helpdesk=N and
			 * help:#slider=X markers into javascript: urls, so a legitimate help
			 * pseudo-link arrives here with an unsafe scheme. Both payloads are
			 * matched as a whole and the api is called directly, which keeps
			 * javascript: out of every navigation sink. Anything else is dropped.
			 * @param {string} href
			 * @returns {void}
			 */
			function openResolvedHelpUrl(href)
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
			// endregion

			function isValidAnchor(anchor)
			{
				if (anchor.charAt(0) !== '#' || anchor.length === 1)
				{
					return false;
				}
				const regex = /^[\w-]+$/;

				return regex.test(anchor.slice(1));
			}
		}

		document.addEventListener('DOMContentLoaded', () => {
			const elements = document.querySelectorAll('[style]');
			for (const element of elements)
			{
				let styleValue = element.getAttribute('style');
				if (styleValue)
				{
					styleValue = styleValue.replaceAll(/--[\w-]*: ;/gi, '');
					element.setAttribute('style', styleValue);
				}
			}
		});
	});
})();