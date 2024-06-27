/**
 * @module elements-stack
 */
jn.define('elements-stack', (require, exports, module) => {
	const { Color, Indent, Component } = require('tokens');
	const { mergeImmutable } = require('utils/object');
	const { PropTypes } = require('utils/validation');
	const { Text } = require('ui-system/typography/text');

	const Directions = {
		left: 'left',
		right: 'right',
	};

	const toArray = (value) => {
		if (!value)
		{
			return [];
		}

		return Array.isArray(value) ? value : [value];
	};

	/**
	 * @function ElementsStack
	 * @param {Object} props
	 * @param {string} [props.direction]
	 * @param {Indent} [props.offset]
	 * @param {Indent} [props.indent]
	 * @param {Component} [props.radius]
	 * @param {Color} [props.textColor]
	 * @param {number} [props.textSize]
	 * @param {number} [props.maxElements]
	 * @param {Color} [props.backgroundColor]
	 * @param {boolean} [props.showRest]
	 * @param {Array<View>} restChildren
	 * @return View
	 */
	const ElementsStack = (props = {}, ...restChildren) => {
		const {
			textColor,
			textSize = 4,
			showRest = true,
			direction = Directions.left,
			offset = Indent.S,
			indent = Indent.XS2,
			maxElements = 999,
			radius = Component.elementAccentCorner,
			backgroundColor = Color.bgContentPrimary,
			...restProps
		} = props;

		const elements = toArray(restChildren);

		if (elements.length === 0)
		{
			return null;
		}

		const isRight = direction.toLowerCase() === Directions.right;
		const indentWidth = indent instanceof Indent ? indent.toNumber() : 0;
		const offsetWidth = offset instanceof Indent ? offset.toNumber() : 0;
		const calcOffset = offsetWidth > 0 ? offsetWidth + indentWidth : 0;
		const borderRadius = radius?.toNumber() || 0;

		const getDirectionStyle = ({ index }) => {
			const isFirst = index === 0;
			const isLast = index === elements.length - 1;
			const directionStyle = {};

			if (isRight)
			{
				directionStyle.marginLeft = isFirst ? 0 : -calcOffset;
				directionStyle.zIndex = -index;
			}
			else
			{
				directionStyle.marginRight = isLast ? 0 : -calcOffset;
				directionStyle.zIndex = index;
			}

			return directionStyle;
		};

		const getRenderElements = () => elements.map((element, index) => {
			if (index + 1 > maxElements)
			{
				return null;
			}

			return View(
				{
					style: getDirectionStyle({ element, index }),
				},
				View(
					{
						style: {
							borderWidth: indentWidth,
							borderColor: backgroundColor.toHex(),
							borderRadius,
						},
					},
					element,
				),
			);
		}).filter(Boolean);

		const minRestTextMargin = 4;
		const isShowRestText = showRest && elements.length > maxElements;

		const paddingRight = isRight ? 0 : (isShowRestText ? 0 : offset);
		const marginLeft = isRight ? minRestTextMargin : calcOffset + minRestTextMargin;

		const restElementsCountText = Text({
			size: 4,
			text: `+${elements.length - maxElements}`,
			style: {
				textSize,
				color: Color.resolve(textColor, Color.base1).toHex(),
				marginLeft,
			},
		});

		const mainProps = mergeImmutable(
			restProps,
			{
				style: {
					alignItems: 'center',
					flexDirection: 'row',
					paddingRight,
				},
			},
		);

		return View(
			mainProps,
			...getRenderElements(),
			isShowRestText && restElementsCountText,
		);
	};

	ElementsStack.defaultProps = {
		textSize: 4,
		showRest: true,
		direction: Directions.left,
		offset: Indent.S,
		indent: Indent.XS2,
		maxElements: 999,
		radius: Component.elementAccentCorner,
		backgroundColor: Color.bgContentPrimary,
	};

	ElementsStack.propTypes = {
		children: PropTypes.oneOfType([
			PropTypes.object,
			PropTypes.arrayOf(PropTypes.object),
		]),
		direction: PropTypes.oneOf([Directions.right, Directions.left]),
		offset: PropTypes.number,
		indent: PropTypes.object,
		radius: PropTypes.object,
		textColor: PropTypes.object,
		textSize: PropTypes.number,
		maxElements: PropTypes.number,
		showRest: PropTypes.bool,
	};

	module.exports = { ElementsStack, Directions, DirectionType: 'directions' };
});
