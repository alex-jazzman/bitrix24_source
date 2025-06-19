/**
 * @module ui-system/layout/card-list
 */
jn.define('ui-system/layout/card-list', (require, exports, module) => {
	const { Component } = require('tokens');
	const { mergeImmutable } = require('utils/object');
	const { PropTypes } = require('utils/validation');
	const { ScrollView } = require('layout/ui/scroll-view');

	/**
	 * @function CardList
	 * @param {Object} props
	 * @param {boolean} [props.divided]
	 * @param {boolean} [props.withScroll=true]
	 * @param {...Area} children
	 */
	function CardList(props = {}, ...children)
	{
		PropTypes.validate(CardList.propTypes, props, 'CardList');

		const {
			divided = true,
			withScroll = true,
			...restProps
		} = props;

		const ViewElement = withScroll ? ScrollView : View;
		const style = withScroll ? { height: '100%' } : {};

		return ViewElement(
			mergeImmutable(restProps, { style }),
			...children.map((child, index) => {
				const isFirst = index === 0;

				if (!divided || isFirst)
				{
					return child;
				}

				return View(
					{
						style: {
							marginTop: Component.cardListGap.toNumber(),
						},
					},
					child,
				);
			}),
		);
	}

	CardList.defaultProps = {
		divided: true,
		withScroll: true,
	};

	CardList.propTypes = {
		divided: PropTypes.bool,
		withScroll: PropTypes.bool,
	};

	module.exports = { CardList };
});
