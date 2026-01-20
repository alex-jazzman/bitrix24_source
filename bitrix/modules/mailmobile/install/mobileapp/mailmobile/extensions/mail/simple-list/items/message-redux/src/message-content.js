/**
 * @module mail/simple-list/items/message-redux/src/message-content
 */
jn.define('mail/simple-list/items/message-redux/src/message-content', (require, exports, module) => {
	const { PureComponent } = require('layout/pure-component');
	const { Text } = require('ui-system/typography/text');
	const { Moment } = require('utils/date');
	const { Haptics } = require('haptics');
	const AppTheme = require('apptheme');
	const { Color } = require('tokens');
	const { Loc } = require('loc');

	const { selectIsMultiSelectMode } = require('mail/statemanager/redux/slices/messages/selector');
	const { selectStartEmailSender } = require('mail/statemanager/redux/slices/mailboxes/selector');
	const { markAsSelected, unmarkAsSelected } = require('mail/statemanager/redux/slices/messages');
	const { changeReadStatus } = require('mail/statemanager/redux/slices/messages/thunk');
	const { connect } = require('statemanager/redux/connect');
	const store = require('statemanager/redux/store');
	const { dispatch } = store;

	const { ActionMenu } = require('mail/simple-list/items/message-redux/src/action-menu');
	const { Avatar } = require('mail/message/elements/avatar');

	class MessageContent extends PureComponent
	{
		get isSelected()
		{
			return this.props.item.isSelected;
		}

		get isMultiSelectMode()
		{
			return selectIsMultiSelectMode(store.getState());
		}

		get itemId()
		{
			return this.props.item.id;
		}

		get itemUidId()
		{
			return this.props.item.uidId;
		}

		get subject()
		{
			return this.props.item.subject;
		}

		get isRead()
		{
			return this.props.item.isRead;
		}

		get abbreviatedText()
		{
			return this.props.item.abbreviatedText;
		}

		get fullName()
		{
			let recipients = this.props.item.from;

			if (this.props.item.direction === 2)
			{
				recipients = this.props.item.to;
			}

			return recipients[0]?.customData?.name ?? '';
		}

		get email()
		{
			let recipients = this.props.item.from;

			if (this.props.item.direction === 2)
			{
				recipients = this.props.item.to;
			}

			return recipients[0]?.customData?.email ?? '';
		}

		get date()
		{
			return this.props.item.date;
		}

		get withAttachments()
		{
			return this.props.item.withAttachments;
		}

		get crmBindId()
		{
			return this.props.item.crmBindId ?? 0;
		}

		get chatBindId()
		{
			return this.props.item.chatBindId ?? 0;
		}

		get taskBindId()
		{
			return this.props.item.taskBindId ?? 0;
		}

		render()
		{
			return View(
				{
					style: {
						backgroundColor: this.isSelected ? AppTheme.colors.accentSoftBlue2 : AppTheme.colors.bgContentPrimary,
					},
				},
				this.renderContent(),
			);
		}

		renderContent()
		{
			return View(
				{
					onLongClick: this.openActionMenu,
					onClick: this.onMessageClick,
					ref: (ref) => {
						this.containerRef = ref;
					},
				},
				View(
					{
						style: {
							paddingLeft: 18,
							paddingTop: 8,
							paddingBottom: 14,
						},
					},
					View(
						{
							style: {
								flexDirection: 'row',
								alignItems: 'flex-start',
							},
						},
						Avatar({
							fullName: this.fullName,
							email: this.email,
							size: 40,
							isSelected: this.isSelected,
						}),
						View(
							{
								style: {
									width: '66%',
									marginLeft: 12,
									flexDirection: 'column',
									alignItems: 'flex-start',
								},
							},
							this.renderHeaderName(),
							this.renderSubject(),
							this.renderAbbreviatedText(),
							this.renderBindings(),
						),
						View(
							{
								style: {
									flex: 1,
									alignItems: 'flex-end',
								},
							},
							this.renderDate(),
							this.attachmentsIcon(),
						),
					),
				),
				this.border(),
			);
		}

		renderSubject()
		{
			return View(
				{
					style: {
						height: 20,
						overflow: 'hidden',
					},
				},
				Text({
					numberOfLines: 1,
					ellipsize: 'end',
					style: {
						fontWeight: this.isRead ? 'regular' : 'bold',
						alignSelf: 'center',
						fontSize: 15,
						marginBottom: 2,
					},
					text: this.subject,
				}),
			);
		}

		renderHeaderName()
		{
			return View(
				{
					style: {
						flexDirection: 'row',
						alignItems: 'flex-start',
						height: 20,
						overflow: 'hidden',
						marginBottom: 4,
					},
				},
				this.readingMarker(this.isRead),
				Text({
					numberOfLines: 1,
					ellipsize: 'end',
					style: {
						fontWeight: this.isRead ? 'regular' : 'bold',
						alignSelf: 'center',
						fontSize: 15,
					},
					text: this.fullName,
				}),
			);
		}

		readingMarker()
		{
			if (!this.isRead)
			{
				return Text({
					style: {
						marginTop: 7,
						marginBottom: 7,
						marginRight: 6,
						width: 6,
						height: 6,
						backgroundColor: AppTheme.colors.accentMainPrimary,
						borderRadius: 100,
					},
					text: '',
				});
			}

			return View();
		}

		renderAbbreviatedText()
		{
			return Text({
				numberOfLines: 1,
				ellipsize: 'end',
				style: {
					color: AppTheme.colors.base3,
					fontWeight: 'regular',
					fontSize: 15,
				},
				text: this.abbreviatedText,
			});
		}

		border()
		{
			return View({
				style: {
					width: '80%',
					height: 1,
					borderTopWidth: 1,
					borderTopColor: AppTheme.colors.bgSeparatorSecondary,
					marginLeft: 12,
					marginRight: 12,
					alignSelf: 'flex-end',
				},
			});
		}

		capsule(text, onClick)
		{
			return View(
				{
					style: {
						borderWidth: 1,
						borderColor: Color.accentSoftBorderBlue.toHex(),
						borderRadius: 100,
						paddingTop: 4,
						paddingBottom: 4,
						paddingLeft: 10,
						paddingRight: 10,
						marginRight: 6,
					},
					onClick,
				},
				Text({
					style: {
						alignSelf: 'center',
						fontSize: 13,
						color: AppTheme.colors.accentMainPrimary,
						height: 16,
						fontWeight: '400',
					},
					text,
				}),
			);
		}

		renderBindings()
		{
			const bindings = [];

			if (this.crmBindId)
			{
				bindings.push(this.capsule(
					Loc.getMessage('MAILMOBILE_GRID_MESSAGE_BINDING_CRM_TITLE'),
					this.openBindingEntity.bind(this, 'crm'),
				));
			}

			if (this.chatBindId)
			{
				bindings.push(this.capsule(
					Loc.getMessage('MAILMOBILE_GRID_MESSAGE_BINDING_CHAT_TITLE'),
					this.openBindingEntity.bind(this, 'chat'),
				));
			}

			if (this.taskBindId)
			{
				bindings.push(this.capsule(
					Loc.getMessage('MAILMOBILE_GRID_MESSAGE_BINDING_TASK_TITLE'),
					this.openBindingEntity.bind(this, 'task'),
				));
			}

			return View(
				{
					style: {
						marginTop: 6,
						flexDirection: 'row',
					},
				},
				...bindings,
			);
		}

		renderDate()
		{
			const moment = Moment.createFromTimestamp(this.date);

			const text = moment.format((momentInstance) => {
				return momentInstance.isToday ? 'HH:mm' : 'DD MMM';
			});

			return Text({
				numberOfLines: 1,
				ellipsize: 'end',
				style: {
					marginRight: 18,
					marginTop: 2,
					maxWidth: 120,
					textAlign: 'center',
					fontWeight: '400',
					fontSize: 13,
					alignSelf: 'flex-end',
					color: AppTheme.colors.base4,
				},
				text,
			});
		}

		attachmentsIcon()
		{
			if (this.withAttachments)
			{
				return View(
					{
						style: {
							marginTop: 8,
							marginRight: 18,
						},
					},
					Image({
						style: {
							width: 20,
							height: 20,
						},
						svg: {
							content: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5.14886 4.99754C7.04866 3.09774 9.80759 3.41271 11.0932 4.66355C11.6278 5.18377 12.309 5.86975 12.9848 6.55125C13.0265 6.59326 13.0682 6.63529 13.1098 6.67723C13.7451 7.31796 14.3685 7.94544 14.8608 8.4282C15.0908 8.65376 15.0941 9.02338 14.8686 9.2534C14.643 9.48341 14.2734 9.48679 14.0434 9.26121C13.545 8.77244 12.9165 8.13874 12.2836 7.50047C12.2413 7.45781 12.199 7.41519 12.1567 7.37254C11.479 6.6891 10.8054 6.01099 10.2797 5.49949C9.44456 4.68701 7.41588 4.38092 5.97405 5.82273C4.5287 7.26825 4.85732 9.2259 5.62444 9.99363C6.40675 10.7759 8.84612 13.1399 10.1401 14.394C10.4907 14.7339 10.7574 14.9923 10.8842 15.1157C11.0522 15.279 11.5253 15.5063 12.1186 15.5571C12.6939 15.6064 13.2397 15.4776 13.6117 15.1157C14.4548 14.2954 14.348 13.0814 13.766 12.5151C13.3522 12.1125 12.1356 10.9306 10.9858 9.81297C10.6959 9.5312 10.4095 9.25364 10.142 8.99363C9.34908 8.22295 8.71556 7.60715 8.60491 7.49949C8.55065 7.44669 8.38535 7.34519 8.18108 7.31883C8.003 7.29586 7.82006 7.33101 7.6469 7.49949C7.46574 7.6759 7.40545 7.89052 7.41057 8.09617C7.41322 8.2009 7.43355 8.29464 7.45843 8.36473C7.47464 8.41041 7.48793 8.4336 7.49163 8.43992C7.81361 8.75537 10.8049 11.7347 11.0991 12.0288C11.3269 12.2566 11.3269 12.6262 11.0991 12.854C10.8712 13.0818 10.5017 13.0818 10.2739 12.854C9.97223 12.5524 6.89689 9.4893 6.66448 9.26316C6.51747 9.12008 6.4203 8.92846 6.35882 8.75535C6.29321 8.57053 6.25028 8.35408 6.24456 8.12449C6.23312 7.66145 6.37488 7.10876 6.83343 6.66258C7.30026 6.20846 7.85643 6.10047 8.3305 6.1616C8.77813 6.21939 9.1784 6.4292 9.41839 6.66258C9.52831 6.76954 10.162 7.3855 10.9555 8.15672C11.2229 8.41657 11.5085 8.6944 11.7983 8.97606C12.9481 10.0936 14.1654 11.2762 14.5795 11.6792C15.6534 12.7242 15.7175 14.6943 14.4252 15.9516C13.7297 16.6284 12.8001 16.7871 12.019 16.7202C11.2559 16.6548 10.4916 16.3621 10.0698 15.9516C9.94601 15.8312 9.6838 15.5775 9.33831 15.2427C8.04769 13.9917 5.59026 11.6089 4.80022 10.8188C3.5717 9.59031 3.25312 6.89343 5.14886 4.99754Z" fill="#A7A7A7"/></svg>',
						},
					}),
				);
			}

			return null;
		}

		openBindingEntity = (type) => {
			const actionMenu = new ActionMenu(this.props.item.id);

			switch (type)
			{
				case 'crm':
					actionMenu.openCrmEntity();
					break;
				case 'chat':
					actionMenu.openChatEntity();
					break;
				case 'task':
					actionMenu.openTaskEntity();
					break;
				default:
					break;
			}
		};

		openActionMenu = () => {
			if (!this.isMultiSelectMode)
			{
				Haptics.impactLight();
				void new ActionMenu(this.props.item.id).show(this.containerRef);
			}
		};

		onMessageClick = () => {
			const itemId = this.itemId;
			const itemUidId = this.itemUidId;

			if (this.isMultiSelectMode)
			{
				if (this.isSelected)
				{
					dispatch(unmarkAsSelected({ objectId: itemId }));
				}
				else
				{
					dispatch(markAsSelected({ objectId: itemId }));
				}
			}
			else
			{
				this.props.itemDetailOpenHandler(itemId, selectStartEmailSender(store.getState()));
				dispatch(changeReadStatus({ objectIds: [itemId], objectUidIds: [itemUidId], isRead: 1 }));
			}
		};
	}

	module.exports = {
		MessageContentView: connect()(MessageContent),
	};
});
