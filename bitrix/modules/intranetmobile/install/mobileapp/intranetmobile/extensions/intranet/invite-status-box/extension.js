/**
 * @module intranet/invite-status-box
 */
jn.define('intranet/invite-status-box', (require, exports, module) => {
	const { StatusBlock } = require('ui-system/blocks/status-block');
	const { BottomSheet } = require('bottom-sheet');
	const { Color } = require('tokens');
	const { makeLibraryImagePath } = require('asset-manager');
	const { Box, BoxFooter } = require('ui-system/layout/box');
	const {
		Button,
		ButtonSize,
		ButtonDesign,
	} = require('ui-system/form/buttons/button');

	const DEFAULT_HEIGHT = 425;

	/**
	 * @class InviteStatusBox
	 */
	class InviteStatusBox extends LayoutComponent
	{
		constructor(props) {
			super(props);

			this.setParentWidget();
		}

		/**
		 * @public
		 * @param widget
		 */
		setParentWidget(widget = null)
		{
			this.parentWidget = widget;
		}

		get testId()
		{
			return this.props.testId ?? '';
		}

		get imageName()
		{
			return this.props.imageName ?? null;
		}

		get title()
		{
			return this.props.title ?? null;
		}

		get description()
		{
			return this.props.description ?? null;
		}

		get buttonText()
		{
			return this.props.buttonText ?? null;
		}

		get buttonDesign()
		{
			return this.props.buttonDesign ?? ButtonDesign.OUTLINE_ACCENT_1;
		}

		get height()
		{
			return this.props.height ?? DEFAULT_HEIGHT;
		}

		get shouldCloseOnButtonClick()
		{
			return this.props.shouldCloseOnButtonClick ?? true;
		}

		get statusBlockButtons()
		{
			return this.props.statusBlockButtons ?? [];
		}

		get statusBlockStyle()
		{
			return this.props.statusBlockStyle ?? {};
		}

		#getTestId = (suffix) => {
			const prefix = this.testId;

			return suffix ? `${prefix}-${suffix}` : prefix;
		};

		onButtonClick = () => {
			const { onButtonClick, onClose } = this.props;
			onButtonClick?.(this.parentWidget);
			if (this.shouldCloseOnButtonClick)
			{
				onClose?.(this.parentWidget);
				this.parentWidget.close();
			}
		};

		/**
		 * @param {Object} data
		 * @param {string} data.backdropTitle
		 * @param {Object} [data.parentWidget]
		 * @param {string} [data.testId]
		 * @param {string} [data.imageName]
		 * @param {string} [data.imageUri]
		 * @param {string} [data.title]
		 * @param {string} [data.description]
		 * @param {string} [data.buttonText]
		 * @param {ButtonDesign} [data.buttonDesign]
		 * @param {Function} [data.onButtonClick]
		 * @param {Array<Button>} [data.statusBlockButtons]
		 * @param {Object} [data.statusBlockStyle]
		 * @param {number} [data.height]
		 * @param {Function} [data.onClose]
		 * @param {boolean} [data.shouldCloseOnButtonClick = true]
		 */
		static async open(data)
		{
			const { backdropTitle, height, onClose } = data;
			const parentWidget = data.parentWidget ?? PageManager;
			const inviteStatusBox = new InviteStatusBox(data);

			return new Promise((resolve) => {
				new BottomSheet({
					titleParams: {
						text: backdropTitle,
						type: 'dialog',
						useLargeTitleMode: true,
					},
					component: (widget) => {
						inviteStatusBox.setParentWidget(widget);
						widget.preventBottomSheetDismiss(true);
						widget.on('preventDismiss', () => {
							onClose?.(widget);
							widget.close();
						});

						return inviteStatusBox;
					},
				}).setParentWidget(parentWidget)
					.showOnTop()
					.setBackgroundColor(Color.bgSecondary.toHex())
					.setNavigationBarColor(Color.bgSecondary.toHex())
					.enableOnlyMediumPosition()
					.setMediumPositionHeight(height ?? DEFAULT_HEIGHT)
					.open()
					.then(() => {
						resolve(inviteStatusBox);
					})
					.catch(console.error);
			});
		}

		render()
		{
			return Box(
				{
					style: {
						height: this.height,
						maxHeight: this.height,
					},
					footer: this.#renderButton(),
					safeArea: {
						bottom: false,
					},
				},
				StatusBlock({
					emptyScreen: false,
					testId: this.#getTestId('status-block'),
					title: this.title,
					image: this.renderImage,
					description: this.description,
					buttons: this.statusBlockButtons,
					style: this.statusBlockStyle,
				}),
			);
		}

		#renderButton()
		{
			return BoxFooter(
				{
					safeArea: true,
					testId: this.#getTestId('box-footer'),
				},
				Button({
					testId: this.#getTestId('button'),
					size: ButtonSize.L,
					text: this.buttonText,
					design: this.buttonDesign,
					stretched: true,
					onClick: this.onButtonClick,
				}),
			);
		}

		get renderImage()
		{
			const uri = this.props.imageUri
				?? makeLibraryImagePath(this.props.imageName, 'invite-status-box', 'intranet');
			if (!uri)
			{
				return null;
			}

			return Image({
				resizeMode: 'contain',
				style: {
					width: 120,
					height: 120,
				},
				svg: {
					uri,
				},
			});
		}
	}

	module.exports = { InviteStatusBox };
});
