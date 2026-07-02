/**
 * @module mail/dialog/banners/connectingmail/src/form-drawer
 */
jn.define('mail/dialog/banners/connectingmail/src/form-drawer', (require, exports, module) => {
	const { Loc } = require('loc');
	const { Color, Indent } = require('tokens');
	const { NotifyManager } = require('notify-manager');
	const { AnalyticsEvent } = require('analytics');
	const { Box } = require('ui-system/layout/box');
	const { BoxFooter } = require('ui-system/layout/dialog-footer');
	const { Text4, Text7 } = require('ui-system/typography/text');
	const { TextAreaInput } = require('ui-system/form/inputs/textarea');
	const { StatusBlock, makeLibraryImagePath } = require('ui-system/blocks/status-block');
	const {
		Button,
		ButtonSize,
		ButtonDesign,
	} = require('ui-system/form/buttons/button');
	const { getMediumHeight } = require('utils/page-manager');
	const { AjaxMethod } = require('mail/const');

	const COMMENT_MAX_LENGTH = 100;
	const DRAWER_HEIGHT = 570;
	const SUCCESS_HEIGHT = 380;

	const ViewType = {
		Form: 'form',
		Success: 'success',
	};

	class FormDrawer extends LayoutComponent
	{
		static open({ parentWidget, onSuccess })
		{
			parentWidget.openWidget('layout', {
				titleParams: {
					type: 'dialog',
					text: Loc.getMessage('MAIL_CONNECTION_REQUEST_FORM_TITLE'),
				},
				backdrop: {
					mediumPositionHeight: getMediumHeight({ height: DRAWER_HEIGHT }),
					onlyMediumPosition: true,
					hideNavigationBar: false,
					forceDismissOnSwipeDown: true,
					swipeAllowed: true,
				},
			})
				.then((widget) => {
					widget.showComponent(new FormDrawer({ widget, onSuccess }));
				})
				.catch(console.error);
		}

		constructor(props)
		{
			super(props);

			this.state = {
				comment: '',
				view: ViewType.Form,
				isSubmitting: false,
			};

			this.inputRef = null;

			this.onSubmit = this.onSubmit.bind(this);
			this.onClose = this.onClose.bind(this);
			this.onCommentChange = this.onCommentChange.bind(this);
			this.onViewHidden = this.onViewHidden.bind(this);
		}

		componentDidMount()
		{
			setTimeout(() => this.inputRef?.focus(), 50);
			this.props.widget?.on?.('onViewHidden', this.onViewHidden);
		}

		onViewHidden()
		{
			if (this.state.view === ViewType.Success && this.props.onSuccess)
			{
				this.props.onSuccess();
			}
		}

		onCommentChange(value)
		{
			this.setState({ comment: value ?? '' });
		}

		async onSubmit()
		{
			if (this.state.comment.length > COMMENT_MAX_LENGTH)
			{
				return;
			}

			this.setState({ isSubmitting: true });
			NotifyManager.showLoadingIndicator();

			try
			{
				const data = await BX.ajax.runAction(AjaxMethod.createConnectionRequest, {
					data: { comment: this.state.comment },
				});

				NotifyManager.hideLoadingIndicator(true);

				if (data?.isRepeat !== true)
				{
					(new AnalyticsEvent({
						tool: 'mail',
						category: 'mail_general_ops',
						event: 'connect_request',
						status: 'success',
					})).send();
				}

				this.shrinkBackdropForSuccess();

				this.setState({
					view: ViewType.Success,
					isSubmitting: false,
				});
			}
			catch (failure)
			{
				NotifyManager.hideLoadingIndicator(false);
				NotifyManager.showErrors(
					failure?.errors || [{
						message: Loc.getMessage('MAIL_CONNECTION_REQUEST_FORM_NETWORK_ERROR'),
					}],
				);
				this.setState({ isSubmitting: false });
			}
		}

		onClose()
		{
			this.props.widget.close();
		}

		shrinkBackdropForSuccess()
		{
			const widget = this.props.widget;
			const height = getMediumHeight({ height: SUCCESS_HEIGHT });

			widget?.setTitle?.({ text: '' });
			widget?.setRightButtons?.([]);
			widget?.setBottomSheetParams?.({
				mediumPositionHeight: height,
				hideNavigationBar: true,
			});
			widget?.setBottomSheetHeight?.(height);
		}

		render()
		{
			return this.state.view === ViewType.Success ? this.renderSuccess() : this.renderForm();
		}

		renderForm()
		{
			return Box(
				{
					testId: 'mail-connection-request-form',
					backgroundColor: Color.bgPrimary,
					withPaddingHorizontal: true,
					safeArea: { bottom: true },
				},
				Text4({
					testId: 'mail-connection-request-form-description',
					text: Loc.getMessage('MAIL_CONNECTION_REQUEST_FORM_DESCRIPTION'),
					color: Color.base1,
				}),
				View(
					{
						style: {
							marginTop: Indent.L.toNumber(),
						},
					},
					TextAreaInput({
						testId: 'mail-connection-request-form-input',
						maxLength: COMMENT_MAX_LENGTH,
						value: this.state.comment,
						placeholder: Loc.getMessage('MAIL_CONNECTION_REQUEST_FORM_PLACEHOLDER'),
						onChange: this.onCommentChange,
						showCharacterCount: false,
						height: 88,
						innerRef: (ref) => {
							this.inputRef = ref;
						},
					}),
					Text7({
						testId: 'mail-connection-request-form-counter',
						text: `${this.state.comment.length} / ${COMMENT_MAX_LENGTH}`,
						color: Color.base3,
						style: {
							alignSelf: 'flex-end',
							marginTop: Indent.XS.toNumber(),
						},
					}),
				),
				View(
					{
						style: {
							marginTop: Indent.L.toNumber(),
						},
					},
					Button({
						testId: 'mail-connection-request-form-submit',
						text: Loc.getMessage('MAIL_CONNECTION_REQUEST_FORM_SUBMIT'),
						size: ButtonSize.XL,
						design: ButtonDesign.FILLED,
						stretched: true,
						loading: this.state.isSubmitting,
						onClick: this.onSubmit,
					}),
				),
			);
		}

		renderSuccess()
		{
			const closeButton = Button({
				testId: 'mail-connection-request-form-close',
				text: Loc.getMessage('MAIL_CONNECTION_REQUEST_FORM_SUCCESS_CLOSE'),
				size: ButtonSize.XL,
				design: ButtonDesign.FILLED,
				stretched: true,
				onClick: this.onClose,
			});

			const successImage = Image({
				testId: 'mail-connection-request-form-success-icon',
				uri: makeLibraryImagePath('connection-request-success.png', 'empty-states', 'mail'),
				style: {
					width: 96,
					height: 96,
				},
			});

			return Box(
				{
					testId: 'mail-connection-request-form-success',
					backgroundColor: Color.bgPrimary,
					safeArea: { bottom: true },
					footer: BoxFooter(
						{ testId: 'mail-connection-request-form-success-footer' },
						closeButton,
					),
				},
				View(
					{
						style: {
							paddingTop: Indent.XL4.toNumber(),
							paddingBottom: Indent.XL4.toNumber(),
						},
					},
					StatusBlock({
						testId: 'mail-connection-request-form-success-block',
						image: successImage,
						title: Loc.getMessage('MAIL_CONNECTION_REQUEST_FORM_SUCCESS_TITLE'),
						description: Loc.getMessage('MAIL_CONNECTION_REQUEST_FORM_SUCCESS_DESC'),
					}),
				),
			);
		}
	}

	module.exports = { FormDrawer };
});
