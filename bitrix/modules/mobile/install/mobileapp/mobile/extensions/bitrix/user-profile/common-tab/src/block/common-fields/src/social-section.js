/**
 * @module user-profile/common-tab/src/block/common-fields/src/social-section
 */
jn.define('user-profile/common-tab/src/block/common-fields/src/social-section', (require, exports, module) => {
	const { Area } = require('ui-system/layout/area');
	const { Text4, Text7 } = require('ui-system/typography/text');
	const { ChipButton, ChipButtonDesign, ChipButtonMode } = require('ui-system/blocks/chips/chip-button');
	const { Icon } = require('ui-system/blocks/icon');
	const { Color, Indent } = require('tokens');
	const { PropTypes } = require('utils/validation');
	const { createTestIdGenerator } = require('utils/test');
	const { isSupportedPlatform } = require('utils/url/social');
	const { Loc } = require('loc');
	const { Type } = require('type');
	const { Haptics } = require('haptics');
	const { BaseEditWrapper } = require('user-profile/common-tab/src/block/base-edit');
	const { SocialListBox } = require('user-profile/common-tab/src/block/common-fields/src/social-list-box');
	const { FieldFactory, FieldType } = require('user-profile/common-tab/src/block/common-fields/src/field/factory');
	const {
		isFieldVisible,
		isFieldEditable,
		isFieldValueEmpty,
		getSocialPlatformById,
	} = require('user-profile/common-tab/src/block/common-fields/src/utils');

	const SOCIAL_SECTION_ID = 'social';

	class SocialSection extends LayoutComponent
	{
		/**
		 * @param {object} props
		 * @param {string} props.testId
		 * @param {string} props.title
		 * @param {function} props.onSocialValueChange
		 * @param {Array} [props.fields=[]]
		 * @param {boolean} [props.isFirst=false]
		 * @param {boolean} [props.isEditMode=false]
		 * @param {PageManager} [props.parentWidget=PageManager]
		 */
		constructor(props)
		{
			super(props);

			this.getTestId = createTestIdGenerator({ context: this });

			this.onSocialAddClick = this.#onSocialAddClick.bind(this);
			this.onSocialRemove = this.#onSocialRemove.bind(this);

			this.state = {
				fields: this.props.fields,
			};
		}

		get fields()
		{
			return this.state.fields.filter((field) => isFieldVisible(field) && !isFieldValueEmpty(field));
		}

		render()
		{
			const { isEditMode, isFirst, title } = this.props;

			if (isEditMode)
			{
				return BaseEditWrapper({
					testId: this.getTestId('edit-section'),
					title: title?.toUpperCase(),
					content: this.#renderContent(),
				});
			}

			if (!Type.isArrayFilled(this.fields))
			{
				return null;
			}

			return Area(
				{
					isFirst,
				},
				Text4({
					style: {
						marginBottom: Indent.XL2.toNumber(),
					},
					testId: this.getTestId('section-title'),
					text: title,
					accent: true,
					color: Color.base1,
				}),
				this.#renderContent(),
			);
		}

		#renderContent()
		{
			return View(
				{
					style: {
						marginTop: (this.props.isEditMode ? Indent.M.toNumber() : 0),
						marginBottom: Indent.XL.toNumber(),
					},
				},
				View(
					{
						style: {
							width: '100%',
							flexDirection: 'row',
							flexWrap: 'wrap',
						},
					},
					...this.#renderFields(),
					this.#shouldRenderAddButton() && this.#renderAddButton(),
				),
				this.#renderBottomText(),
			);
		}

		#renderFields()
		{
			return this.fields.map((field) => {
				return FieldFactory.create(
					FieldType.SOCIAL,
					{
						...field,
						isEditMode: this.props.isEditMode,
						testId: this.getTestId(field.id),
						onSocialRemove: this.onSocialRemove,
					},
				);
			});
		}

		#shouldRenderAddButton()
		{
			return this.props.isEditMode && this.#getSocialsToAdd().length > 0;
		}

		#renderAddButton()
		{
			return ChipButton({
				style: {
					marginRight: Indent.XL.toNumber(),
					marginBottom: Indent.XL.toNumber(),
				},
				mode: ChipButtonMode.OUTLINE,
				design: ChipButtonDesign.GREY,
				icon: Icon.PLUS,
				text: Loc.getMessage('M_PROFILE_COMMON_FIELDS_SOCIAL_ADD'),
				testId: this.getTestId('add-social-button'),
				onClick: this.onSocialAddClick,
			});
		}

		#renderBottomText()
		{
			if (
				env.region !== 'ru'
				|| !this.fields.filter((field) => !isFieldValueEmpty(field)).some((field) => field.id === 'UF_FACEBOOK')
			)
			{
				return null;
			}

			return Text7({
				style: {
					marginTop: Indent.L.toNumber(),
				},
				testId: this.getTestId('bottom-text'),
				color: Color.base4,
				text: Loc.getMessage('M_PROFILE_COMMON_FIELDS_SOCIAL_BOTTOM_TEXT'),
			});
		}

		#onSocialAddClick()
		{
			const { parentWidget, onSocialValueChange } = this.props;

			Haptics.impactLight();
			SocialListBox.open({
				parentWidget,
				socials: this.#getSocialsToAdd(),
				onSocialAdd: (id, value) => {
					this.setState(
						{
							fields: this.state.fields.map((field) => (field.id === id ? { ...field, value } : field)),
						},
						() => onSocialValueChange(id, value),
					);
				},
			});
		}

		#onSocialRemove(id)
		{
			Haptics.impactLight();
			this.setState(
				{
					fields: this.state.fields.map((field) => (field.id === id ? { ...field, value: '' } : field)),
				},
				() => this.props.onSocialValueChange(id, ''),
			);
		}

		#getSocialsToAdd()
		{
			return this.state.fields.filter((field) => (
				isFieldVisible(field)
				&& isFieldEditable(field)
				&& isFieldValueEmpty(field)
				&& isSupportedPlatform(getSocialPlatformById(field.id))
			));
		}
	}

	SocialSection.defaultProps = {
		fields: [],
		isFirst: false,
		isEditMode: false,
		parentWidget: PageManager,
	};

	SocialSection.propTypes = {
		testId: PropTypes.string.isRequired,
		title: PropTypes.string.isRequired,
		onSocialValueChange: PropTypes.func.isRequired,
		fields: PropTypes.array,
		isFirst: PropTypes.bool,
		isEditMode: PropTypes.bool,
		parentWidget: PropTypes.object,
	};

	module.exports = {
		SocialSection,
		SOCIAL_SECTION_ID,
	};
});
