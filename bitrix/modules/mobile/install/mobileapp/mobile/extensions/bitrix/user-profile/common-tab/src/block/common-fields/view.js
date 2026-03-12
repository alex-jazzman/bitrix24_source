/**
 * @module user-profile/common-tab/src/block/common-fields/view
 */
jn.define('user-profile/common-tab/src/block/common-fields/view', (require, exports, module) => {
	const { createTestIdGenerator } = require('utils/test');
	const { FieldFactory } = require('user-profile/common-tab/src/block/common-fields/src/field/factory');
	const { Color, Indent } = require('tokens');
	const { Loc } = require('loc');
	const { Text4 } = require('ui-system/typography/text');
	const { openInfoBox } = require('user-profile/common-tab/src/block/common-fields/src/info-box');
	const { BaseEditWrapper } = require('user-profile/common-tab/src/block/base-edit');
	const { isFieldValueEmpty, isFieldVisible } = require('user-profile/common-tab/src/block/common-fields/src/utils');
	const { PropTypes } = require('utils/validation');
	const {
		SocialSection,
		SOCIAL_SECTION_ID,
	} = require('user-profile/common-tab/src/block/common-fields/src/social-section');

	const { connect } = require('statemanager/redux/connect');
	const { usersSelector } = require('statemanager/redux/slices/users');

	const ViewModeFieldIds = ['PERSONAL_MOBILE', 'UF_PHONE_INNER', 'EMAIL', 'DEPARTMENT_HEAD', 'DEPARTMENT', 'TEAM', 'PERSONAL_BIRTHDAY'];

	/**
	 * @typedef {Object} CommonFieldsProps
	 * @property {boolean} isEditMode
	 * @property {Array} [sections = []]
	 * @property {function} [onFocus]
	 * @property {function} [onChange]
	 * @property {Object} [parentWidget]

	 * @class CommonFields
	 */
	class CommonFields extends LayoutComponent
	{
		constructor(props)
		{
			super(props);

			this.getTestId = createTestIdGenerator({
				prefix: 'common-fields-block',
				context: this,
			});
			this.changedFields = {};

			this.#initState(this.props);
		}

		componentWillReceiveProps(props)
		{
			this.#initState(props);
		}

		#initState(props)
		{
			const { sections = [], email, personalMobile } = props;

			this.state = {
				sections: this.#updateSectionsWithReduxData(sections, email, personalMobile),
			};
		}

		#updateSectionsWithReduxData(sections, email, personalMobile)
		{
			sections.forEach(({ fields }) => {
				const emailField = fields.find(((field) => field.id === 'EMAIL'));
				if (emailField)
				{
					emailField.value = email || emailField.value;
				}

				const personalMobileField = fields.find(((field) => field.id === 'PERSONAL_MOBILE'));
				if (personalMobileField)
				{
					personalMobileField.value = personalMobile || personalMobileField.value;
				}
			});

			return sections;
		}

		render()
		{
			const { isEditMode } = this.props;

			if (isEditMode)
			{
				return this.#renderEditModeSections();
			}

			return this.#renderViewModeFields();
		}

		#renderEditModeSections()
		{
			const { sections = [] } = this.state;
			const renderedSections = sections.map((section) => this.#renderEditModeSection(section));

			return View(
				{
					testId: this.getTestId('edit-list'),
				},
				...renderedSections,
			);
		}

		#renderEditModeSection(section)
		{
			const { isEditMode, onFocus, parentWidget } = this.props;
			const { id, title, fields = [] } = section;

			if (id === SOCIAL_SECTION_ID)
			{
				return new SocialSection({
					isEditMode,
					parentWidget,
					title,
					fields,
					testId: this.getTestId('social-section'),
					onSocialValueChange: this.onFieldValueChange.bind(this),
				});
			}

			const renderedFields = fields
				.filter((field) => this.#isFieldVisibleInEditMode(field))
				.map((field, index) => FieldFactory.create(field.type, {
					...field,
					testId: field.id,
					isEditMode,
					isFirst: index === 0,
					onChange: this.onFieldValueChange.bind(this, field.id),
					onFocus,
				}));

			return BaseEditWrapper({
				testId: this.getTestId('edit-section'),
				title: title?.toUpperCase(),
				content: View(
					{},
					...renderedFields,
				),
			});
		}

		#isFieldVisibleInEditMode = (field) => {
			const { isEditMode } = this.props;
			const { isEditable } = field;

			return (isEditMode && isEditable) || (!isEditMode && !isFieldValueEmpty(field));
		};

		onFieldValueChange = (fieldId, value, isValid = true) => {
			const { onChange } = this.props;
			const { id, type } = this.#getFieldById(fieldId);
			this.changedFields[fieldId] = {
				id,
				type,
				value,
				isValid,
			};
			onChange?.('commonFields', this.changedFields, this.isChangedFieldsValid());
		};

		isChangedFieldsValid = () => {
			return Object.values(this.changedFields).every((field) => field.isValid);
		};

		#getFieldById(fieldId)
		{
			const { sections = [] } = this.state;

			return sections
				.flatMap((section) => section.fields || [])
				.find((field) => field.id === fieldId);
		}

		#renderViewModeFields()
		{
			const { isEditMode, parentWidget } = this.props;
			const { sections = [] } = this.state;

			const renderedFields = sections
				.flatMap((section) => section.fields || [])
				.filter((field) => !isFieldValueEmpty(field) && isFieldVisible(field) && ViewModeFieldIds.includes(field.id))
				.sort((a, b) => ViewModeFieldIds.indexOf(a.id) - ViewModeFieldIds.indexOf(b.id))
				.map((field, index) => FieldFactory.create(field.type, {
					...field,
					testId: field.id,
					isEditMode,
					isFirst: index === 0,
					parentWidget,
				}));

			return View(
				{},
				...renderedFields,
				this.#renderShowAllFieldsButton(),
			);
		}

		#renderShowAllFieldsButton()
		{
			return View(
				{
					style: {
						width: '100%',
						alignItems: 'center',
					},
					onClick: this.onShowAllFieldsLinkClick,
				},
				this.#renderDivider(),
				Text4({
					color: Color.base3,
					text: Loc.getMessage('M_PROFILE_COMMON_FIELDS_EXPAND_BUTTON'),
					testId: this.getTestId('show-all-fields-link'),
				}),
			);
		}

		onShowAllFieldsLinkClick = () => {
			const { parentWidget } = this.props;
			const { sections = [] } = this.state;

			openInfoBox({
				testId: this.getTestId('common-fields-details'),
				sections,
				parentWidget,
			});
		};

		#renderDivider()
		{
			return View({
				style: {
					height: 1,
					width: '100%',
					backgroundColor: Color.bgSeparatorSecondary.toHex(),
					marginVertical: Indent.XL2.toNumber(),
				},
			});
		}
	}

	CommonFields.defaultProps = {
		sections: [],
	};

	CommonFields.propTypes = {
		isEditMode: PropTypes.bool.isRequired,
		sections: PropTypes.array,
		onFocus: PropTypes.func,
		onChange: PropTypes.func,
		parentWidget: PropTypes.object,
	};

	const mapStateToProps = (state, { ownerId }) => {
		const { email, personalMobile } = usersSelector.selectById(state, ownerId);

		return {
			email,
			personalMobile,
		};
	};

	module.exports = {
		/**
		 * @property {CommonFieldsProps} props
		 * @returns {CommonFields}
		 */
		CommonFields: connect(mapStateToProps)(CommonFields),
	};
});
