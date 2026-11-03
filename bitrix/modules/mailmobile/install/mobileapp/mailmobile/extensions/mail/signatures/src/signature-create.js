/**
 * @module mail/signatures/src/signature-create
 */
jn.define('mail/signatures/src/signature-create', (require, exports, module) => {
	const { PureComponent } = require('layout/pure-component');
	const { Loc } = require('loc');
	const { Color, Component, Indent } = require('tokens');
	const { Text2, Text3, Text4, Text5 } = require('ui-system/typography/text');
	const { Avatar } = require('ui-system/blocks/avatar');
	const { Icon, IconView } = require('ui-system/blocks/icon');
	const { Area } = require('ui-system/layout/area');
	const { AreaList } = require('ui-system/layout/area-list');
	const { Box } = require('ui-system/layout/box');
	const { TextAreaInput, InputDesign, InputMode } = require('ui-system/form/inputs/textarea');
	const { Checkbox } = require('ui-system/form/checkbox');
	const { Button, ButtonDesign, ButtonSize } = require('ui-system/form/buttons/button');
	const { showErrorToast } = require('toast');
	const { SignatureSenderSelector } = require('mail/signatures/src/signature-sender-selector');

	/**
	 * @extends {PureComponent<SignatureCreateProps, SignatureCreateState>}
	 */
	class SignatureCreate extends PureComponent
	{
		/**
		 * @param {SignatureCreateProps} props
		 */
		constructor(props)
		{
			super(props);
			this.state = {
				text: '',
				bindingEnabled: props.initialSenderKey != null,
				senderKeys: props.initialSenderKey ? [props.initialSenderKey] : [],
				saving: false,
			};
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
					testId: 'mail-signature-create',
					backgroundColor: Color.bgPrimary,
					withScroll: true,
					resizableByKeyboard: true,
					safeArea: { bottom: true },
				},
				AreaList(
					{
						testId: 'mail-signature-create-areas',
						withScroll: false,
					},
					Area(
						{
							testId: 'mail-signature-create-text-area',
							isFirst: true,
						},
						TextAreaInput({
							testId: 'mail-signature-create-text',
							value: this.state.text,
							label: Loc.getMessage('MAILMOBILE_SIGNATURES_TEXT_LABEL'),
							placeholder: Loc.getMessage('MAILMOBILE_SIGNATURES_TEXT_PLACEHOLDER'),
							design: InputDesign.GREY,
							mode: InputMode.STROKE,
							height: 144,
							showBBCode: false,
							showCharacterCount: false,
							onChange: (text) => this.setState({ text }),
						}),
						Text5({
							testId: 'mail-signature-create-text-hint',
							text: Loc.getMessage('MAILMOBILE_SIGNATURES_TEXT_HINT'),
							color: Color.base4,
							style: { marginTop: Indent.XS.toNumber() },
						}),
					),
					Area(
						{
							testId: 'mail-signature-create-sender-area',
						},
						this.renderBindingToggle(),
						this.state.bindingEnabled && this.renderSenderSelection(),
					),
				),
			);
		}

		canSave()
		{
			return !this.state.saving
				&& this.state.text.trim() !== ''
				&& (!this.state.bindingEnabled || this.state.senderKeys.length > 0)
			;
		}

		refreshSaveButton()
		{
			const enabled = this.canSave();
			this.props.layoutWidget.setRightButtons([{
				name: Loc.getMessage('MAILMOBILE_SIGNATURES_SAVE'),
				testId: 'mail-signature-create-save-button',
				type: 'text',
				color: enabled ? Color.accentMainPrimary.toHex() : Color.base6.toHex(),
				callback: () => {
					if (enabled)
					{
						this.save();
					}
				},
			}]);
		}

		renderBindingToggle()
		{
			return View(
				{
					testId: 'mail-signature-create-binding-row',
					style: { flexDirection: 'row', alignItems: 'flex-start' },
					onClick: () => this.setState(({ bindingEnabled }) => ({ bindingEnabled: !bindingEnabled })),
				},
				new Checkbox({
					testId: 'mail-signature-create-binding-checkbox',
					checked: this.state.bindingEnabled,
					useState: false,
				}),
				View(
					{ style: { flex: 1, marginLeft: Indent.L.toNumber() } },
					Text3({
						testId: 'mail-signature-create-binding-title',
						text: Loc.getMessage('MAILMOBILE_SIGNATURES_BIND_TO_SENDERS'),
					}),
					Text5({
						testId: 'mail-signature-create-binding-description',
						text: Loc.getMessage('MAILMOBILE_SIGNATURES_BIND_TO_SENDERS_DESCRIPTION'),
						color: Color.base4,
						style: { marginTop: Indent.XS.toNumber() },
					}),
				),
			);
		}

		renderSenderSelection()
		{
			const selected = this.props.senders.filter(({ key }) => this.state.senderKeys.includes(key));

			return View(
				{
					testId: 'mail-signature-create-senders',
					style: { marginTop: Indent.XL.toNumber() },
				},
				Text5({
					testId: 'mail-signature-create-senders-title',
					text: Loc.getMessage('MAILMOBILE_SIGNATURES_SENDERS_TITLE'),
					color: Color.base4,
				}),
				this.renderChooseSenderRow(),
				selected.length > 0 && View({
					testId: 'mail-signature-create-senders-separator',
					style: {
						height: Component.separatorStroke.toNumber(),
						marginLeft: 48 + Indent.XL.toNumber(),
						backgroundColor: Color.bgSeparatorPrimary.toHex(),
					},
				}),
				...selected.map((sender, index) => this.renderSelectedSender(sender, index)),
			);
		}

		renderChooseSenderRow()
		{
			return View(
				{
					testId: 'mail-signature-create-sender-button',
					style: {
						flexDirection: 'row',
						alignItems: 'center',
						paddingVertical: Indent.XL.toNumber(),
					},
					onClick: this.openSenderSelector,
				},
				View(
					{
						testId: 'mail-signature-create-sender-icon',
						style: {
							width: 48,
							height: 48,
							borderRadius: 24,
							alignItems: 'center',
							justifyContent: 'center',
							backgroundColor: Color.accentMainPrimary.toHex(),
						},
					},
					IconView({
						testId: 'mail-signature-create-sender-icon-image',
						icon: Icon.MAIL_PLUS,
						color: Color.baseWhiteFixed,
						size: 28,
					}),
				),
				Text2({
					testId: 'mail-signature-create-sender-button-text',
					text: Loc.getMessage('MAILMOBILE_SIGNATURES_CHOOSE_SENDERS'),
					color: Color.accentMainPrimary,
					style: { marginLeft: Indent.XL.toNumber() },
				}),
			);
		}

		renderSelectedSender(sender, index)
		{
			const name = sender.name || sender.email;
			const removeSender = () => this.removeSender(sender.key);

			return View(
				{
					testId: `mail-signature-create-selected-sender-${index}`,
					style: {
						flexDirection: 'row',
						alignItems: 'center',
						paddingVertical: Indent.XL.toNumber(),
					},
				},
				Avatar({
					testId: `mail-signature-create-selected-sender-avatar-${index}`,
					id: sender.key,
					name,
					size: 48,
					withRedux: false,
				}),
				View(
					{
						style: {
							flex: 1,
							marginLeft: Indent.XL.toNumber(),
						},
					},
					Text3({
						testId: `mail-signature-create-selected-sender-name-${index}`,
						text: name,
						accent: true,
						numberOfLines: 1,
						ellipsize: 'end',
					}),
					Text4({
						testId: `mail-signature-create-selected-sender-email-${index}`,
						text: sender.email,
						color: Color.base4,
						numberOfLines: 1,
						ellipsize: 'end',
					}),
				),
				Button({
					testId: `mail-signature-create-selected-sender-remove-${index}`,
					leftIcon: Icon.CROSS,
					leftIconColor: Color.base4,
					design: ButtonDesign.PLAIN_NO_ACCENT,
					size: ButtonSize.S,
					onClick: removeSender,
				}),
			);
		}

		removeSender(senderKey)
		{
			this.setState(({ senderKeys }) => ({
				senderKeys: senderKeys.filter((key) => key !== senderKey),
			}));
		}

		openSenderSelector = () => {
			PageManager.openWidget('layout', {
				modal: true,
				backdrop: { mediumPositionPercent: 90, horizontalSwipeAllowed: false },
				titleParams: { text: Loc.getMessage('MAILMOBILE_SIGNATURES_CHOOSE_SENDERS_TITLE'), type: 'dialog' },
				onReady: (layoutWidget) => layoutWidget.showComponent(new SignatureSenderSelector({
					layoutWidget,
					senders: this.props.senders,
					selectedKeys: this.state.senderKeys,
					onDone: (senderKeys) => this.setState({ senderKeys }),
				})),
			});
		};

		save = async () => {
			if (!this.canSave())
			{
				return;
			}

			this.setState({ saving: true });
			try
			{
				const item = await this.props.api.addOwner({
					text: this.state.text,
					senderKeys: this.state.bindingEnabled ? this.state.senderKeys : [],
				});
				this.props.onCreated?.(item);
				this.props.layoutWidget.close();
			}
			catch (failure)
			{
				this.setState({ saving: false });
				showErrorToast(
					{ message: Loc.getMessage('MAILMOBILE_SIGNATURES_SAVE_ERROR') },
					this.props.layoutWidget,
				);
			}
		};
	}

	SignatureCreate.defaultProps = {
		senders: [],
		initialSenderKey: null,
	};

	module.exports = { SignatureCreate };
});
