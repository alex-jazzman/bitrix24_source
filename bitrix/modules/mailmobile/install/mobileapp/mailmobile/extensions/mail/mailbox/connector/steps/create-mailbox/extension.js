/**
 * @module mail/mailbox/connector/steps/create-mailbox
 */

jn.define('mail/mailbox/connector/steps/create-mailbox', (require, exports, module) => {
	const { Haptics } = require('haptics');
	const { WizardStep } = require('layout/ui/wizard/step');
	const { Loc } = require('loc');
	const { ProgressBarNumber } = require('mail/mailbox/connector/progress-bar-number');
	const { useCallback } = require('utils/function');
	const { clone, isEmpty } = require('utils/object');
	const { stringify } = require('utils/string');
	const { StringInput, InputDesign, InputMode, InputSize } = require('ui-system/form/inputs/string');
	const { PureComponent } = require('layout/pure-component');
	const { Color, Indent, Typography } = require('tokens');
	const {
		ButtonSize,
		ButtonDesign,
		Button,
	} = require('ui-system/form/buttons/button');

	const DOMAIN_SUFFIX = '@bitrix24';
	const ACTIVE_STEP_COLOR = Color.accentMainPrimary.toHex();
	const NEXT_STEP_COLOR = Color.base6.toHex();

	/**
	 * @class FieldsLayout
	 */
	class FieldsLayout extends PureComponent
	{
		constructor(props)
		{
			super(props);

			this.fieldRefs = {};
			this.constants = {
				fields: {
					name: {
						ref: (ref) => this.fieldRefs.name = ref,
					},
				},
			};

			this.state = {
				fields: this.getEmptyFieldsData(),
			};

			this.createAction = props.createAction;
		}

		getEmptyFieldsData()
		{
			return {
				name: {
					value: '',
				},
			};
		}

		onChangeField(key, data)
		{
			const fields = clone(this.state.fields);
			fields[key].value = stringify(data);
			this.setState({ fields });
		}

		getInvalidField()
		{
			const { name } = this.state.fields;

			if (isEmpty(name.value))
			{
				const nameField = this.fieldRefs.name;

				if (nameField)
				{
					return nameField;
				}
			}

			return null;
		}

		getFields()
		{
			return {
				name: this.state.fields.name.value,
				domain: DOMAIN_SUFFIX,
			};
		}

		render()
		{
			return View(
				{
					style: {
						flex: 1,
					},
				},
				View(
					{
						style: {
							flexDirection: 'row',
							alignItems: 'flex-start',
						},
					},
					View(
						{
							style: {
								flex: 1,
							},
						},
						StringInput({
							label: Loc.getMessage('MAILBOX_CONNECTOR_CREATE_MAILBOX_NAME_TITLE'),
							size: InputSize.L,
							design: InputDesign.GREY,
							mode: InputMode.STROKE,
							showTitle: false,
							validation: true,
							testId: 'connecting-mailboxes-create-mailbox-name',
							ref: this.constants.fields.name.ref,
							showRequired: false,
							required: true,
							value: this.state.fields.name.value,
							onChange: useCallback((data) => this.onChangeField('name', data), ['name']),
							onValid: isEmpty,
							placeholder: Loc.getMessage('MAILBOX_CONNECTOR_CREATE_MAILBOX_NAME_PLACEHOLDER'),
						}),
					),
					View(
						{
							style: {
								width: 140,
								marginLeft: Indent.M.toNumber(),
							},
						},
						StringInput({
							size: InputSize.L,
							design: InputDesign.GREY,
							mode: InputMode.STROKE,
							showTitle: false,
							testId: 'connecting-mailboxes-create-mailbox-domain',
							readOnly: true,
							value: DOMAIN_SUFFIX,
						}),
					),
				),
				View(
					{
						style: {
							height: 40,
						},
					},
				),
				Button({
					testId: 'connecting-mailboxes-create-mailbox-button-confirm',
					text: Loc.getMessage('MAILBOX_CONNECTOR_CREATE_MAILBOX_BUTTON'),
					size: ButtonSize.XL,
					design: ButtonDesign.FILLED,
					disabled: false,
					stretched: true,
					onClick: this.createAction,
				}),
			);
		}
	}

	/**
	 * @class CreateMailbox
	 */
	class CreateMailbox extends WizardStep
	{
		constructor(props)
		{
			super();
			this.props = props;
			this.onCreate = this.onCreate.bind(this);
		}

		getBackgroundColor()
		{
			return Color.bgPrimary.toHex();
		}

		checkFieldsValid()
		{
			const invalidField = this.fieldsLayout.getInvalidField();

			if (invalidField)
			{
				invalidField?.focus();
				Haptics.notifyWarning();

				return false;
			}

			return true;
		}

		onCreate()
		{
			if (!this.checkFieldsValid())
			{
				return;
			}

			this.props.parent.createBitrixMailbox(this.fieldsLayout.getFields());
		}

		getProgressBarSettings()
		{
			return {
				...super.getProgressBarSettings(),
				isEnabled: true,
				title: {
					text: Loc.getMessage('MAILBOX_CONNECTOR_CREATE_MAILBOX_STEP_TITLE'),
					style: Typography.text3Accent.getStyle(),
				},
				number: 2,
				count: 2,
				previousLineColor: ACTIVE_STEP_COLOR,
				currentLineColor: ACTIVE_STEP_COLOR,
				nextLineColor: NEXT_STEP_COLOR,
			};
		}

		renderNumberBlock()
		{
			const progressBarSettings = this.getProgressBarSettings();

			return new ProgressBarNumber({
				number: progressBarSettings.number.toString(),
				backgroundColor: ACTIVE_STEP_COLOR,
				showOuterDecoration: false,
			});
		}

		getTitle()
		{
			return Loc.getMessage('MAILBOX_CONNECTOR_CREATE_MAILBOX_HEADER_TITLE');
		}

		createLayout(props)
		{
			this.fieldsLayout = new FieldsLayout({
				createAction: this.onCreate,
			});

			return View(
				{
					style: {
						flex: 1,
					},
				},
				View(
					{
						style: {
							flex: 1,
							margin: Indent.XL2.toNumber(),
							paddingLeft: Indent.XL2.toNumber(),
							paddingRight: Indent.XL2.toNumber(),
							paddingBottom: 37,
							paddingTop: 27,
						},
					},
					View(
						{
							style: {
								flex: 1,
								paddingLeft: Indent.S.toNumber(),
							},
						},
						this.fieldsLayout,
					),
				),
			);
		}
	}

	module.exports = { CreateMailbox };
});
