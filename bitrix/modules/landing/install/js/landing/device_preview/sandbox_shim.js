/**
 * Storage/cookie neutraliser for the sandboxed preview: the editor device frame and the
 * signed preview page of the cloud (CSP sandbox).
 *
 * The preview is sandboxed without allow-same-origin, so its origin is opaque and any
 * access to document.cookie or Window.localStorage throws a DOMException. The previewed public
 * page (kernel, landing_public, blocks) touches both freely, and an uncaught exception aborts
 * the whole surrounding script block — so the damage goes well beyond the cookie itself.
 *
 * This replaces the blocked APIs with in-memory stand-ins, which is also the semantically right
 * behaviour for a preview: it must not read or write real cookies and storage. Framework
 * independent (no main.core) and must run before anything else on the page.
 */
(function() {
	"use strict";

	function isBlocked(probe)
	{
		try
		{
			probe();

			return false;
		}
		catch (e)
		{
			return true;
		}
	}

	function installCookieJar()
	{
		var jar = {};

		function serialize()
		{
			var pairs = [];
			for (var name in jar)
			{
				if (Object.prototype.hasOwnProperty.call(jar, name))
				{
					pairs.push(name + "=" + jar[name]);
				}
			}

			return pairs.join("; ");
		}

		function isExpired(attributes)
		{
			var maxAge = /(?:^|;)\s*max-age\s*=\s*(-?\d+)/i.exec(attributes);
			if (maxAge)
			{
				return Number(maxAge[1]) <= 0;
			}

			var expires = /(?:^|;)\s*expires\s*=\s*([^;]+)/i.exec(attributes);
			if (expires)
			{
				var time = Date.parse(expires[1]);

				return !isNaN(time) && time <= Date.now();
			}

			return false;
		}

		Object.defineProperty(document, "cookie", {
			configurable: true,
			get: serialize,
			set: function(value) {
				var raw = String(value);
				var separator = raw.indexOf(";");
				var pair = separator === -1 ? raw : raw.slice(0, separator);
				var attributes = separator === -1 ? "" : raw.slice(separator);

				var delimiter = pair.indexOf("=");
				if (delimiter < 1)
				{
					return;
				}

				var name = pair.slice(0, delimiter).trim();
				if (name === "")
				{
					return;
				}

				if (isExpired(attributes))
				{
					delete jar[name];

					return;
				}

				jar[name] = pair.slice(delimiter + 1).trim();
			}
		});
	}

	function createMemoryStorage()
	{
		var map = {};

		function keys()
		{
			return Object.keys(map);
		}

		var storage = {
			getItem: function(key) {
				key = String(key);

				return Object.prototype.hasOwnProperty.call(map, key) ? map[key] : null;
			},
			setItem: function(key, value) {
				map[String(key)] = String(value);
			},
			removeItem: function(key) {
				delete map[String(key)];
			},
			clear: function() {
				map = {};
			},
			key: function(index) {
				var all = keys();
				var position = Number(index);

				return position >= 0 && position < all.length ? all[position] : null;
			}
		};

		// Live getter: main.core iterates storage by index against .length.
		Object.defineProperty(storage, "length", {
			get: function() {
				return keys().length;
			}
		});

		return storage;
	}

	if (isBlocked(function() {
		return document.cookie;
	}))
	{
		installCookieJar();
		// Tells the follow-up inline scripts that cookie writes now land in the in-memory jar,
		// so they may seed preview-only cookies without ever touching a real cookie store.
		window.landingDevicePreviewSandboxed = true;
	}

	["localStorage", "sessionStorage"].forEach(function(name) {
		if (isBlocked(function() {
			return window[name];
		}))
		{
			Object.defineProperty(window, name, {
				configurable: true,
				value: createMemoryStorage()
			});
		}
	});
})();
