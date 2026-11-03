/**
 * @module mail/calendar-slots
 */
jn.define('mail/calendar-slots', (require, exports, module) => {
	const { BottomSheet } = require('bottom-sheet');
	const { PureComponent } = require('layout/pure-component');
	const { LoadingScreenComponent } = require('layout/ui/loading-screen');
	const { Loc } = require('loc');
	const { CrmOwnerType, normalizeIsCrmMessage, isCrmDealEntity } = require('mail/const');
	const { NotifyManager } = require('notify-manager');
	const { Color, Indent } = require('tokens');
	const { Type } = require('type');
	const { Button, ButtonDesign, ButtonSize } = require('ui-system/form/buttons/button');
	const { Box, BoxFooter } = require('ui-system/layout/box');
	const { Text4 } = require('ui-system/typography/text');

	const { SharingEmptyState } = require('calendar/layout/sharing-empty-state');
	const { SharingSettings } = require('calendar/layout/sharing-settings');
	const { SharingSwitcher } = require('calendar/layout/sharing-switcher');
	const { ModelSharingStatus } = require('calendar/model/sharing');
	const { Sharing, SharingContext } = require('calendar/sharing');

	/**
	 * @class MailCalendarSlots
	 * @extends {PureComponent<MailCalendarSlotsProps, MailCalendarSlotsState>}
	 */
	class MailCalendarSlots extends PureComponent
	{
		static open({ parentWidget = PageManager, onInsertLink, ownerEntity = {}, isCrmMessage = false } = {})
		{
			const component = (layoutWidget) => new MailCalendarSlots({
				layoutWidget,
				onInsertLink,
				ownerEntity,
				isCrmMessage,
			});

			void new BottomSheet({
				title: Loc.getMessage('MAIL_CALENDAR_SLOTS_TITLE'),
				component,
			})
				.setParentWidget(parentWidget)
				.setBackgroundColor(Color.bgPrimary.toHex())
				.setNavigationBarColor(Color.bgPrimary.toHex())
				.setMediumPositionPercent(70)
				.disableContentSwipe()
				.open()
				.catch(console.error)
			;
		}

		/**
		 * @param {MailCalendarSlotsProps} props
		 */
		constructor(props)
		{
			super(props);

			this.layoutWidget = props.layoutWidget || PageManager;
			this.ownerEntity = props.ownerEntity || {};
			this.isCrmMessage = normalizeIsCrmMessage(props.isCrmMessage);
			this.sharing = new Sharing({
				type: this.isCrmDeal() ? SharingContext.CRM : SharingContext.CALENDAR,
			});

			this.state = {
				creatingLink: false,
				initFailed: false,
				loading: true,
				model: {
					...this.sharing.getModel().getFieldsValues(),
				},
			};
		}

		componentDidMount()
		{
			this.layoutWidget.setListener((eventName) => {
				if (eventName === 'onViewHidden')
				{
					this.sharing.getModel().clearMembers();
				}
			});

			void this.initSharing();
		}

		async initSharing()
		{
			try
			{
				const response = await (
					this.isCrmDeal()
						? this.sharing.initCrm(CrmOwnerType.DealId, this.getCrmEntityId())
						: this.sharing.init()
				);
				if (response.errors && response.errors.length > 0)
				{
					NotifyManager.showErrors(response.errors);

					this.setState({
						initFailed: true,
						loading: false,
					});

					return;
				}

				this.syncModelState({
					loading: false,
					initFailed: false,
				});
			}
			catch (error)
			{
				console.error(error);
				NotifyManager.showError(Loc.getMessage('MAIL_CALENDAR_SLOTS_INIT_ERROR'));

				this.setState({
					initFailed: true,
					loading: false,
				});
			}
		}

		render()
		{
			return Box(
				{
					testId: 'mail-calendar-slots',
					backgroundColor: Color.bgPrimary,
					withScroll: !this.isLoading(),
					footer: this.shouldShowFooter() ? this.renderFooter() : null,
				},
				this.isLoading() && this.renderLoading(),
				!this.isLoading() && this.renderContent(),
			);
		}

		isLoading()
		{
			return this.state.loading;
		}

		renderLoading()
		{
			return new LoadingScreenComponent({
				testId: 'mail-calendar-slots-loading',
			});
		}

		renderContent()
		{
			if (this.state.initFailed)
			{
				return this.renderInitError();
			}

			return View(
				{
					testId: 'mail-calendar-slots-content',
					style: styles.content,
				},
				this.renderSwitcher(),
				this.renderBody(),
			);
		}

		renderInitError()
		{
			return View(
				{
					testId: 'mail-calendar-slots-init-error',
					style: styles.initError,
				},
				Text4({
					testId: 'mail-calendar-slots-init-error-text',
					text: Loc.getMessage('MAIL_CALENDAR_SLOTS_INIT_ERROR'),
					color: Color.base3,
					style: {
						textAlign: 'center',
					},
				}),
			);
		}

		renderSwitcher()
		{
			return View(
				{
					style: styles.switcher,
				},
				new SharingSwitcher({
					isCalendarContext: !this.isCrmDeal(),
					isOn: this.isSharingEnabled(),
					model: this.sharing.getModel(),
					onChange: (status) => this.handleSwitcher(status),
				}),
			);
		}

		renderBody()
		{
			if (!this.isSharingEnabled())
			{
				return SharingEmptyState();
			}

			return new SharingSettings({
				model: this.sharing.getModel(),
				layoutWidget: this.layoutWidget,
			});
		}

		shouldShowFooter()
		{
			return !this.isLoading() && !this.state.initFailed;
		}

		renderFooter()
		{
			return BoxFooter(
				{
					testId: 'mail-calendar-slots-footer',
					style: styles.footer,
				},
				Button({
					testId: 'mail-calendar-slots-add-link-button',
					text: Loc.getMessage('MAIL_CALENDAR_SLOTS_ADD_LINK'),
					design: ButtonDesign.FILLED,
					size: ButtonSize.XL,
					stretched: true,
					disabled: !this.isSharingEnabled(),
					loading: this.state.creatingLink,
					onClick: () => this.handleInsertButtonClick(),
				}),
			);
		}

		async handleSwitcher(status)
		{
			NotifyManager.showLoadingIndicator();

			try
			{
				const response = await (
					status === ModelSharingStatus.ENABLE
						? this.sharing.on()
						: this.sharing.off()
				);

				if (response.errors && response.errors.length > 0)
				{
					NotifyManager.showErrors(response.errors);
					this.syncModelState();

					return;
				}

				this.syncModelState();
				NotifyManager.hideLoadingIndicator(true);
			}
			catch (error)
			{
				console.error(error);
				this.syncModelState();
				NotifyManager.showError(Loc.getMessage('MAIL_CALENDAR_SLOTS_INIT_ERROR'));
			}
		}

		async handleInsertButtonClick()
		{
			if (this.state.creatingLink || !this.isSharingEnabled())
			{
				return;
			}

			if (!Type.isFunction(this.props.onInsertLink))
			{
				NotifyManager.showError(Loc.getMessage('MAIL_CALENDAR_SLOTS_INSERT_LINK_ERROR'));

				return;
			}

			this.setState({ creatingLink: true });

			try
			{
				const publicShortUrl = await this.getPublicShortUrl();
				if (!Type.isStringFilled(publicShortUrl))
				{
					throw new Error('Empty sharing link');
				}

				await this.props.onInsertLink(publicShortUrl);
				this.layoutWidget.close();
			}
			catch (error)
			{
				console.error(error);
				NotifyManager.showError(Loc.getMessage('MAIL_CALENDAR_SLOTS_INSERT_LINK_ERROR'));
				this.setState({ creatingLink: false });
			}
		}

		async getPublicShortUrl()
		{
			if (!this.isCrmDeal())
			{
				return this.sharing.getModel().getJointPublicShortUrl();
			}

			const model = this.sharing.getModel();
			const members = model.getMembers();
			const memberIds = members
				.map((member) => Number(member.id))
				.filter((memberId) => memberId > 0)
			;

			if (memberIds.length <= 1)
			{
				return model.getPublicShortUrl();
			}

			const response = await BX.ajax.runAction('crm.api.timeline.calendar.sharing.generateJointSharingLink', {
				data: {
					entityTypeId: CrmOwnerType.DealId,
					entityId: this.getCrmEntityId(),
					memberIds,
				},
			});

			model.clearMembers();
			model.emit('CalendarSharing:JointLinkCreated');

			return response?.data?.url || '';
		}

		isCrmDeal()
		{
			return isCrmDealEntity({
				isCrmMessage: this.isCrmMessage,
				ownerType: this.ownerEntity?.ownerType,
				ownerId: this.ownerEntity?.ownerId,
			});
		}

		getCrmEntityId()
		{
			return Number(this.ownerEntity?.ownerId || 0);
		}

		isSharingEnabled()
		{
			return this.state.model.status === ModelSharingStatus.ENABLE;
		}

		syncModelState(state = {})
		{
			this.setState({
				...state,
				model: {
					...this.sharing.getModel().getFieldsValues(),
				},
			});
		}
	}

	const styles = {
		content: {
			paddingHorizontal: Indent.XL.toNumber(),
			paddingBottom: Indent.XL.toNumber(),
		},
		switcher: {
			marginBottom: Indent.M.toNumber(),
			marginTop: Indent.M.toNumber(),
		},
		initError: {
			flexGrow: 1,
			justifyContent: 'center',
			paddingHorizontal: Indent.XL3.toNumber(),
			paddingVertical: Indent.XL3.toNumber(),
		},
		footer: {
			backgroundColor: Color.bgPrimary.toHex(),
			borderTopWidth: 1,
			borderTopColor: Color.bgSeparatorPrimary.toHex(),
		},
	};

	module.exports = { MailCalendarSlots };
});
