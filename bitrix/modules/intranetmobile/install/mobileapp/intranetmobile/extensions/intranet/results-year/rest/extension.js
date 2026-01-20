/**
 * @module intranet/results-year/rest
 */
jn.define('intranet/results-year/rest', (require, exports, module) => {

	const { RunActionExecutor } = require('rest');
	const cacheId = 'intranet.results-year';
	const cacheTtl = 86400;

	function canShowResultsYearButton()
	{
		return new RunActionExecutor('intranet.v2.AnnualSummary.canShow')
			.setCacheId(`${cacheId}.canShow`)
			.setCacheTtl(cacheTtl)
			.call(true);
	}

	function canFirstShowResultsYear()
	{
		return new RunActionExecutor('intranet.v2.AnnualSummary.canFirstShow').call(true);
	}

	function loadFeaturedResultsYearData()
	{
		return new RunActionExecutor('intranet.v2.AnnualSummary.load')
			.setCacheId(`${cacheId}.featuredData`)
			.setCacheTtl(cacheTtl)
			.call(true);
	}

	function fetchResultsYearLink({ signedUserId, signedId })
	{
		return new RunActionExecutor(
			'intranet.v2.AnnualSummary.getLink',
			{
				signedUserId,
				signedType: signedId,
			},
		).call();
	}

	function markShowAction()
	{
		return new RunActionExecutor('intranet.v2.AnnualSummary.markShow', {}).call();
	}

	module.exports = {
		markShowAction,
		fetchResultsYearLink,
		canFirstShowResultsYear,
		canShowResultsYearButton,
		loadFeaturedResultsYearData,
	};
});
