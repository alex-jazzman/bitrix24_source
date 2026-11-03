/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_imageeditor, main_core) {
	'use strict';

	const assetPath = '/bitrix/js/main/imageeditor/external/photoeditorsdk/assets';
	const landingAssetsPath = '/bitrix/images/landing/imageeditor/assets';
	function pathResolver(path) {
		if (path.includes('sites_recommended_transform_default')) {
			const [, fileName] = path.split('sites_recommended_transform_default');
			return `${assetPath}/ui/desktop/editor/controls/transform/ratios/imgly_transform_common_4-3${fileName}`;
		}
		if (path.includes('sites_recommended_transform_retina')) {
			const [, fileName] = path.split('sites_recommended_transform_retina');
			return `${assetPath}/ui/desktop/editor/controls/transform/ratios/imgly_transform_common_4-3${fileName}`;
		}
		if (path.includes('landing-transform-3-4')) {
			const [, fileName] = path.split('landing-transform-3-4');
			return `${landingAssetsPath}/transform/ratios/landing-transform-3-4${fileName}`;
		}
		if (path.includes('landing-transform-4-3')) {
			const [, fileName] = path.split('landing-transform-4-3');
			return `${landingAssetsPath}/transform/ratios/landing-transform-4-3${fileName}`;
		}
		if (path.includes('landing-transform-9-16')) {
			const [, fileName] = path.split('landing-transform-9-16');
			return `${landingAssetsPath}/transform/ratios/landing-transform-9-16${fileName}`;
		}
		if (path.includes('landing-transform-16-9')) {
			const [, fileName] = path.split('landing-transform-16-9');
			return `${landingAssetsPath}/transform/ratios/landing-transform-16-9${fileName}`;
		}
		if (path.includes('landing-transform-1-1')) {
			const [, fileName] = path.split('landing-transform-1-1');
			return `${landingAssetsPath}/transform/ratios/landing-transform-1-1${fileName}`;
		}
		if (path.includes('landing-transform-custom')) {
			const [, fileName] = path.split('landing-transform-custom');
			return `${landingAssetsPath}/transform/ratios/landing-transform-custom${fileName}`;
		}
		return path;
	}

	function getMimeType(path) {
		let imageExtension = BX.util.getExtension(path);
		if (imageExtension.length > 4) {
			imageExtension = imageExtension.split('_').pop();
		}
		return `image/${imageExtension === 'jpg' ? 'jpeg' : imageExtension}`;
	}

	const proxyPath = '/bitrix/tools/landing/proxy.php';
	const isValidDimensions = ({
		width,
		height
	} = {}) => {
		return main_core.Type.isNumber(width) && width > 0 && main_core.Type.isNumber(height) && height > 0;
	};
	function buildOptions({
		image,
		dimensions = {}
	} = {}) {
		const preparedDimensions = {
			width: dimensions.width || dimensions.maxWidth || dimensions.minWidth,
			height: dimensions.height || dimensions.maxHeight || dimensions.minHeight
		};
		return {
			image,
			megapixels: 100,
			proxy: proxyPath,
			defaultControl: 'transform',
			assets: {
				resolver: pathResolver
			},
			export: {
				format: getMimeType(image),
				type: BX.Main.ImageEditor.renderType.BLOB,
				quality: 1
			},
			controlsOptions: {
				transform: {
					categories: [{
						identifier: 'sites_recommended',
						defaultName: main_core.Loc.getMessage('LANDING_IMAGE_EDITOR_RECOMMENDED_RATIOS'),
						ratios: [{
							identifier: 'sites_recommended_transform_retina',
							defaultName: main_core.Loc.getMessage('LANDING_IMAGE_EDITOR_TRANSFORM_DEFAULT'),
							ratio: (() => {
								if (isValidDimensions(preparedDimensions)) {
									return preparedDimensions.width / preparedDimensions.height;
								}
								return '*';
							})()
						}, {
							identifier: 'landing-transform-custom',
							defaultName: main_core.Loc.getMessage('IMAGE_EDITOR_RATIOS_CUSTOM'),
							ratio: '*'
						}]
					}, {
						identifier: 'sites_other',
						defaultName: main_core.Loc.getMessage('LANDING_IMAGE_EDITOR_OTHER_RATIOS'),
						ratios: [{
							identifier: 'landing-transform-1-1',
							defaultName: '1:1',
							ratio: 1
						}, {
							identifier: 'landing-transform-3-4',
							defaultName: '3:4',
							ratio: 3 / 4
						}, {
							identifier: 'landing-transform-4-3',
							defaultName: '4:3',
							ratio: 4 / 3
						}, {
							identifier: 'landing-transform-9-16',
							defaultName: '9:16',
							ratio: 9 / 16
						}, {
							identifier: 'landing-transform-16-9',
							defaultName: '16:9',
							ratio: 16 / 9
						}]
					}],
					replaceCategories: false,
					availableRatios: ['sites_recommended_transform_default', 'sites_recommended_transform_retina', 'landing-transform-3-4', 'landing-transform-4-3', 'landing-transform-9-16', 'landing-transform-16-9', 'landing-transform-1-1', 'landing-transform-custom']
				}
			}
		};
	}

	function getFilename(path) {
		return path.split('\\').pop().split('/').pop();
	}

	/**
	 * @memberOf BX.Landing
	 */
	class ImageEditor {
		static edit(options) {
			const imageEditor = BX.Main.ImageEditor.getInstance();
			const preparedOptions = buildOptions(options);
			return imageEditor.edit(preparedOptions).then(file => {
				file.name = decodeURIComponent(getFilename(options.image));
				return file;
			});
		}
	}

	exports.ImageEditor = ImageEditor;

})(this.BX.Landing = this.BX.Landing || {}, BX.Main, BX);
//# sourceMappingURL=imageeditor.bundle.js.map
