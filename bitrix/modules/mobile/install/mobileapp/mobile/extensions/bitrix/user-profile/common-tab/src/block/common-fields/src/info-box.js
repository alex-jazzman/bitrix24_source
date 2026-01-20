/**
 * @module user-profile/common-tab/src/block/common-fields/src/info-box
 */
jn.define('user-profile/common-tab/src/block/common-fields/src/info-box', (require, exports, module) => {
	const { createTestIdGenerator } = require('utils/test');
	const { Text4 } = require('ui-system/typography/text');
	const { Color, Indent } = require('tokens');
	const { Loc } = require('loc');
	const { Area } = require('ui-system/layout/area');
	const { AreaList } = require('ui-system/layout/area-list');
	const { FieldFactory } = require('user-profile/common-tab/src/block/common-fields/src/field/factory');
	const { isFieldVisible, isFieldValueEmpty } = require('user-profile/common-tab/src/block/common-fields/src/utils');
	const { BottomSheet } = require('bottom-sheet');

	/**
	 * @typedef {Object} InfoBoxProps
	 * @property {string} testId
	 * @property {Array} [sections = []]

	 * @class InfoBox
	 */
	class InfoBox extends LayoutComponent
	{
		/**
		 * @param {InfoBoxProps} props
		 */
		constructor(props)
		{
			super(props);
			this.layout = null;
			this.getTestId = createTestIdGenerator({
				prefix: 'info-box',
				context: this,
			});
		}

		render()
		{
			const { sections = [] } = this.props;
			const renderedSections = sections.map((section, index) => this.#renderSection(section, index === 0));

			return AreaList(
				{
					testId: this.getTestId('list'),
					divided: true,
				},
				...renderedSections,
			);
		}

		setLayout(layout)
		{
			this.layout = layout;
		}

		#renderSection(section, isFirst)
		{
			const { title, fields = [] } = section;
			const renderedFields = fields
				.filter((field) => isFieldVisible(field) && !isFieldValueEmpty(field))
				.map((field, index) => FieldFactory.create(field.type, {
					...field,
					testId: field.id,
					isEditMode: false,
					isFirst: index === 0,
					parentWidget: this.layout,
				}));

			if (renderedFields.length === 0)
			{
				return null;
			}

			return Area(
				{
					isFirst,
				},
				this.#renderSectionTitle(title),
				...renderedFields,
			);
		}

		#renderSectionTitle(title)
		{
			return Text4({
				testId: this.getTestId('section-title'),
				text: title,
				accent: true,
				color: Color.base1,
				style: {
					marginBottom: Indent.XL2.toNumber(),
				},
			});
		}
	}

	InfoBox.propTypes = {
		testId: PropTypes.string.isRequired,
		sections: PropTypes.array,
	};

	/**
	 * @param {string} testId
	 * @param {Object} [parentWidget = PageManager]
	 * @param {Array} [sections = []]
	 */
	const openInfoBox = ({
		testId,
		parentWidget = PageManager,
		sections = [],
	}) => {
		const infoBox = new InfoBox({
			testId,
			sections,
		});
		(new BottomSheet({
			component: infoBox,
			titleParams: {
				type: 'dialog',
				text: Loc.getMessage('M_PROFILE_COMMON_FIELDS_INFO_BOX_TITLE'),
				largeMode: true,
			},
		}))
			.setParentWidget(parentWidget)
			.hideNavigationBarBorder()
			.disableOnlyMediumPosition()
			.setMediumPositionHeight(680)
			.enableBounce()
			.enableSwipe()
			.disableContentSwipe()
			.disableHorizontalSwipe()
			.enableResizeContent()
			.enableAdoptHeightByKeyboard()
			.open()
			.then((widget) => {
				infoBox.setLayout(widget);
			})
			.catch((e) => console.error(e));
	};

	module.exports = {
		openInfoBox,
	};
});
