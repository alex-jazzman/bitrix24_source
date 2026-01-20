/**
 * @module intranet/user-department-slider
 */
jn.define('intranet/user-department-slider', (require, exports, module) => {
	const { SwipeSlider, SliderNavigationMode } = require('ui-system/layout/swipe-slider');
	const { createTestIdGenerator } = require('utils/test');
	const { Indent, Component } = require('tokens');
	const { ReduxDepartmentStructure } = require('intranet/department-structure');
	const { Card } = require('ui-system/layout/card');
	const { PropTypes } = require('utils/validation');

	/**
	 * @typedef {Object} UserDepartmentSliderProps
	 * @property {string} testId
	 * @property {number} userId
	 * @property {number[][]} hierarchies
	 * @property {number} sliderWidth
	 * @property {bool} [chevron = false]
	 * @property {function} [onClick]
	 * @property {bool} [withPressed = false]

	 * @class UserDepartmentSlider
	 */
	class UserDepartmentSlider extends LayoutComponent
	{
		/**
		 * @param {UserDepartmentSliderProps} props
		 */
		constructor(props)
		{
			super(props);
			this.getTestId = createTestIdGenerator({
				context: this,
			});
			this.state = {
				contentHeight: 0,
				heights: [],
			};

			this.contentHeight = 0;
			this.heights = {};
			this.renderedStructuresCount = 0;
		}

		render()
		{
			const { sliderWidth } = this.props;
			const isIOS = this.#isIOS();
			const renderedStructures = this.#renderDepartmentStructures();
			if (renderedStructures.length === 1)
			{
				return renderedStructures[0];
			}

			return SwipeSlider({
				testId: this.getTestId('user-departments'),
				width: sliderWidth,
				children: [
					...renderedStructures,
				],
				style: {
					marginBottom: isIOS ? 0 : Component.cardPaddingB.toNumber(),
				},
				navigationMode: this.#isIOS() ? SliderNavigationMode.SWIPE : SliderNavigationMode.BUTTON,
				...this.#getSliderHeightProps(),
			});
		}

		#isIOS = () => {
			return Application.getPlatform() === 'ios';
		};

		#getSliderHeightProps = () => {
			const { contentHeight } = this.state;

			return contentHeight > 0 ? { contentHeight } : {};
		};

		onStructureLayout = (index, { height }) => {
			const { heights } = this.state;
			const { hierarchies } = this.props;
			if (heights.length === 0)
			{
				this.heights[index] = height;
				this.contentHeight = height > this.contentHeight ? height : this.contentHeight;
				this.renderedStructuresCount++;

				if (this.renderedStructuresCount === hierarchies.length)
				{
					this.setState({
						contentHeight: this.contentHeight + Indent.XL.toNumber(),
						heights: this.heights,
					});
				}
			}
		};

		#renderDepartmentStructures = () => {
			const { hierarchies } = this.props;
			const { heights } = this.state;

			return hierarchies
				.map((hierarchy, i) => ({ hierarchy, height: heights[i] }))
				.sort((a, b) => b.height - a.height)
				.map((item) => item.hierarchy)
				.map((departmentIds, index) => this.#renderDepartmentStructure(departmentIds, index));
		};

		#renderDepartmentStructure = (departmentIds, index) => {
			const preparedDepartmentIds = this.#prepareDepartmentIds(departmentIds);
			const { userId, sliderWidth, chevron, onClick, withPressed } = this.props;
			const cardStyle = sliderWidth ? { width: sliderWidth } : {};

			return Card(
				{
					style: cardStyle,
				},
				ReduxDepartmentStructure({
					testId: this.getTestId(`structure-${departmentIds?.[0]}`),
					departmentIds: preparedDepartmentIds,
					onLayout: this.onStructureLayout.bind(this, index),
					userId,
					chevron,
					withPressed,
					onClick,
				}),
			);
		};

		#prepareDepartmentIds = (departmentIds) => {
			if (departmentIds.length < 4)
			{
				return [departmentIds[0], ...departmentIds];
			}

			return departmentIds;
		};
	}

	UserDepartmentSlider.propTypes = {
		userId: PropTypes.number.isRequired,
		hierarchies: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)).isRequired,
		sliderWidth: PropTypes.number.isRequired,
		chevron: PropTypes.bool,
		onClick: PropTypes.func,
	};

	module.exports = {
		/**
		 * @param {UserDepartmentSliderProps} props
		 * @returns {UserDepartmentSlider}
		 */
		UserDepartmentSlider: (props) => new UserDepartmentSlider(props),
	};
});
