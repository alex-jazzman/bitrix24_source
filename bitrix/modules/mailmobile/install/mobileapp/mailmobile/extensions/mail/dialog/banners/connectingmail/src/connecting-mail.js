/**
 * @module mail/dialog/banners/connectingmail/src/connecting-mail
 */
jn.define('mail/dialog/banners/connectingmail/src/connecting-mail', (require, exports, module) => {
	const { Loc } = require('loc');
	const { Color, Indent } = require('tokens');
	const {
		ButtonSize,
		ButtonDesign,
		Button,
	} = require('ui-system/form/buttons/button');
	const { IconView, Icon } = require('ui-system/blocks/icon');
	const { H4 } = require('ui-system/typography/heading');
	const { Text4 } = require('ui-system/typography/text');
	const { makeLibraryImagePath } = require('ui-system/blocks/status-block');
	const { NotifyManager } = require('notify-manager');
	const { Connector } = require('mail/mailbox/connector');
	const { AjaxMethod } = require('mail/const');
	const { FormDrawer } = require('mail/dialog/banners/connectingmail/src/form-drawer');
	const { StatusDrawer } = require('mail/dialog/banners/connectingmail/src/status-drawer');

	const ERROR_CODE_QUANTITY_LIMIT_EXCEEDED = 'LIMIT_ERROR';
	const ERROR_CODE_NO_RIGHTS_TO_CONNECT = 'NO_RIGHTS_TO_CONNECT';

	class ConnectingMail extends LayoutComponent
	{
		static async preFetch()
		{
			try
			{
				const initialStatus = await BX.ajax.runAction(
					AjaxMethod.getOwnConnectionRequestStatus,
					{ data: {} },
				);

				return { initialStatus };
			}
			catch
			{
				return { initialStatus: null };
			}
		}

		constructor(props)
		{
			super(props);

			const {
				layoutWidget,
				parentWidget,
				successCallback = () => {},
				needsToCloseLayout,
				initialStatus,
			} = props;

			this.needsToCloseLayout = needsToCloseLayout;
			this.parentWidget = parentWidget;
			this.layoutWidget = layoutWidget;
			this.successCallback = successCallback;

			this.state = {
				hasActiveRequest: initialStatus?.data?.hasActiveRequest ?? false,
				canSendRequest: initialStatus?.data?.canSendRequest ?? false,
			};
		}

		closeLayout(callback)
		{
			if (this.needsToCloseLayout)
			{
				this.layoutWidget.close(callback);
			}
			else
			{
				callback();
			}
		}

		async onConnectMail()
		{
			try
			{
				await BX.ajax.runAction(
					AjaxMethod.checkConnectMailbox,
					{ data: {} },
				);
			}
			catch (failure)
			{
				const code = failure?.errors?.[0]?.code;

				if (code === ERROR_CODE_NO_RIGHTS_TO_CONNECT)
				{
					this.showForbidden();

					return;
				}

				if (code === ERROR_CODE_QUANTITY_LIMIT_EXCEEDED)
				{
					try
					{
						const { PlanRestriction } = await requireLazy('layout/ui/plan-restriction');
						PlanRestriction.open(
							{ title: BX.message('MAIL_CONNECTING_MAIL_BANNER_QUANTITY_LIMIT_EXCEEDED_TITLE') },
							this.layoutWidget || this.parentWidget,
						);
					}
					catch (e)
					{
						console.error(e);
					}

					return;
				}

				NotifyManager.showErrors(failure?.errors || [{ message: '' }]);

				return;
			}

			this.closeLayout(() => {
				(new Connector({
					connectFrom: 'crm',
					parentWidget: this.parentWidget,
					successCallback: this.successCallback,
				})).show();
			});
		}

		showForbidden()
		{
			jn.import('mail:dialog/banners/connectionforbidden')
				.then(() => {
					const { ConnectionForbidden } = require('mail/dialog/banners/connectionforbidden');

					this.layoutWidget.openWidget('layout', {
						backdrop: {
							mediumPositionPercent: 85,
							hideNavigationBar: true,
							forceDismissOnSwipeDown: true,
							shouldResizeContent: true,
							swipeAllowed: true,
						},
					})
						.then((widget) => {
							widget.showComponent(new ConnectionForbidden({
								layoutWidget: widget,
								parentWidget: this.layoutWidget,
								needsToCloseLayout: true,
								successCallback: this.successCallback,
							}));
						})
						.catch(console.error);
				})
				.catch(console.error);
		}

		onRequestHelp()
		{
			if (this.state.hasActiveRequest === true)
			{
				StatusDrawer.open({
					parentWidget: this.layoutWidget,
				});
			}
			else
			{
				FormDrawer.open({
					parentWidget: this.layoutWidget,
					onSuccess: () => this.setState({ hasActiveRequest: true }),
				});
			}
		}

		renderBenefit(icon, messageKey)
		{
			return View(
				{
					style: {
						flexDirection: 'row',
						alignItems: 'flex-start',
						marginTop: Indent.L.toNumber(),
					},
				},
				View(
					{
						style: {
							marginTop: 2,
							marginRight: Indent.L.toNumber(),
						},
					},
					IconView({
						icon,
						size: 22,
						color: Color.accentMainPrimary,
					}),
				),
				View(
					{
						style: {
							flex: 1,
						},
					},
					Text4({
						text: Loc.getMessage(messageKey),
						color: Color.base1,
					}),
				),
			);
		}

		render()
		{
			return View(
				{
					style: {
						flex: 1,
						flexDirection: 'column',
						alignItems: 'center',
						justifyContent: 'center',
						paddingHorizontal: Indent.XL3.toNumber(),
						backgroundColor: Color.bgPrimary.toHex(),
					},
					safeArea: { bottom: true },
				},
				Image({
					uri: makeLibraryImagePath('mailbox-connection-full.png', 'empty-states', 'mail'),
					style: {
						width: 142,
						height: 142,
					},
				}),
				H4({
					text: Loc.getMessage('MAIL_CONNECTING_MAIL_BANNER_TITLE_PROMO'),
					color: Color.base1,
					style: {
						marginTop: Indent.XL2.toNumber(),
						textAlign: 'center',
					},
				}),
				View(
					{
						style: {
							alignSelf: 'stretch',
							marginTop: Indent.XL2.toNumber(),
						},
					},
					this.renderBenefit(Icon.MOBILE, 'MAIL_CONNECTING_MAIL_BANNER_BENEFIT_MOBILE'),
					this.renderBenefit(Icon.FILTER_FUNNEL, 'MAIL_CONNECTING_MAIL_BANNER_BENEFIT_CRM'),
					this.renderBenefit(Icon.CHATS, 'MAIL_CONNECTING_MAIL_BANNER_BENEFIT_CHATS'),
				),
				View(
					{
						style: {
							alignSelf: 'stretch',
							marginTop: Indent.XL3.toNumber(),
						},
					},
					Button({
						testId: 'mailbox-connection-button-confirm',
						text: Loc.getMessage('MAIL_CONNECTING_MAIL_BANNER_BUTTON_CONNECT'),
						size: ButtonSize.XL,
						design: ButtonDesign.FILLED,
						stretched: true,
						onClick: this.onConnectMail.bind(this),
					}),
				),
				this.state.canSendRequest && View(
					{
						style: {
							marginTop: Indent.L.toNumber(),
						},
					},
					Button({
						testId: 'mailbox-connection-button-request-help',
						text: Loc.getMessage('MAIL_CONNECTING_MAIL_BANNER_BUTTON_REQUEST'),
						size: ButtonSize.L,
						design: ButtonDesign.PLAIN,
						onClick: this.onRequestHelp.bind(this),
					}),
				),
			);
		}
	}

	module.exports = { ConnectingMail };
});
