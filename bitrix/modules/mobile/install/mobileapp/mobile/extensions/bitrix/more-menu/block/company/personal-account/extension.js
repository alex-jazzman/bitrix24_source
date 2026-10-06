/**
 * @module more-menu/block/company/personal-account
 */
jn.define('more-menu/block/company/personal-account', (require, exports, module) => {
	const { Loc } = require('loc');
	const { Color, Indent } = require('tokens');

	const { Card, CardCorner } = require('ui-system/layout/card');
	const { IconView, Icon } = require('ui-system/blocks/icon');
	const { Text2, Text3 } = require('ui-system/typography/text');

	const { PropTypes } = require('utils/validation');
	const { createTestIdGenerator } = require('utils/test');
	const { PureComponent } = require('layout/pure-component');

	const ItemType = {
		SALARY: 'salary',
		VACATION: 'vacation',
	};

	/**
	 * @class PersonalAccountSection
	 */
	class PersonalAccountSection extends PureComponent
	{
		/**
		 * @param props
		 * @param {object} props.layout
		 * @param {Array} props.companies
		 * @param {string} props.testId
		 */
		constructor(props)
		{
			super(props);

			this.getTestId = createTestIdGenerator({
				prefix: props.testId,
			});
		}

		render()
		{
			return Card(
				{
					testId: this.getTestId('card'),
					corner: CardCorner.XL,
					style: {
						backgroundColor: Color.bgContentSecondaryInvert.toHex(),
					},
				},
				Text2({
					testId: this.getTestId('title'),
					text: Loc.getMessage('MORE_MENU_COMPANY_PERSONAL_ACCOUNT_TITLE'),
					color: Color.base1,
					accent: true,
					style: {
						marginBottom: Indent.L.toNumber(),
					},
				}),
				this.#renderItem({
					type: ItemType.SALARY,
					icon: Icon.RECEIPT,
					text: Loc.getMessage('MORE_MENU_COMPANY_PERSONAL_ACCOUNT_SALARY'),
				}),
				this.#renderItem({
					type: ItemType.VACATION,
					icon: Icon.VACATION,
					text: Loc.getMessage('MORE_MENU_COMPANY_PERSONAL_ACCOUNT_VACATION'),
				}),
			);
		}

		#renderItem({ type, icon, text })
		{
			return View(
				{
					testId: this.getTestId(`item-${type}`),
					style: {
						flexDirection: 'row',
						alignItems: 'center',
						paddingVertical: Indent.M.toNumber(),
					},
					onClick: () => this.#openItem(type),
				},
				IconView({
					testId: this.getTestId(`item-${type}-icon`),
					size: 24,
					icon,
					color: Color.accentMainPrimary,
				}),
				Text3({
					testId: this.getTestId(`item-${type}-text`),
					text,
					color: Color.base1,
					numberOfLines: 1,
					ellipsize: 'end',
					style: {
						flexGrow: 2,
						flexShrink: 2,
						marginLeft: Indent.XL.toNumber(),
					},
				}),
				IconView({
					testId: this.getTestId(`item-${type}-chevron`),
					size: 20,
					icon: Icon.CHEVRON_TO_THE_RIGHT,
					color: Color.base3,
					style: {
						marginLeft: Indent.XS.toNumber(),
					},
				}),
			);
		}

		#openItem(type)
		{
			const { layout, companies } = this.props;

			PersonalAccountSection.open({ layout, type, companies });
		}

		/**
		 * Opens the personal account flow for the requested section.
		 * @param {object} params
		 * @param {object} params.layout parent layout for the future bottom-sheet flow
		 * @param {string} params.type one of ItemType (salary | vacation)
		 * @param {Array} params.companies companies from the menu payload
		 */
		static open(params)
		{
			const { layout, type, companies } = params;
			const { PersonalAccountFlow } = require('more-menu/block/company/personal-account/src/flow');

			return PersonalAccountFlow.open({ type, companies, parentLayout: layout });
		}
	}

	PersonalAccountSection.propTypes = {
		layout: PropTypes.object.isRequired,
		companies: PropTypes.array,
		testId: PropTypes.string.isRequired,
	};

	module.exports = { PersonalAccountSection };
});
