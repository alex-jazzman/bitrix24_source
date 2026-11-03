/**
 * @module timeman/selector/entity/full-report-user
 */
jn.define('timeman/selector/entity/full-report-user', (require, exports, module) => {
	const { SocialNetworkUserSelector } = require('selector/widget/entity/socialnetwork/user');

	/**
	 * @class FullReportUserSelector
	 */
	class FullReportUserSelector extends SocialNetworkUserSelector
	{
		static getEntityId()
		{
			return 'timeman-full-report-user';
		}

		static getContext()
		{
			return 'TIMEMAN_FULL_REPORT_USER';
		}

		static isCreationEnabled()
		{
			return false;
		}
	}

	module.exports = { FullReportUserSelector };
});
