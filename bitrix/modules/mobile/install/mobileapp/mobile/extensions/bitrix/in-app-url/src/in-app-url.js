/**
 * @module in-app-url/src/in-app-url
 */
jn.define('in-app-url/src/in-app-url', (require, exports, module) => {
	const { Url } = require('in-app-url/url');
	const { Route } = require('in-app-url/route');
	const { getHttpPath } = require('utils/url');
	const { stringify } = require('utils/string');
	const { Loc } = require('loc');
	const { showSafeToast } = require('toast');
	const { openPortalPage } = require('in-app-url/portal-page');

	const reportOpenFailure = (reason, error) => {
		console.error(`in-app-url: ${reason}`, error);
		showSafeToast({ message: Loc.getMessage('IN_APP_URL_OPEN_FAILURE') });
	};

	/**
	 * @class InAppUrl
	 */
	class InAppUrl
	{
		constructor()
		{
			/** @type Route[] */
			this.routes = [];
		}

		/**
		 * @deprecated use addRoute
		 * @param {string} pattern
		 * @param {Function} handler
		 * @return {Route}
		 */
		register(pattern, handler)
		{
			const route = this.#createRoute({ pattern, handler });
			this.routes.push(route);

			return route;
		}

		/**
		 * @param {string} pattern
		 * @param {object} [params]
		 * @returns {Route}
		 */
		addRoute(pattern, params)
		{
			const route = this.#createRoute({
				pattern,
				params,
			});
			this.routes.push(route);

			return route;
		}

		url(path)
		{
			return new Url(path);
		}

		/**
		 * @public
		 * @param {string} rawPath
		 * @param {object} context
		 * @param {function(Url)|null} fallbackFn
		 * @return {false|any}
		 */
		open(rawPath, context = {}, fallbackFn = null)
		{
			const path = stringify(rawPath);
			if (path === '')
			{
				reportOpenFailure('unable to open empty path');

				return false;
			}

			const url = new Url(path);

			if (url.isEmail || url.isPhoneNumber)
			{
				Application.openUrl(url.value);

				return false;
			}

			if (url.isExternal)
			{
				const routeForExternalUrl = this.findRouteForExternalUrl(url);

				if (routeForExternalUrl)
				{
					return this.#dispatchRoute(routeForExternalUrl, url, context);
				}

				Application.openUrl(InAppUrl.getHttpPath(path));

				return false;
			}

			if (url.isMobileView)
			{
				PageManager.openPage({
					url: url.toString(),
				});

				return false;
			}

			try
			{
				const route = this.findRoute(url);

				if (!route)
				{
					console.warn(`in-app-url: no route found for path ${url}`);
					if (fallbackFn)
					{
						return fallbackFn(url);
					}

					openPortalPage(url.toString(), context);

					return false;
				}

				return this.#dispatchRoute(route, url, context);
			}
			catch (e)
			{
				reportOpenFailure(`error while opening path ${path}`, e);

				return false;
			}
		}

		/**
		 * @private
		 * @param {Route} route
		 * @param {Url} url
		 * @param {object} context
		 * @return {false|any}
		 */
		#dispatchRoute(route, url, context)
		{
			try
			{
				const dispatched = route.dispatch(url, context);

				// an async handler rejects after dispatch returns, so try/catch alone leaves it silent
				if (dispatched instanceof Promise)
				{
					return dispatched.catch((e) => reportOpenFailure(`handler failed while opening path ${url}`, e));
				}

				return dispatched;
			}
			catch (e)
			{
				reportOpenFailure(`error while opening path ${url}`, e);

				return false;
			}
		}

		/**
		 * @public
		 * @param {string} name
		 * @param {object} variables
		 * @return {Array<Route>}
		 */
		route(name, variables = {})
		{
			return this.findRoutesByName(name).forEach((route) => {
				route.makeUrl(variables);
			});
		}

		/**
		 * @param {Url | string} url
		 * @returns {Route}
		 */
		findRoute(url)
		{
			return this.routes.find((route) => route.match(url));
		}

		/**
		 * Resolves a URL living outside the portal domain: only routes that declared
		 * allowExternalUrl() take part, so a foreign address cannot reach a route
		 * whose pattern would match it as a mere substring.
		 * @public
		 * @param {Url | string} url
		 * @returns {Route | undefined}
		 */
		findRouteForExternalUrl(url)
		{
			return this.routes.find((route) => route.isExternalUrlAllowed() && route.match(url));
		}

		findRoutesByName(name)
		{
			return this.routes.filter((route) => route.hasName(name));
		}

		/**
		 * @param options
		 * @returns {Route}
		 */
		#createRoute(options)
		{
			return new Route(options);
		}

		/**
		 * @public
		 * @param {string} path
		 * @return {string}
		 */
		static getHttpPath(path)
		{
			return getHttpPath(path);
		}
	}

	module.exports = { InAppUrl };
});
