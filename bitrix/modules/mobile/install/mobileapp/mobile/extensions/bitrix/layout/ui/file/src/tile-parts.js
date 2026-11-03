/**
 * @module layout/ui/file/src/tile-parts
 */
jn.define('layout/ui/file/src/tile-parts', (require, exports, module) => {
	const { Color, Component, Indent } = require('tokens');
	const { Text7 } = require('ui-system/typography/text');
	const { getNameWithoutExtension } = require('utils/file');

	const LABEL_WIDTH = 58;

	/**
	 * Sits on top of the preview and paints the border, or the whole plate when the upload failed.
	 * @param {boolean} [hasError]
	 * @return {View}
	 */
	function renderOutline(hasError)
	{
		return View({
			testId: 'pinnedFileOutline',
			style: outlineStyle(hasError),
		});
	}

	/**
	 * @param {number} size
	 * @return {View}
	 */
	function renderLoadingOverlay(size)
	{
		return View(
			{
				testId: 'pinnedFileLoader',
				style: {
					...outlineStyle(false),
					backgroundColor: Color.bgContentPrimary.toHex(),
					borderColor: null,
					opacity: 0.5,
				},
			},
			Loader({
				style: {
					width: size,
					height: size,
				},
				tintColor: Color.base0.toHex(),
				animating: true,
				size: 'small',
			}),
		);
	}

	/**
	 * @param {FileLabelProps} props
	 * @return {View}
	 */
	function renderLabel({ name, hasError, textLines, ellipsize })
	{
		const textProps = {
			testId: 'pinnedFileName',
			accent: true,
			color: hasError ? Color.accentMainAlert : Color.base4,
		};

		return View(
			{
				style: {
					marginTop: Indent.XS2.toNumber(),
					width: LABEL_WIDTH,
					justifyContent: 'center',
					alignItems: 'center',
				},
			},
			renderFileName({ name, textLines, ellipsize, textProps }),
		);
	}

	function renderFileName({ name, textLines, ellipsize, textProps })
	{
		if (Application.getPlatform() !== 'android' || !name)
		{
			return Text7({
				...textProps,
				style: {
					textAlign: 'center',
				},
				text: name,
				numberOfLines: textLines,
				ellipsize,
			});
		}

		const nameWithoutExtension = getNameWithoutExtension(name);
		const extension = nameWithoutExtension ? name.slice(nameWithoutExtension.length) : '';

		if (!extension)
		{
			return Text7({
				...textProps,
				style: {
					textAlign: 'center',
				},
				text: name,
				numberOfLines: textLines,
				ellipsize,
			});
		}

		return View(
			{
				style: {
					flexDirection: 'row',
					alignItems: 'flex-end',
					justifyContent: 'center',
					width: LABEL_WIDTH,
				},
			},
			Text7({
				...textProps,
				style: {
					textAlign: 'center',
					flexShrink: 1,
				},
				text: nameWithoutExtension,
				numberOfLines: textLines,
				ellipsize: 'end',
			}),
			Text7({
				...textProps,
				testId: 'pinnedFileExtension',
				style: {
					textAlign: 'center',
					flexShrink: 0,
				},
				text: extension,
				numberOfLines: 1,
			}),
		);
	}

	/**
	 * @param {boolean} [hasError]
	 * @return {FileStyle}
	 */
	function outlineStyle(hasError)
	{
		return {
			position: 'absolute',
			top: 0,
			left: 0,
			right: 0,
			bottom: 0,
			borderColor: hasError ? Color.accentMainAlert.toHex() : Color.bgSeparatorPrimary.toHex(),
			backgroundColor: hasError ? Color.accentMainAlert.toHex() : null,
			borderWidth: 1,
			opacity: hasError ? 0.5 : 0.08,
			borderRadius: Component.elementSCorner.toNumber(),
		};
	}

	module.exports = { renderOutline, renderLoadingOverlay, renderLabel };
});
