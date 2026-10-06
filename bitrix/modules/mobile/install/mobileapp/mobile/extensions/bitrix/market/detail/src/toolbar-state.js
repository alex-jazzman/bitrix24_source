/**
 * @module market/detail/src/toolbar-state
 */
jn.define('market/detail/src/toolbar-state', (require, exports, module) => {
	const { Type } = require('type');
	const { normalizeString } = require('market/utils');

	class MarketDetailToolbarState
	{
		constructor({ title = '', fallbackTitle = '' } = {})
		{
			this.fallbackTitle = normalizeString(fallbackTitle, '');
			this.title = normalizeString(title, this.fallbackTitle);
			this.menu = [];
			this.search = this.createDefaultSearchConfig();
			this.navigation = this.createDefaultNavigationConfig();
		}

		update({ title, menu, search, navigation } = {})
		{
			this.title = normalizeString(title, this.title);
			if (Type.isArray(menu))
			{
				this.menu = menu;
			}

			this.search = this.prepareSearchConfig(search, this.search);
			this.navigation = this.prepareNavigationConfig(navigation, this.navigation);
		}

		getTitle()
		{
			return normalizeString(this.title, this.fallbackTitle);
		}

		getSearch()
		{
			return this.search;
		}

		isSearchEnabled()
		{
			return this.search.enabled === true;
		}

		shouldShowSearchButton()
		{
			return this.search.enabled === true && this.search.showButton !== false;
		}

		getMenu()
		{
			return Type.isArray(this.menu) ? this.menu : [];
		}

		hasMenu()
		{
			return Type.isArrayFilled(this.menu);
		}

		canGoBack()
		{
			return this.navigation.canGoBack === true;
		}

		createDefaultSearchConfig()
		{
			return {
				enabled: false,
				showButton: false,
				value: '',
				placeholder: '',
				pageUrl: '',
				title: '',
			};
		}

		createDefaultNavigationConfig()
		{
			return {
				canGoBack: false,
				loading: false,
			};
		}

		prepareSearchConfig(search = {}, fallback = {})
		{
			const preparedFallback = Type.isPlainObject(fallback) ? fallback : {};
			if (!Type.isPlainObject(search))
			{
				return {
					enabled: false,
					showButton: false,
					value: '',
					placeholder: '',
					pageUrl: preparedFallback.pageUrl ?? '',
					title: preparedFallback.title ?? '',
				};
			}

			return {
				enabled: search.enabled === true,
				showButton: search.showButton !== false,
				value: normalizeString(search.value, ''),
				placeholder: normalizeString(search.placeholder, ''),
				pageUrl: normalizeString(search.pageUrl || search.url, ''),
				title: normalizeString(search.title, ''),
			};
		}

		prepareNavigationConfig(navigation = {}, fallback = {})
		{
			const preparedFallback = Type.isPlainObject(fallback) ? fallback : {};

			return {
				canGoBack: Type.isPlainObject(navigation)
					? navigation.canGoBack === true
					: preparedFallback.canGoBack === true,
				loading: Type.isPlainObject(navigation)
					? navigation.loading === true
					: preparedFallback.loading === true,
			};
		}
	}

	module.exports = {
		MarketDetailToolbarState,
	};
});
