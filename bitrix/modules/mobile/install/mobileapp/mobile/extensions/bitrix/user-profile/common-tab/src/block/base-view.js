/**
 * @module user-profile/common-tab/src/block/base-view
 */
jn.define('user-profile/common-tab/src/block/base-view', (require, exports, module) => {
	const { Indent, Color, Corner, Component } = require('tokens');
	const { Text4 } = require('ui-system/typography/text');
	const { Card } = require('ui-system/layout/card');

	const ViewMode = {
		FULL_WIDTH: 'full',
		HALF_WIDTH: 'half',
	};

	const BaseViewStyles = {
		backgroundColor: Color.bgContentPrimary.toHex(),
		flexDirection: 'column',
		justifyContent: 'center',
		marginTop: Component.cardListGap.toNumber(),
	};

	const ViewModeStyles = {
		[ViewMode.FULL_WIDTH]: {
			...BaseViewStyles,
			width: '90%',
			borderRadius: Component.cardPaddingT.toNumber(),
			padding: Component.cardPaddingLr.toNumber(),
			marginHorizontal: Component.areaPaddingLr.toNumber(),
		},
		[ViewMode.HALF_WIDTH]: {
			...BaseViewStyles,
			minWidth: 156,
			borderRadius: Corner.L.toNumber(),
			padding: Indent.XL.toNumber(),
		},
	};

	/**
	 * @function BaseViewWrapper
	 * @param {Object} props
	 * @param {string} [props.title]
	 * @param {Object} [props.content]
	 * @param {string} [props.testId]
	 * @param {Object} [props.viewMode]
	 * @param {Function} [props.onClick]
	 * @param {Object} [props.style]
	 * @return BaseViewWrapper
	 */
	const BaseViewWrapper = (props) => {
		const {
			title,
			content,
			testId,
			viewMode = ViewMode.FULL_WIDTH,
			onClick,
			style: customStyles = {},
		} = props;

		const viewModeStyles = ViewModeStyles[viewMode] ?? ViewModeStyles[ViewMode.FULL_WIDTH];

		const renderTitle = () => {
			if (!title)
			{
				return null;
			}

			return Text4({
				accent: true,
				text: title,
				color: Color.base1,
				style: {
					marginBottom: Indent.XL2.toNumber(),
				},
			});
		};

		const renderContent = () => {
			return content;
		};

		return Card(
			{
				style: {
					...viewModeStyles,
					...customStyles,
				},
				onClick,
				testId,
			},
			renderTitle(),
			renderContent(),
		);
	};

	BaseViewWrapper.defaultProps = {
		title: null,
		content: null,
		testId: null,
		viewMode: ViewMode.FULL_WIDTH,
	};

	BaseViewWrapper.propTypes = {
		testId: PropTypes.string.isRequired,
		viewMode: PropTypes.oneOf([ViewMode.FULL_WIDTH, ViewMode.HALF_WIDTH]),
		title: PropTypes.string,
		content: PropTypes.object,
		onClick: PropTypes.func,
		style: PropTypes.object,
	};

	module.exports = {
		BaseViewWrapper,
		ViewMode,
	};
});
