/**
 * @module layout/ui/feature-banner
 */
jn.define('layout/ui/feature-banner', (require, exports, module) => {
	const { ContextMenu } = require('layout/ui/context-menu');

	const pathToExtension = `${currentDomain}/bitrix/mobileapp/mobile/extensions/bitrix/layout/ui/feature-banner/`;
	const defaultImagePath = `${pathToExtension}images/banner.png`;

	/**
	 * @class FeatureBanner
	 * @param {FeatureBannerOptions} options
	 */
	class FeatureBanner
	{
		/**
		 * @typedef {Object} FeatureBannerOptions
		 * @property {Array<string>} [featureItems]
		 * @property {string} [
		 * 		imagePath='/bitrix/mobileapp/mobile/extensions/bitrix/layout/ui/feature-banner/images/banner.png'
		 * ]
		 * @property {Object} [qrauth=null]
		 * @property {string} [positioning='vertical']
		 * @property {string} [title='']
		 * @property {boolean} [showSubtitle=false]
		 * @property {string} [buttonText='']
		 * @property {Object} [params={}]
		 */
		constructor(options = {})
		{
			const {
				featureItems = [],
				imagePath = defaultImagePath,
				qrauth = null,
				positioning = 'vertical',
				title = '',
				showSubtitle = false,
				buttonText = '',
				params = {},
			} = options;

			this.bannerConfig = {
				featureItems,
				imagePath,
				qrauth,
				positioning,
				title,
				showSubtitle,
				buttonText,
			};

			this.params = params;
		}

		/**
		 * @param {object} parentWidget
		 * @param {FeatureBannerOptions} [options={}]
		 * @returns {void}
		 */
		static show(parentWidget, options = {})
		{
			const instance = new FeatureBanner(options);

			instance.#showMenu(parentWidget);
		}

		/**
		 * @param {object} [parentWidget=PageManager]
		 * @returns {void}
		 */
		#showMenu(parentWidget = PageManager)
		{
			const menu = new ContextMenu({
				banner: this.bannerConfig,
				params: this.params,
			});

			void menu.show(parentWidget);
		}
	}

	module.exports = {
		FeatureBanner,
	};
});
