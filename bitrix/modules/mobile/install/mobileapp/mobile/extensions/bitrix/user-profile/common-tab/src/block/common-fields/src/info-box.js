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
	const { isFieldValueEmpty } = require('user-profile/common-tab/src/block/common-fields/src/utils');

	/**
	 * @class InfoBox
	 */
	class InfoBox extends LayoutComponent
	{
		constructor(props)
		{
			super(props);
			this.getTestId = createTestIdGenerator({
				prefix: `info-box-${props.testId}`,
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

		#renderSection(section, isFirst)
		{
			const { title, fields = [] } = section;
			const renderedFields = fields
				.filter((field) => !isFieldValueEmpty(field))
				.map((field, index) => FieldFactory.create(field.type, {
					...field,
					testId: field.id,
					isEditMode: false,
					isFirst: index === 0,
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

	/**
	 * @param {Object} [parentWidget = PageManager]
	 * @param {Object} openWidgetConfig
	 * @param {Array} sections
	 */
	const openInfoBox = ({
		parentWidget = PageManager,
		openWidgetConfig = {},
		sections = [],
	}) => {
		const config = {
			enableNavigationBarBorder: false,
			titleParams: {
				text: Loc.getMessage('M_PROFILE_COMMON_FIELDS_INFO_BOX_TITLE'),
				type: 'dialog',
			},
			modal: true,
			backdrop: {
				showOnTop: true,
				onlyMediumPosition: false,
				mediumPositionHeight: 600,
				bounceEnable: true,
				swipeAllowed: true,
				swipeContentAllowed: false,
				horizontalSwipeAllowed: false,
				shouldResizeContent: true,
				adoptHeightByKeyboard: true,
			},
			...openWidgetConfig,
			onReady: (readyLayout) => {
				readyLayout.showComponent(new InfoBox({
					layout: readyLayout,
					parentWidget,
					sections,
				}));
			},
		};

		parentWidget.openWidget?.('layout', config);
	};

	module.exports = {
		openInfoBox,
	};
});
