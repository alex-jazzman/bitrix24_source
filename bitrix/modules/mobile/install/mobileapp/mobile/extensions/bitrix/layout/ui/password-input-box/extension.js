/**
 * @module layout/ui/password-input-box
 */
jn.define('layout/ui/password-input-box', (require, exports, module) => {
	const { Loc } = require('loc');
	const { BottomSheet } = require('bottom-sheet');
	const { Color, Component, Indent } = require('tokens');
	const { Box } = require('ui-system/layout/box');
	const { BoxFooter } = require('ui-system/layout/dialog-footer');
	const { StringInput } = require('ui-system/form/inputs/string');
	const { InputDesign, InputMode, InputSize } = require('ui-system/form/inputs/input');
	const { Button, ButtonDesign, ButtonSize } = require('ui-system/form/buttons/button');
	const { Icon } = require('ui-system/blocks/icon');

	const INPUT_HEIGHT = 42;
	const COMPONENT_CODE = 'password-input-box';
	const PasswordInputBoxEvents = {
		CONFIRM: 'PasswordInputBox::confirm',
		CLOSE: 'PasswordInputBox::close',
		CHANGE: 'PasswordInputBox::change',
		CONFIRM_RESULT: 'PasswordInputBox::confirmResult',
	};

	/**
	 * @class PasswordInputBox
	 */
	class PasswordInputBox extends LayoutComponent
	{
		#isConfirmed = false;

		/**
		 * @param {PasswordInputBoxProps} props
		 */
		constructor(props = {})
		{
			super(props);

			this.layoutWidget = null;
			if (props.layoutWidget)
			{
				this.#setLayoutWidget(props.layoutWidget);
			}

			this.state = {
				password: props.password ?? '',
				showPassword: false,
				pending: Boolean(props.pending),
			};
		}

		#getTestId(suffix)
		{
			const prefix = this.props.testId ?? 'password-input-box';

			return `${prefix}-${suffix}`;
		}

		get title()
		{
			return this.props.title ?? Loc.getMessage('LAYOUT_UI_PASSWORD_INPUT_BOX_TITLE');
		}

		get placeholder()
		{
			return this.props.placeholder ?? Loc.getMessage('LAYOUT_UI_PASSWORD_INPUT_BOX_PLACEHOLDER');
		}

		get confirmButtonText()
		{
			return this.props.confirmButtonText ?? Loc.getMessage('LAYOUT_UI_PASSWORD_INPUT_BOX_CONFIRM_BUTTON');
		}

		get startingLayoutHeight()
		{
			const TITLE_HEIGHT = 44;
			const AREA_PADDING = Component.areaPaddingTFirst.toNumber();
			const BUTTON_HEIGHT = 42 + Indent.XL2.toNumber() * 2;

			return TITLE_HEIGHT + AREA_PADDING + INPUT_HEIGHT + BUTTON_HEIGHT;
		}

		#setLayoutWidget(layoutWidget)
		{
			this.layoutWidget = layoutWidget;
			this.layoutWidget?.setListener?.((eventName) => {
				if (eventName === 'onViewHidden' || eventName === 'onViewRemoved')
				{
					if (!this.#isConfirmed)
					{
						this.props.onClose?.();
					}
				}
			});
		}

		#getWidgetParams(widgetParams = {})
		{
			const customWidgetParams = widgetParams ?? {};
			const customBackdropParams = customWidgetParams.backdrop ?? {};

			return {
				modal: true,
				backgroundColor: Color.bgSecondary.toHex(),
				titleParams: {
					text: this.title,
					type: 'dialog',
				},
				...customWidgetParams,
				backdrop: {
					showOnTop: false,
					onlyMediumPosition: false,
					mediumPositionHeight: this.startingLayoutHeight,
					navigationBarColor: Color.bgSecondary.toHex(),
					hideNavigationBar: false,
					swipeAllowed: true,
					swipeContentAllowed: true,
					horizontalSwipeAllowed: false,
					shouldResizeContent: true,
					forceDismissOnSwipeDown: true,
					adoptHeightByKeyboard: true,
					bounceEnable: true,
					...customBackdropParams,
				},
			};
		}

		/**
		 * @public
		 * @param {PasswordInputBoxProps} data
		 * @param {Object} parentWidget
		 * @return {Promise<unknown>}
		 */
		static async open(data = {}, parentWidget)
		{
			const component = new PasswordInputBox(data);

			return component.show(data.widgetParams, parentWidget);
		}

		/**
		 * @public
		 */
		async show(widgetParams = this.props.widgetParams, parentWidget)
		{
			if (!parentWidget)
			{
				return PasswordInputBox.#openComponent({
					...this.props,
					widgetParams,
				});
			}

			const bottomSheet = new BottomSheet({ component: this });

			return bottomSheet
				.setParentWidget(parentWidget)
				.setBackgroundColor(Color.bgSecondary)
				.setNavigationBarColor(Color.bgSecondary)
				.hideNavigationBar()
				.disableShowOnTop()
				.disableOnlyMediumPosition()
				.setMediumPositionHeight(this.startingLayoutHeight)
				.enableBounce()
				.enableSwipe()
				.disableHorizontalSwipe()
				.enableResizeContent()
				.enableAdoptHeightByKeyboard()
				.setTitleParams({
					text: this.title,
					type: 'dialog',
				})
				.open()
				.then((layoutWidget) => {
					this.#setLayoutWidget(layoutWidget);
				})
				.catch(console.error)
			;
		}

		static #openComponent(data)
		{
			const component = new PasswordInputBox(data);
			const requestId = PasswordInputBox.#createRequestId();

			return new Promise((resolve, reject) => {
				let isClosed = false;
				let isConfirming = false;

				const confirmHandler = ({ requestId: eventRequestId, password }) => {
					if (eventRequestId !== requestId)
					{
						return;
					}

					if (isConfirming)
					{
						return;
					}

					isConfirming = true;
					Promise.resolve(data.onConfirm?.(password, null))
						.then((result) => {
							if (isClosed)
							{
								return;
							}

							cleanup();
							BX.postComponentEvent(
								`${PasswordInputBoxEvents.CONFIRM_RESULT}:${requestId}`,
								[{ success: true }],
								COMPONENT_CODE,
							);
							resolve(result);
						})
						.catch((error) => {
							if (isClosed)
							{
								return;
							}

							isConfirming = false;
							BX.postComponentEvent(
								`${PasswordInputBoxEvents.CONFIRM_RESULT}:${requestId}`,
								[{ success: false }],
								COMPONENT_CODE,
							);
							console.error(error);
						})
					;
				};

				const closeHandler = ({ requestId: eventRequestId }) => {
					if (eventRequestId !== requestId)
					{
						return;
					}

					isClosed = true;
					cleanup();
					data.onClose?.();
					resolve(null);
				};

				const changeHandler = ({ requestId: eventRequestId, password }) => {
					if (eventRequestId !== requestId)
					{
						return;
					}

					data.onChange?.(password);
				};

				const cleanup = () => {
					BX.removeCustomEvent(PasswordInputBoxEvents.CONFIRM, confirmHandler);
					BX.removeCustomEvent(PasswordInputBoxEvents.CLOSE, closeHandler);
					BX.removeCustomEvent(PasswordInputBoxEvents.CHANGE, changeHandler);
				};

				BX.addCustomEvent(PasswordInputBoxEvents.CONFIRM, confirmHandler);
				BX.addCustomEvent(PasswordInputBoxEvents.CLOSE, closeHandler);
				BX.addCustomEvent(PasswordInputBoxEvents.CHANGE, changeHandler);

				try
				{
					PageManager.openComponent('JSStackComponent', {
						componentCode: COMPONENT_CODE,
						canOpenInDefault: true,
						// eslint-disable-next-line no-undef
						scriptPath: availableComponents[COMPONENT_CODE].publicUrl,
						rootWidget: {
							name: 'layout',
							settings: {
								objectName: 'layout',
								...component.#getWidgetParams(data.widgetParams),
							},
						},
						params: {
							...PasswordInputBox.#prepareComponentParams(data),
							requestId,
						},
					});
				}
				catch (error)
				{
					cleanup();
					reject(error);
				}
			});
		}

		static #createRequestId()
		{
			return `${Date.now()}-${Math.random()}`;
		}

		static #prepareComponentParams(data)
		{
			return {
				testId: data.testId,
				title: data.title,
				placeholder: data.placeholder,
				confirmButtonText: data.confirmButtonText,
				password: data.password,
				pending: data.pending,
			};
		}

		render()
		{
			return Box(
				{
					testId: this.#getTestId('box'),
					resizableByKeyboard: true,
					safeArea: { bottom: true },
					footer: this.renderFooter(),
				},
				View(
					{
						style: {
							paddingHorizontal: Component.paddingLr.toNumber(),
							paddingTop: Component.areaPaddingTFirst.toNumber(),
						},
					},
					this.renderPasswordField(),
				),
			);
		}

		renderPasswordField()
		{
			return StringInput({
				testId: this.#getTestId('password-field'),
				size: InputSize.L,
				design: InputDesign.GREY,
				mode: InputMode.STROKE,
				showTitle: false,
				showRequired: false,
				value: this.state.password,
				placeholder: this.placeholder,
				isPassword: !this.state.showPassword,
				rightContent: this.state.showPassword ? Icon.OBSERVER : Icon.CROSSED_EYE,
				onChange: this.#onChangePassword,
				onClickRightContent: this.#togglePasswordVisibility,
			});
		}

		renderFooter()
		{
			return BoxFooter(
				{
					testId: this.#getTestId('box-footer'),
					safeArea: Application.getPlatform() !== 'android',
					keyboardButton: {
						text: this.confirmButtonText,
						loading: this.state.pending,
						onClick: this.#confirm,
						testId: this.#getTestId('confirm-keyboard-button'),
						disabled: this.#isConfirmButtonDisabled(),
					},
				},
				Button({
					testId: this.#getTestId('confirm-button'),
					design: ButtonDesign.FILLED,
					size: ButtonSize.L,
					text: this.confirmButtonText,
					loading: this.state.pending,
					stretched: true,
					onClick: this.#confirm,
					disabled: this.#isConfirmButtonDisabled(),
				}),
			);
		}

		#isConfirmButtonDisabled()
		{
			return this.state.pending || this.state.password.length === 0;
		}

		#onChangePassword = (password) => {
			this.setState({ password });
			this.props.onChange?.(password);
		};

		#togglePasswordVisibility = () => {
			this.setState({
				showPassword: !this.state.showPassword,
			});
		};

		#confirm = () => {
			if (this.#isConfirmButtonDisabled())
			{
				return;
			}

			const result = this.props.onConfirm?.(this.state.password, this.layoutWidget);
			if (result?.then)
			{
				this.setState({ pending: true });
				result
					.then(() => {
						this.#isConfirmed = true;
						this.layoutWidget?.close();
					})
					.catch((error) => {
						this.setState({ pending: false });
						console.error(error);
					})
				;

				return;
			}

			this.#isConfirmed = true;
			this.layoutWidget?.close();
		};
	}

	module.exports = {
		PasswordInputBox,
		PasswordInputBoxEvents,
	};
});
