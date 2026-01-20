/**
 * @module mail/mailbox/selector
 */

jn.define('mail/mailbox/selector', (require, exports, module) => {
	const { Avatar } = require('mail/message/elements/avatar');
	const { AjaxMethod } = require('mail/const');
	const store = require('statemanager/redux/store');
	const { dispatch } = store;
	const {
		mailboxesAdded,
		setCurrentMailbox,
	} = require('mail/statemanager/redux/slices/mailboxes');
	const {
		selectCurrentMailbox,
	} = require('mail/statemanager/redux/slices/mailboxes/selector');
	const { observeMailboxesChange } = require('mail/statemanager/redux/slices/mailboxes/observers/stateful-list');
	const { observeFoldersChange } = require('mail/statemanager/redux/slices/folders/observers/stateful-list');
	const { selectMailboxesSortedById } = require('mail/statemanager/redux/slices/mailboxes/selector');
	const { selectTotalUnreadCount } = require('mail/statemanager/redux/slices/folders/selector');
	const { MailDialog } = require('mail/dialog');
	const { MoreMenu } = require('mail/mailbox/selector/src/more-menu');
	const { Corner, Color } = require('tokens');
	const { Loc } = require('loc');
	const {
		Button,
		ButtonSize,
		ButtonDesign,
	} = require('ui-system/form/buttons/button');
	const { Icon } = require('assets/icons');

	class Selector extends LayoutComponent
	{
		constructor(props)
		{
			super(props);

			this.parentWidget = props.parentWidget;

			const data = selectMailboxesSortedById(store.getState());
			this.mailboxes = Object.values(data).map((item) => ({ ...item, key: `mailbox_${item.id}` }));
		}

		componentDidMount()
		{
			this.unsubscribeMailboxesObserver = observeMailboxesChange(
				store,
				this.onVisibleChange,
			);

			this.unsubscribeFoldersObserver = observeFoldersChange(
				store,
				this.onVisibleChange,
			);
		}

		componentWillUnmount()
		{
			if (this.unsubscribeMailboxesObserver)
			{
				this.unsubscribeMailboxesObserver();
			}

			if (this.unsubscribeFoldersObserver)
			{
				this.unsubscribeFoldersObserver();
			}
		}

		render()
		{
			const currentMailbox = selectCurrentMailbox(store.getState());
			const unreadCounter = selectTotalUnreadCount(store.getState());

			let mailboxButton = null;

			if (currentMailbox !== undefined && currentMailbox !== null)
			{
				mailboxButton = MailboxButton({
					email: currentMailbox.email,
					name: currentMailbox.userName,
					count: unreadCounter,
					isSelected: true,
					button: SelectMailboxButton(),
					onClick: this.openMailboxMenu.bind(this),
				});
			}

			return View(
				{
					style: {
						paddingBottom: 22,
					},
				},
				mailboxButton,
			);
		}

		onVisibleChange = () => {
			this.setState({});
		};

		openMailboxMenu() {
			this.parentWidget.openWidget(
				'layout',
				{
					titleParams: {
						text: Loc.getMessage('MAIL_FOLDER_SELECTOR_MAILBOXES_MENU_TITLE'),
						type: 'dialog',
					},
					backgroundColor: Color.bgContentPrimary.toHex(),
					resizableByKeyboard: true,
					rightButtons: [],
					leftButtons: [],
					backdrop: {
						forceDismissOnSwipeDown: true,
						hideNavigationBar: false,
						horizontalSwipeAllowed: false,
						mediumPositionPercent: 65,
						mediumPositionHeight: (this.mailboxes.length * 73) + (8 + 66 + 46),
						onlyMediumPosition: true,
						shouldResizeContent: true,
						swipeAllowed: true,
						swipeContentAllowed: false,
					},
					onReady: (layoutWidget) => {
						layoutWidget.showComponent(new MailboxList({
							mailboxes: this.mailboxes,
							parentWidget: this.parentWidget,
							layoutWidget,
						}));
					},
				},
				this.layoutWidget,
			);
		}
	}

	class MailboxList extends LayoutComponent
	{
		constructor(props)
		{
			super(props);

			const {
				mailboxes = [],
				layoutWidget,
				parentWidget,
			} = props;

			this.mailboxes = mailboxes;
			this.layoutWidget = layoutWidget;
			this.parentWidget = parentWidget;
		}

		openMailboxConnector()
		{
			BX.ajax.runAction(
				AjaxMethod.isMailboxConnectingAvailable,
				{
					data: {},
				},
			).then(({ data }) => {
				if (data === true)
				{
					MailDialog.show({
						type: MailDialog.CONNECTING_MAIL_TYPE,
						parentWidget: this.parentWidget,
						successCallback: (id) => {
							this.parentWidget.close(() => {
								BX.postComponentEvent('Mail.Mailbox::significantChangesInStructure', [id]);
							});
						},
					});
				}
				else
				{
					MailDialog.show({
						type: MailDialog.CONNECTION_MAIL_TYPE_FORBIDDEN,
						needsToCloseLayout: true,
						parentWidget: this.parentWidget,
					});
				}
			});
		}

		renderMailboxesList(mailboxes = [])
		{
			const mailboxCards = [];

			const currentMailboxId = selectCurrentMailbox(store.getState())?.id;
			const isLastMailbox = mailboxes.length <= 1;

			for (const mailbox of mailboxes)
			{
				const isSelected = currentMailboxId === mailbox.id;
				const unreadCounter = isSelected ? selectTotalUnreadCount(store.getState()) : mailbox.counter;

				mailboxCards.push(
					MailboxButton({
						name: mailbox.userName,
						email: mailbox.email,
						count: unreadCounter,
						isSelected,
						isLastMailbox,
						onClick: (ref) => {
							if (isSelected && !isLastMailbox)
							{
								new MoreMenu({ mailboxId: mailbox.id, parentWidget: this.parentWidget }).openMoreMenu(ref);
							}
							else
							{
								this.props.parentWidget.close(() => {
									dispatch(setCurrentMailbox({ mailboxId: mailbox.id }));
								});
							}
						},
					}),
				);
			}

			return ScrollView(
				{
					style: {
						flex: 1,
					},
				},
				View(
					{
						style: {},
					},
					...mailboxCards,
				),
			);
		}

		render()
		{
			return View(
				{
					style: {
						paddingTop: 12,
						width: '100%',
					},
				},
				this.renderMailboxesList(this.mailboxes),
				View(
					{
						style: {
							width: '100%',
							paddingLeft: 18,
							paddingRight: 18,
						},
					},
					Button({
						style: {
							marginBottom: 46,
						},
						stretched: true,
						testId: 'mailmobile_mailbox_selector_add_mailbox',
						text: Loc.getMessage('MAILMOBILE_MAILBOX_SELECTOR_ADD_MAILBOX'),
						size: ButtonSize.XL,
						design: ButtonDesign.OUTLINE_ACCENT_2,
						leftIcon: Icon.PLUS_SIZE_M,
						onClick: () => {
							this.layoutWidget.close(this.openMailboxConnector.bind(this));
						},
					}),
				),
			);
		}
	}

	function getMailboxListPromise()
	{
		return BX.ajax.runAction(AjaxMethod.mailGetAvailableMailboxes, {
			data: {},
		});
	}

	function updateMailboxList(action = () => {}, mailboxes = [])
	{
		if (mailboxes.length > 0)
		{
			dispatch(mailboxesAdded(mailboxes));
			action();
		}
		else
		{
			getMailboxListPromise().then(({ data }) => {
				dispatch(mailboxesAdded(data));
				action();
			});
		}
	}

	function SelectMailboxButton()
	{
		return View(
			{
				style: {},
			},
			Image({
				style: {
					width: 24,
					height: 24,
				},
				svg: {
					content: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17.5048 9.50476C17.7781 9.23143 18.2216 9.2315 18.495 9.50476C18.7684 9.77813 18.7684 10.2216 18.495 10.495L12.495 16.495C12.2216 16.7684 11.7781 16.7684 11.5048 16.495L5.50476 10.495C5.2315 10.2216 5.23143 9.77809 5.50476 9.50476C5.77809 9.23143 6.22162 9.2315 6.495 9.50476L11.9999 15.0096L17.5048 9.50476Z" fill="#A7A7A7"/></svg>',
				},
			}),
		);
	}
	function MailboxButton(props)
	{
		const {
			name = '',
			email = '',
			isSelected,
			onClick = (ref) => {},
			count = 0,
			button = null,
			isLastMailbox = false,
		} = props;

		let editIconRef = null;

		return View(
			{
				onClick: () => onClick(editIconRef),
				style: {
					display: 'flex',
					flexDirection: 'row',
					height: 73,
					alignItems: 'center',
					paddingLeft: 18,
					paddingRight: 18,
					paddingTop: 16,
					paddingBottom: 15,
					marginLeft: 18,
					marginRight: 18,
					...(isSelected ? {
						backgroundColor: Color.accentSoftBlue3.toHex(),
						borderColor: Color.accentSoftBorderBlue.toHex(),
						borderWidth: 1,
						borderRadius: Corner.L.toNumber(),
					} : {}),
				},
			},
			Avatar({
				size: 40,
				fullName: name,
				email,
			}),
			View(
				{
					style: {
						marginLeft: 12,
					},
				},
				Text({
					style: {
						color: isSelected ? Color.accentMainPrimary.toHex() : Color.base1.toHex(),
						fontSize: 17,
						fontWeight: '400',
						maxWidth: 161,
					},
					numberOfLines: 1,
					ellipsize: 'end',
					text: name,
				}),
				Text({
					style: {
						color: isSelected ? Color.base1.toHex() : Color.base3.toHex(),
						maxWidth: 161,
						fontWeight: isSelected ? '500' : '400',
					},
					numberOfLines: 1,
					ellipsize: 'end',
					text: email,
				}),
			),
			View(
				{
					style: {
						flex: 1,
					},
				},
			),
			count > 0
			&& View(
				{
					style: {
						marginRight: 12,
						marginLeft: 12,
						height: 18,
						minWidth: 20,
						borderRadius: 50,
						backgroundColor: (isSelected && count !== '') ? Color.accentMainPrimary.toHex() : 'transparent',
					},
				},
				Text({
					text: String(count),
					style: {
						ellipsize: 'end',
						numberOfLines: 1,
						textAlign: 'center',
						paddingVertical: 1,
						paddingHorizontal: 6,
						color: isSelected ? Color.baseWhiteFixed.toHex() : Color.base3.toHex(),
						fontSize: 13,
						fontWeight: '500',
					},
				}),
			),
			button,
			(button === null && isSelected && !isLastMailbox)
			&& View(
				{
					ref: (ref) => {
						editIconRef = ref;
					},
					style: {},
				},
				Image({
					style: {
						width: 28,
						height: 28,
					},
					svg: {
						content: '<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0 6C0 2.68629 2.68629 0 6 0H22C25.3137 0 28 2.68629 28 6V22C28 25.3137 25.3137 28 22 28H6C2.68629 28 0 25.3137 0 22V6Z" fill="white" fill-opacity="0.01"/><path d="M7.49969 11.5495C8.85275 11.5495 9.94982 12.6467 9.94989 13.9997C9.94989 15.3528 8.85279 16.4499 7.49969 16.4499C6.14666 16.4498 5.0495 15.3527 5.0495 13.9997C5.04957 12.6467 6.1467 11.5496 7.49969 11.5495ZM13.9997 11.5495C15.3527 11.5495 16.4498 12.6467 16.4499 13.9997C16.4499 15.3528 15.3528 16.4499 13.9997 16.4499C12.6467 16.4498 11.5495 15.3527 11.5495 13.9997C11.5496 12.6467 12.6467 11.5496 13.9997 11.5495ZM20.4997 11.5495C21.8527 11.5495 22.9498 12.6467 22.9499 13.9997C22.9499 15.3528 21.8528 16.4499 20.4997 16.4499C19.1467 16.4498 18.0495 15.3527 18.0495 13.9997C18.0496 12.6467 19.1467 11.5496 20.4997 11.5495ZM7.49969 12.7497C6.80944 12.7498 6.24977 13.3094 6.24969 13.9997C6.24969 14.69 6.8094 15.2496 7.49969 15.2497C8.19005 15.2497 8.74969 14.6901 8.74969 13.9997C8.74962 13.3094 8.19001 12.7497 7.49969 12.7497ZM13.9997 12.7497C13.3094 12.7498 12.7498 13.3094 12.7497 13.9997C12.7497 14.69 13.3094 15.2496 13.9997 15.2497C14.6901 15.2497 15.2497 14.6901 15.2497 13.9997C15.2496 13.3094 14.69 12.7497 13.9997 12.7497ZM20.4997 12.7497C19.8094 12.7498 19.2498 13.3094 19.2497 13.9997C19.2497 14.69 19.8094 15.2496 20.4997 15.2497C21.1901 15.2497 21.7497 14.6901 21.7497 13.9997C21.7496 13.3094 21.19 12.7497 20.4997 12.7497Z" fill="#A7A7A7"/></svg>',
					},
				}),
			),
		);
	}
	module.exports = {
		Selector,
		MailboxList,
		updateMailboxList,
	};
});
