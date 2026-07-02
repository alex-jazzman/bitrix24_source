/**
 * @module im/messenger/controller/messenger-header/src/title-params-provider/global
 */
jn.define('im/messenger/controller/messenger-header/src/title-params-provider/global', (require, exports, module) => {
	const { Loc } = require('im/messenger/loc');

	/**
	 * @class GlobalTitleParamsProvider
	 */
	class GlobalTitleParamsProvider
	{
		/**
		 * @return {string}
		 */
		getDefaultTitle()
		{
			return Loc.getMessage('IMMOBILE_MESSENGER_HEADER_DEFAULT');
		}

		/**
		 * @return {Partial<JNWidgetTitleParams>}
		 */
		getTitleParams()
		{
			return {
				type: 'section',
			};
		}
	}

	module.exports = { GlobalTitleParamsProvider };
});
