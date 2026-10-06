/**
 * @module im/messenger/controller/attach-chat/flow/src/confirm-widget
 */
jn.define('im/messenger/controller/attach-chat/flow/src/confirm-widget', (require, exports, module) => {
	const { Color, Component, Indent } = require('tokens');
	const { Box } = require('ui-system/layout/box');
	const { StatusBlock } = require('ui-system/blocks/status-block');
	const { Button, ButtonSize, ButtonDesign } = require('ui-system/form/buttons');
	const { LoggerManager } = require('im/messenger/lib/logger');

	const logger = LoggerManager.getInstance().getLogger('attach-chat-confirm-widget');

	const ASSETS_ROOT = `${currentDomain}/bitrix/mobileapp/immobile/extensions/im/messenger/assets`;

	const DESIGN_DESTRUCTIVE = 'destructive';

	const TEST_ID_ENTITY = 'attach-chat-confirm-widget';
	const TEST_ID_CONTAINER = `${TEST_ID_ENTITY}-container`;
	const TEST_ID_CONTENT = `${TEST_ID_ENTITY}-content`;
	const TEST_ID_BUTTON_CONFIRM = `${TEST_ID_ENTITY}-button-confirm`;
	const TEST_ID_BUTTON_CANCEL = `${TEST_ID_ENTITY}-button-cancel`;

	const BACKDROP_HEIGHT_WITH_ICON = 550;
	const BACKDROP_HEIGHT_WITHOUT_ICON = 400;

	/**
	 * @typedef {object} ConfirmWidgetProps
	 * @property {string} title         resolved localized string
	 * @property {string} description   resolved localized string
	 * @property {string} [icon]        PNG basename (no extension) under assets/attach-chat
	 * @property {string} confirmText
	 * @property {string} cancelText
	 * @property {('primary'|'destructive')} [confirmDesign='primary']
	 */

	/**
	 * @class ConfirmWidget
	 */
	class ConfirmWidget extends LayoutComponent
	{
		/**
		 * @param {ConfirmWidgetProps} props
		 * @param {PageManager} [parentWidget]
		 * @return {Promise<boolean>}
		 */
		static open(props, parentWidget = PageManager)
		{
			return new Promise((resolve) => {
				let resolved = false;
				const safeResolve = (result) => {
					if (resolved)
					{
						return;
					}
					resolved = true;
					resolve(result);
				};

				const mediumPositionHeight = props && props.icon
					? BACKDROP_HEIGHT_WITH_ICON
					: BACKDROP_HEIGHT_WITHOUT_ICON;

				parentWidget.openWidget('layout', {
					modal: true,
					titleParams: {
						type: 'dialog',
						text: '',
					},
					backdrop: {
						mediumPositionHeight,
						onlyMediumPosition: true,
						forceDismissOnSwipeDown: true,
						horizontalSwipeAllowed: false,
					},
					onClose: () => {
						safeResolve(false);
					},
				}).then((layoutWidget) => {
					layoutWidget.on('onViewHidden', () => {
						safeResolve(false);
					});

					layoutWidget.showComponent(new ConfirmWidget({
						...props,
						onConfirm: () => {
							safeResolve(true);
							layoutWidget.close();
						},
						onCancel: () => {
							safeResolve(false);
							layoutWidget.close();
						},
					}));
				}).catch((err) => {
					logger.error('ConfirmWidget.open', err);
					safeResolve(false);
				});
			});
		}

		render()
		{
			return Box(
				{
					testId: TEST_ID_CONTAINER,
					backgroundColor: Color.bgContentPrimary,
					safeArea: { bottom: true },
				},
				StatusBlock({
					testId: TEST_ID_CONTENT,
					image: this.#getImage(),
					title: this.props.title,
					description: this.props.description,
					descriptionColor: Color.base1,
				}),
				this.#renderButtons(),
			);
		}

		#getImage()
		{
			const { icon } = this.props;
			if (!icon)
			{
				return null;
			}

			return Image({
				resizeMode: 'contain',
				style: {
					width: 108,
					height: 108,
				},
				uri: `${ASSETS_ROOT}/attach-chat/${icon}.png`,
			});
		}

		#renderButtons()
		{
			const isDestructive = this.props.confirmDesign === DESIGN_DESTRUCTIVE;
			const confirmButtonProps = {
				testId: TEST_ID_BUTTON_CONFIRM,
				size: ButtonSize.L,
				text: this.props.confirmText,
				stretched: true,
				onClick: () => this.props.onConfirm?.(),
				style: {
					marginBottom: Indent.L.toNumber(),
				},
			};

			if (isDestructive)
			{
				confirmButtonProps.design = ButtonDesign.FILLED;
				confirmButtonProps.color = Color.baseWhiteFixed;
				confirmButtonProps.backgroundColor = Color.accentMainAlert;
			}
			else
			{
				confirmButtonProps.design = ButtonDesign.FILLED;
			}

			return View(
				{
					style: {
						paddingHorizontal: Component.paddingLrMore.toNumber(),
						paddingBottom: Indent.XL4.toNumber(),
					},
				},
				Button(confirmButtonProps),
				Button({
					testId: TEST_ID_BUTTON_CANCEL,
					size: ButtonSize.L,
					text: this.props.cancelText,
					design: ButtonDesign.PLAIN_NO_ACCENT,
					stretched: true,
					onClick: () => this.props.onCancel?.(),
				}),
			);
		}
	}

	module.exports = { ConfirmWidget };
});
