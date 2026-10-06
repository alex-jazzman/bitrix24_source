;(function ($) {
	"use strict";

	BX.ready(function ()
	{
		// Fancybox cancels the click itself and loads the href into iframe.src,
		// where an executable scheme would run in the page origin. Cancelling the
		// event before it makes fancybox skip the item (it bails out on
		// isDefaultPrevented) and keeps the browser from running the href too
		$("[target=\"_popup\"]").on("click", function (event)
		{
			if (!isSafeHref(this.getAttribute("href")))
			{
				event.preventDefault();
			}
		});

		// Init Fancybox for link without embed URL
		$("[target=\"_popup\"]:not([data-url])").fancybox({type: "iframe"});

		// Init Fancybox for link with embed URL
		$("[target=\"_popup\"][data-url]").on("click", function (event)
		{
			event.preventDefault();

			if (!isSafeHref(this.dataset.url))
			{
				return;
			}

			$.fancybox.open({
					src: this.dataset.url,
					type: "iframe",
					afterShow: afterFancyboxIframeShow,
				},
				{
					iframe: {
						scrolling: "auto",
					},
				});
		});

		$("[data-pseudo-url*='_popup']").on("click", function (event)
		{
			event.preventDefault();

			var linkOptions = BX.Landing.Utils.data(this, "data-pseudo-url");

			if (linkOptions.href && linkOptions.enabled)
			{
				var src = linkOptions.href;

				if (BX.type.isPlainObject(linkOptions.attrs) &&
					linkOptions.attrs['data-url'])
				{
					src = linkOptions.attrs['data-url'];
				}

				if (!isSafeHref(src))
				{
					return;
				}

				$.fancybox.open({
						src: src,
						type: "iframe",
						afterShow: afterFancyboxIframeShow,
					},
					{
						iframe: {
							scrolling: "auto",
						},
					});
			}

		});

		/**
		 * Rejects hrefs whose scheme can execute code: javascript:, data:,
		 * vbscript:, file:. Whitespace and control chars are stripped before the
		 * scheme is matched, otherwise `java\tscript:` slips through (the url
		 * parser drops the tab itself). Duplicated on purpose across separate
		 * landing build contexts - keep the copies in sync.
		 * @param {string} href
		 * @returns {boolean}
		 */
		function isSafeHref(href)
		{
			var value = String(href || "").trim().replace(/[\x00-\x20]/g, "");

			// file: is kept in its marker form: on mobile hits Block does not
			// resolve the disk download link and the app resolves the marker
			// itself. Mirror of Sanitizer::MARKER_ONLY_URL_SCHEMES
			if (/^file:#diskFile\d+$/i.test(value))
			{
				return true;
			}

			var match = value.match(/^([a-z][a-z0-9+.-]*):/i);
			var scheme = match ? match[1].toLowerCase() : "";

			return ["javascript", "data", "vbscript", "file"].indexOf(scheme) === -1;
		}

		function afterFancyboxIframeShow(instance, current)
		{
			var iframe = current.$slide.find("iframe")[0];
			void BX.Landing.MediaPlayer.Factory.create(iframe);
		}
	});

})(window.jQueryLanding || jQuery);