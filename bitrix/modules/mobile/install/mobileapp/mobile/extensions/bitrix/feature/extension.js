/**
 * @module feature
 */
jn.define('feature', (require, exports, module) => {
	const { feature } = require('native/feature');
	const isAndroid = Application.getPlatform() === 'android';

	/**
	 * @class Feature
	 */
	class Feature
	{
		static async showDefaultUnsupportedWidget(props = {}, parentWidget = PageManager)
		{
			const { AppUpdateNotifier } = await requireLazy('app-update-notifier');

			AppUpdateNotifier.open(props, parentWidget);
		}

		static isToastSupported()
		{
			return Boolean(require('native/notify'));
		}

		static isSafeAreaSupportedOnAndroid()
		{
			return isAndroid && minApiVersion(59, 'isSafeAreaSupportedOnAndroid');
		}

		static isOpenImageNonContextSupported()
		{
			if (isAndroid)
			{
				return true;
			}

			return minApiVersion(55, 'isOpenImageNonContextSupported');
		}

		static isFallbackUrlSupported()
		{
			return minApiVersion(55, 'isFallbackUrlSupported');
		}

		static isDidAdoptHeightByKeyboardEventSupported()
		{
			return minApiVersion(55, 'isDidAdoptHeightByKeyboardEventSupported');
		}

		static isSmartphoneContactsAPISupported()
		{
			return minApiVersion(55, 'isSmartphoneContactsAPISupported');
		}

		static isNativeAvatarSupported()
		{
			return typeof Avatar === 'function' && minApiVersion(56, 'isNativeAvatarSupported');
		}

		static isListViewMoveRowToSectionEndSupported()
		{
			return minApiVersion(56, 'isListViewMoveRowToSectionEndSupported');
		}

		static isMultiEmailInputSupported()
		{
			return minApiVersion(58, 'isMultiEmailInputSupported');
		}

		static isSelectorWidgetOnViewHiddenEventBugFixed()
		{
			if (isAndroid)
			{
				return minApiVersion(59, 'isSelectorWidgetOnViewHiddenEventBugFixed');
			}

			return true;
		}

		static get isSupportedMediaGalleryCollection()
		{
			return minApiVersion(
				60,
				'isSupportedMediaGalleryCollection',
			) && feature?.isFeatureEnabled('viewer_gallery');
		}

		static isMultipleFilesDownloadSupported()
		{
			return minApiVersion(60, 'isMultipleFilesDownloadSupported');
		}

		static isNativeStoreSupported()
		{
			return Boolean(require('native/store'));
		}

		static canUseAnimatedCounter()
		{
			return !isAndroid || minApiVersion(60, 'canUseAnimatedCounter');
		}
	}

	/**
	 * @private
	 * @param {number} minVersion
	 * @param {string} featureName
	 * @return {boolean}
	 */
	const minApiVersion = (minVersion, featureName) => {
		const currentVersion = Application.getApiVersion();
		if ((currentVersion - minVersion) > 2)
		{
			console.warn(`Feature ${featureName} requires API ${minVersion} and probably can be omitted (current is ${currentVersion}).`);
		}

		return currentVersion >= minVersion;
	};

	module.exports = { Feature };
});
