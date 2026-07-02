/**
 * @module asset-manager
 */
jn.define('asset-manager', (require, exports, module) => {
	const { Type } = require('type');
	const { AssetsManager } = require('native/assets') || {};
	const AppTheme = require('apptheme');

	const isSupported = Boolean(AssetsManager);

	const RELATIVE_PATH = `${currentDomain}/bitrix/mobileapp`;
	const DEFAULT_ASSETS_PATH = `${RELATIVE_PATH}/mobile/extensions/bitrix/assets`;

	/**
	 * @param {string[]} imageList
	 * @returns {Promise}
	 */
	const downloadImages = (imageList = []) => {
		if (!isSupported)
		{
			const errorText = 'AssetsManager is not supported by your app';

			return Promise.reject(new Error(errorText));
		}

		if (!Type.isArrayFilled(imageList))
		{
			return Promise.resolve();
		}

		return AssetsManager.downloadImages(imageList);
	};

	/**
	 * @param {string[]} lottieAnimationList
	 * @returns {Promise}
	 */
	const downloadLottieAnimations = (lottieAnimationList = []) => {
		if (!isSupported)
		{
			const errorText = 'AssetsManager is not supported by your app';

			return Promise.reject(new Error(errorText));
		}

		if (!Type.isArrayFilled(lottieAnimationList))
		{
			return Promise.resolve();
		}

		return AssetsManager.downloadLottieAnimations(lottieAnimationList);
	};

	/**
	 * @param {string} url
	 * @returns {Promise}
	 */
	const isImageInCache = (url) => {
		if (!isSupported)
		{
			const errorText = 'AssetsManager is not supported by your app';

			return Promise.reject(new Error(errorText));
		}

		if (!Type.isStringFilled(url) || !AssetsManager.isImageInCache)
		{
			return Promise.resolve(null);
		}

		return AssetsManager.isImageInCache(url);
	};

	/**
	 * @param {...(string|false|undefined|null)} segments
	 * @return {string}
	 */
	const buildAssetPath = (...segments) => {
		return segments.filter(Boolean).join('/');
	};

	/**
	 * @public
	 * @param {string} filename
	 * @param {string} folder
	 * @param {string} moduleId
	 * @param {boolean} [withTheme=true]
	 * @return {string}
	 */
	const makeLibraryImagePathByModule = (filename, folder, moduleId, withTheme = true) => {
		const mobileDir = moduleId.endsWith('mobile') ? moduleId : `${moduleId}mobile`;

		return buildAssetPath(
			RELATIVE_PATH,
			mobileDir,
			'extensions',
			moduleId,
			'assets',
			folder,
			withTheme && AppTheme.id,
			filename,
		);
	};

	/**
	 * @public
	 * @param {string} filename
	 * @param {string} [folder]
	 * @param {string} [moduleId]
	 * @param {boolean} [withTheme=true]
	 * @return {string}
	 */
	const makeLibraryImagePath = (filename, folder, moduleId, withTheme = true) => {
		const isExternalModule = moduleId && moduleId !== 'mobile';

		if (isExternalModule && folder)
		{
			return makeLibraryImagePathByModule(filename, folder, moduleId, withTheme);
		}

		return buildAssetPath(DEFAULT_ASSETS_PATH, folder, withTheme && AppTheme.id, filename);
	};

	module.exports = {
		downloadImages,
		downloadLottieAnimations,
		isImageInCache,
		makeLibraryImagePath,
		makeLibraryImagePathByModule,
	};
});
