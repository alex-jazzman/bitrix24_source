/**
 * @module asset-manager
 */
jn.define('asset-manager', (require, exports, module) => {
	const { Type } = require('type');
	const { AssetsManager } = require('native/assets') || {};
	const AppTheme = require('apptheme');

	const isSupported = Boolean(AssetsManager);

	const RELATIVE_PATH = `${currentDomain}/bitrix/mobileapp`;
	const IMAGE_PATH = `${RELATIVE_PATH}/mobile/extensions/bitrix/assets`;

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
	 * @public
	 * @param {string} [filename]
	 * @param {string} [folder]
	 * @param {string} [moduleId]
	 * @param {boolean} withTheme=true
	 * @return {string}
	 */
	const makeLibraryImagePathByModule = (filename, folder, moduleId, withTheme = true) => {
		return withTheme
			? `${RELATIVE_PATH}/${moduleId}mobile/extensions/${moduleId}/assets/${folder}/${AppTheme.id}/${filename}`
			: `${RELATIVE_PATH}/${moduleId}mobile/extensions/${moduleId}/assets/${folder}/${filename}`;
	};

	/**
	 * @public
	 * @param {string} [filename]
	 * @param {string} folder
	 * @param {string} moduleId
	 * @param {boolean} withTheme=true
	 * @return {string}
	 */
	const makeLibraryImagePath = (filename, folder, moduleId, withTheme = true) => {
		if (moduleId && folder)
		{
			return makeLibraryImagePathByModule(filename, folder, moduleId, withTheme);
		}

		if (folder)
		{
			return withTheme ? `${IMAGE_PATH}/${folder}/${AppTheme.id}/${filename}` : `${IMAGE_PATH}/${folder}/${filename}`;
		}

		return withTheme ? `${IMAGE_PATH}/${AppTheme.id}/${filename}` : `${IMAGE_PATH}/${filename}`;
	};

	module.exports = {
		downloadImages,
		downloadLottieAnimations,
		isImageInCache,
		makeLibraryImagePath,
		makeLibraryImagePathByModule,
	};
});
