/**
 * @module market/detail/opener
 */
jn.define('market/detail/opener', (require, exports, module) => {
	const AppTheme = require('apptheme');
	const { Loc } = require('loc');
	const { normalizeString } = require('market/utils');
	const { withCurrentDomain } = require('utils/url');
	const { Uri } = require('utils/uri');
	const { MarketDetail } = require('market/detail');

	const THEME_QUERY_PARAM = 'mobileThemeId';

	const DETAIL_BACKDROP = {
		showOnTop: true,
		onlyMediumPosition: true,
		mediumPositionPercent: 90,
		swipeAllowed: false,
		horizontalSwipeAllowed: false,
		hideNavigationBar: false,
		swipeContentAllowed: false,
		forceDismissOnSwipeDown: false,
	};

	function appendMobileThemeId(url)
	{
		const normalizedUrl = normalizeString(url, '');
		const themeId = normalizeString(AppTheme.id, '');

		if (!normalizedUrl || !themeId)
		{
			return normalizedUrl;
		}

		try
		{
			const uri = new Uri(normalizedUrl);
			uri.setQueryParam(THEME_QUERY_PARAM, themeId);

			return uri.toString();
		}
		catch
		{
			return normalizedUrl;
		}
	}

	function resolveDetailUrl({ code = '', url = '', from = '' } = {})
	{
		const normalizedUrl = normalizeString(url, '');

		if (normalizedUrl.includes('/mobile/market'))
		{
			return appendMobileThemeId(withCurrentDomain(normalizedUrl));
		}

		const normalizedCode = normalizeString(code, '');

		if (!normalizedCode)
		{
			return '';
		}

		const params = [
			'page=detail',
			`appCode=${encodeURIComponent(normalizedCode)}`,
		];
		const normalizedFrom = normalizeString(from, '');

		if (normalizedFrom)
		{
			params.push(`from=${encodeURIComponent(normalizedFrom)}`);
		}

		return appendMobileThemeId(withCurrentDomain(`/mobile/market/?${params.join('&')}`));
	}

	class MarketDetailOpener
	{
		static open({
			code = '',
			url = '',
			title = '',
			from = '',
			parentWidget = PageManager,
			onInstallCompleted = null,
		} = {})
		{
			const detailUrl = resolveDetailUrl({
				code,
				url,
				from,
			});
			if (!detailUrl)
			{
				return;
			}

			const detailTitle = normalizeString(title, Loc.getMessage('MOBILE_MARKET_DETAIL_OPENER_TITLE'));

			parentWidget.openWidget('layout', {
				grabTitle: false,
				titleParams: {
					type: 'dialog',
					text: detailTitle,
				},
				backdrop: DETAIL_BACKDROP,
			}).then((layoutWidget) => {
				layoutWidget.showComponent(
					MarketDetail({
						layout: layoutWidget,
						code,
						url: detailUrl,
						title: detailTitle,
						onInstallCompleted,
					}),
				);
			}).catch(console.error);
		}
	}

	module.exports = {
		MarketDetailOpener,
	};
});
