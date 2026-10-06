/**
 * @module im/messenger/controller/guest-introduction
 */
jn.define('im/messenger/controller/guest-introduction', (require, exports, module) => {
	const { BottomSheet } = require('bottom-sheet');
	const { inAppUrl } = require('in-app-url');
	const { ButtonSize, Button } = require('ui-system/form/buttons/button');
	const { Input } = require('ui-system/form/inputs/input');
	const { BBCodeText } = require('ui-system/typography/bbcodetext');
	const { Color, Indent, Component } = require('tokens');
	const { Loc } = require('im/messenger/loc');
	const { Type } = require('type');
	const { RestMethod, EventType } = require('im/messenger/const');
	const { runAction } = require('im/messenger/lib/rest');
	const { Notification } = require('im/messenger/lib/ui/notification');
	const { MessengerParams } = require('im/messenger/lib/params');
	const { LoggerManager } = require('im/messenger/lib/logger');
	const logger = LoggerManager.getInstance().getLogger('guest-introduction');

	const MEDIUM_POSITION_HEIGHT = 180;

	class GuestIntroduction extends LayoutComponent
	{
		/**
		 * @param {Object} [options]
		 * @param {string} [options.initialName]
		 * @param {Function} [options.onSubmit]
		 * @param {PageManager} [options.parentWidget]
		 * @param {string} [options.dialogId]
		 */
		static open({ initialName = '', onSubmit, parentWidget = PageManager, dialogId = '' } = {})
		{
			void new BottomSheet({
				titleParams: {
					text: Loc.getMessage('IMMOBILE_MESSENGER_GUEST_INTRODUCTION_TITLE'),
					type: 'dialog',
				},
				component: (layout) => new GuestIntroduction({
					initialName,
					onSubmit,
					parentWidget: layout,
					dialogId,
				}),
			})
				.setParentWidget(parentWidget)
				.alwaysOnTop()
				.setBackgroundColor(Color.bgContentPrimary.toHex())
				.setNavigationBarColor(Color.bgContentPrimary.toHex())
				.disableOnlyMediumPosition()
				.setMediumPositionHeight(MEDIUM_POSITION_HEIGHT)
				.enableAdoptHeightByKeyboard()
				.open()
			;
		}

		constructor(props)
		{
			super(props);

			this.state = {
				name: props.initialName || '',
				isSubmitting: false,
			};

			this.props.parentWidget.on(EventType.view.close, () => {
				BX.postComponentEvent(
					EventType.callManager.guestIdentified,
					[{ dialogId: this.props.dialogId }],
					'calls',
				);
				MessengerParams.disableRequestGuestName();
			});
		}

		get canSubmit()
		{
			return Type.isStringFilled(this.state.name.trim()) && !this.state.isSubmitting;
		}

		render()
		{
			return View(
				{
					resizableByKeyboard: true,
					safeArea: { bottom: true },
					style: {
						flex: 1,
						justifyContent: 'space-between',
					},
				},
				View(
					{
						style: {
							paddingHorizontal: Component.paddingLrMore.toNumber(),
							paddingTop: Indent.XL.toNumber(),
						},
					},
					Input({
						testId: 'guest-introduction-input-name',
						placeholder: Loc.getMessage('IMMOBILE_MESSENGER_GUEST_INTRODUCTION_PLACEHOLDER'),
						value: this.state.name,
						focus: true,
						onChange: (value) => {
							this.setState({ name: value });
						},
						onSubmit: () => this.submit(),
					}),
					View(
						{
							style: {
								paddingTop: Indent.XS.toNumber(),
							},
						},
						BBCodeText({
							testId: 'guest-introduction-terms',
							size: 5,
							color: Color.base3,
							value: Loc.getMessage('IMMOBILE_MESSENGER_GUEST_INTRODUCTION_TERMS', {
								'[LINK]': '[URL=#]',
								'[/LINK]': '[/URL]',
							}),
							onLinkClick: () => {
								const url = MessengerParams.getVideoCallsTermsUrl();
								if (!url)
								{
									logger.warn('GuestIntroduction.termsOfUse.click: empty url');

									return;
								}

								inAppUrl.open(url);
							},
						}),
					),
				),
				Button({
					testId: 'guest-introduction-button-continue',
					disabled: !this.canSubmit,
					loading: this.state.isSubmitting,
					stretched: true,
					size: ButtonSize.XL,
					borderRadius: 0,
					text: Loc.getMessage('IMMOBILE_MESSENGER_GUEST_INTRODUCTION_BUTTON_CONTINUE'),
					onClick: () => this.submit(),
				}),
			);
		}

		async submit()
		{
			if (!this.canSubmit)
			{
				return;
			}

			const name = this.state.name.trim();
			this.setState({ isSubmitting: true });

			try
			{
				await runAction(RestMethod.imV2GuestSetName, {
					data: { name },
				});
			}
			catch (error)
			{
				logger.error('GuestIntroduction.submit.catch:', error);
				Notification.showErrorToast({}, this.props.parentWidget);
				this.setState({ isSubmitting: false });

				return;
			}

			// view.close handler will fire guestIdentified + disableRequestGuestName.
			this.props.parentWidget.close();
		}
	}

	module.exports = { GuestIntroduction };
});
