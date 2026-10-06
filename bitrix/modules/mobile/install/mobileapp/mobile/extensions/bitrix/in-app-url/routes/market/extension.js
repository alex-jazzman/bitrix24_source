/**
 * @module in-app-url/routes/market
 */
jn.define('in-app-url/routes/market', (require, exports, module) => {
	const { requireLazy } = require('require-lazy');
	const { showErrorToast } = require('toast');
	const INSTALLED_FILTER_UPDATES = 'updates';

	const openMarketHome = (params = {}, { context = {} } = {}) => {
		void requireLazy('market/home/opener')
			.then(({ MarketHomeOpener }) => {
				MarketHomeOpener.open({
					parentWidget: context.parentWidget ?? PageManager,
				});
			})
			.catch((error) => {
				console.error(error);
				showErrorToast();
			});
	};

	const openMarketCategory = ({ categoryCode }, { context = {} } = {}) => {
		void requireLazy('market/app-list/opener')
			.then(({ MarketListOpener }) => {
				MarketListOpener.open({
					categoryCode,
					parentWidget: context.parentWidget ?? PageManager,
				});
			})
			.catch((error) => {
				console.error(error);
				showErrorToast();
			});
	};

	const openMarketDetail = ({ appCode }, { context = {}, queryParams = {} } = {}) => {
		void requireLazy('market/detail/opener')
			.then(({ MarketDetailOpener }) => {
				MarketDetailOpener.open({
					code: appCode,
					from: String(queryParams?.from ?? '').trim(),
					parentWidget: context.parentWidget ?? PageManager,
				});
			})
			.catch((error) => {
				console.error(error);
				showErrorToast();
			});
	};

	const openMarketInstalled = (params = {}, { context = {}, queryParams = {} } = {}) => {
		const installedFilter = (
			String(queryParams?.updates ?? params?.updates ?? '').toUpperCase() === 'Y'
				? INSTALLED_FILTER_UPDATES
				: ''
		);

		void requireLazy('market/app-list/opener')
			.then(({ MarketListOpener }) => {
				MarketListOpener.open({
					listType: 'installed',
					installedFilter,
					parentWidget: context.parentWidget ?? PageManager,
				});
			})
			.catch((error) => {
				console.error(error);
				showErrorToast();
			});
	};

	module.exports = function(inAppUrl) {
		inAppUrl
			.register('/market/installed/(\\?.+)?$', openMarketInstalled)
			.name('market-installed');

		inAppUrl
			.register('/market/category/:categoryCode/(\\?.+)?$', openMarketCategory)
			.name('market-category');

		inAppUrl
			.register('/market/detail/:appCode/(\\?.+)?$', openMarketDetail)
			.name('market-detail');

		inAppUrl
			.register('/market/(\\?.+)?$', openMarketHome)
			.name('market-home');
	};
});
