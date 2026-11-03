/**
 * @module mail/templates/src/template-create
 */
jn.define('mail/templates/src/template-create', (require, exports, module) => {
	const { PureComponent } = require('layout/pure-component');
	const { Loc } = require('loc');
	const { Color, Indent } = require('tokens');
	const { Box } = require('ui-system/layout/box');
	const { StringInput, InputDesign, InputMode, InputSize } = require('ui-system/form/inputs/string');
	const { TextAreaInput } = require('ui-system/form/inputs/textarea');
	const { showErrorToast } = require('toast');
	const { plainTextToCanonicalHtml } = require('mail/draft/compose-state');

	class TemplateCreate extends PureComponent
	{
		constructor(props)
		{
			super(props);
			this.state = { subject: '', body: '', saving: false };
		}

		componentDidMount()
		{
			this.refreshSaveButton();
		}

		componentDidUpdate()
		{
			this.refreshSaveButton();
		}

		render()
		{
			return Box(
				{
					testId: 'mail-template-create-form',
					backgroundColor: Color.bgPrimary,
					withScroll: true,
					resizableByKeyboard: true,
					safeArea: { bottom: true },
				},
				View(
					{ style: { padding: Indent.XL3.toNumber() } },
					StringInput({
						testId: 'mail-template-create-subject',
						value: this.state.subject,
						label: Loc.getMessage('MAILMOBILE_MAIL_TEMPLATES_SUBJECT'),
						placeholder: Loc.getMessage('MAILMOBILE_MAIL_TEMPLATES_SUBJECT'),
						size: InputSize.L,
						design: InputDesign.GREY,
						mode: InputMode.STROKE,
						onChange: (value) => this.setState({ subject: value?.text ?? value ?? '' }),
					}),
					TextAreaInput({
						testId: 'mail-template-create-body',
						value: this.state.body,
						label: Loc.getMessage('MAILMOBILE_MAIL_TEMPLATES_BODY'),
						placeholder: Loc.getMessage('MAILMOBILE_MAIL_TEMPLATES_BODY'),
						design: InputDesign.GREY,
						mode: InputMode.STROKE,
						height: 240,
						showBBCode: false,
						showCharacterCount: false,
						onChange: (body) => this.setState({ body }),
						style: { marginTop: Indent.XL.toNumber() },
					}),
				),
			);
		}

		canSave()
		{
			return !this.state.saving && this.state.subject.trim() !== '';
		}

		refreshSaveButton()
		{
			const enabled = this.canSave();
			this.props.layoutWidget.setRightButtons([{
				name: Loc.getMessage('MAILMOBILE_MAIL_TEMPLATES_SAVE'),
				testId: 'mail-template-create-save',
				type: 'text',
				color: enabled ? Color.accentMainPrimary.toHex() : Color.base6.toHex(),
				callback: () => enabled && this.save(),
			}]);
		}

		save = async () => {
			if (!this.canSave())
			{
				return;
			}

			this.setState({ saving: true });
			try
			{
				const { reference } = await this.props.api.create({
					subject: this.state.subject.trim(),
					bodyHtml: plainTextToCanonicalHtml(this.state.body),
					emailFrom: this.props.emailFrom,
				});
				this.props.onCreated?.(reference);
				this.props.layoutWidget.close();
			}
			catch (failure)
			{
				this.setState({ saving: false });
				showErrorToast(
					{ message: Loc.getMessage('MAILMOBILE_MAIL_TEMPLATES_SAVE_ERROR') },
					this.props.layoutWidget,
				);
			}
		};
	}

	TemplateCreate.defaultProps = { emailFrom: '' };

	module.exports = { TemplateCreate };
});
