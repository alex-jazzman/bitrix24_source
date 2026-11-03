/**
 * @module layout/ui/file/src/action-button
 */
jn.define('layout/ui/file/src/action-button', (require, exports, module) => {
	const { Icon } = require('ui-system/blocks/icon');
	const { BadgeButton, BadgeButtonDesign, BadgeButtonSize } = require('ui-system/blocks/badges/button');
	const { Indent } = require('tokens');

	const BADGE_SIZE = BadgeButtonSize.S;
	const TAP_AREA_PADDING = Indent.M.toNumber();

	// the badge sits in the top right corner of the preview and reaches a little past it to be easy to hit
	const CORNER_STYLE = {
		position: 'absolute',
		top: 0,
		right: 0,
		justifyContent: 'flex-start',
		alignItems: 'flex-end',
		width: BADGE_SIZE.toNumber() + TAP_AREA_PADDING,
		height: BADGE_SIZE.toNumber() + TAP_AREA_PADDING,
	};

	/**
	 * @param {FileActionButtonProps} props
	 * @return {View}
	 */
	function renderMenuButton({ onClick })
	{
		return View(
			{
				testId: 'filePreviewMenu',
				style: CORNER_STYLE,
				onClick,
			},
			BadgeButton({
				testId: 'filePreviewMenuBadge',
				icon: Icon.MORE,
				design: BadgeButtonDesign.GREY,
				size: BADGE_SIZE,
			}),
		);
	}

	/**
	 * @param {FileActionButtonProps} props
	 * @return {View}
	 */
	function renderDeleteButton({ attachmentCloseIcon, onClick })
	{
		return View(
			{
				testId: 'pinnedFileDetach',
				style: CORNER_STYLE,
				onClick,
			},
			attachmentCloseIcon ? renderCustomIcon(attachmentCloseIcon) : BadgeButton({
				testId: 'pinnedFileDetachBadge',
				icon: Icon.CROSS,
				design: BadgeButtonDesign.GREY,
				size: BADGE_SIZE,
			}),
		);
	}

	/**
	 * A consumer may pass its own close icon instead of the design system badge.
	 * @param {string} svgContent
	 * @return {Image}
	 */
	function renderCustomIcon(svgContent)
	{
		const size = BADGE_SIZE.toNumber();

		return Image({
			svg: {
				content: svgContent,
			},
			resizeMode: 'cover',
			style: {
				width: size,
				height: size,
			},
		});
	}

	module.exports = { renderMenuButton, renderDeleteButton };
});
