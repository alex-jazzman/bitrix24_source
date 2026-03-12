/**
 * @module crm/communication/button
 */
jn.define('crm/communication/button', (require, exports, module) => {
	const { Alert } = require('alert');
	const AppTheme = require('apptheme');
	const communicationIcons = require('assets/communication');
	const { PhoneType, ImType, EmailType, isExistContacts } = require('communication/connection');
	const { CommunicationMenu } = require('communication/menu');
	const { Loc } = require('loc');
	const { get, isObjectLike, mergeImmutable } = require('utils/object');
	const { Icon } = require('assets/icons');

	const connections = [PhoneType, EmailType, ImType];

	const ICON_SIZE = 28;
	const ICON_COLOR = {
		ENABLED: AppTheme.colors.accentExtraDarkblue,
		DISABLED: AppTheme.colors.base6,
	};

	const TelegramConnectorManagerOpener = () => {
		try
		{
			const { TelegramConnectorManager } = require('imconnector/connectors/telegram');

			return new TelegramConnectorManager();
		}
		catch (e)
		{
			console.warn(e, 'TelegramConnectorManager not found');

			return null;
		}
	};

	/**
	 * @class CommunicationButton
	 */
	class CommunicationButton extends LayoutComponent
	{
		constructor(props)
		{
			super(props);

			this.communicationMenu = null;
			this.telegramConnectorManager = null;
			this.onClickTelegramConnection = this.onClickTelegramConnection.bind(this);
		}

		get permissions()
		{
			return BX.prop.getObject(this.props, 'permissions', {});
		}

		componentDidUpdate(prevProps, prevState)
		{
			if (this.communicationMenu)
			{
				const { uid, value } = this.props;

				this.communicationMenu.setUid(uid);
				this.communicationMenu.setValue(value);
			}
		}

		render()
		{
			this.availableConnections = this.getExistConnections();

			const { viewRef, testId } = this.props;
			const { main, shadow, wrapper } = this.styles();
			// const WrapperView = showShadow ? Shadow : View;

			return View(
				{
					ref: viewRef,
					testId,
					safeArea: {
						bottom: true,
						top: true,
						left: true,
						right: true,
					},
					style: main,
					onClick: this.showMenu.bind(this),
				},
				View(
					{
						radius: 2,
						offset: {
							y: 2,
						},
						inset: {
							left: 2,
							right: 2,
						},
						style: shadow,
					},
					View(
						{ style: wrapper },
						...this.getCommunicationIcons(),
					),
				),
			);
		}

		getCommunicationIcons()
		{
			const { icon: iconStyle } = this.styles();

			return connections.map((connectionType) => {
				const icon = communicationIcons[connectionType];
				const iconColor = this.availableConnections[connectionType]
					? ICON_COLOR.ENABLED
					: ICON_COLOR.DISABLED;

				return View(
					{
						style: iconStyle,
					},
					Image({
						style: {
							flex: 1,
						},
						svg: {
							content: icon(iconColor),
						},
					}),
				);
			});
		}

		getExistConnections()
		{
			const { value } = this.props;

			return Object.fromEntries(
				connections.map((connectionType) => [connectionType, isExistContacts(value, connectionType)]),
			);
		}

		showMenu()
		{
			const { value, ownerInfo, showConnectionStubs, clientOptions, uid } = this.props;

			if (!this.showHighlighted())
			{
				return;
			}

			this.communicationMenu = new CommunicationMenu({
				value,
				ownerInfo,
				connections,
				additionalItems: this.getAdditionalItems(),
				permissions: this.permissions,
				showConnectionStubs,
				clientOptions,
				uid,
				analyticsSection: 'crm',
			});

			this.communicationMenu.show();
		}

		showHighlighted()
		{
			return (
				this.hasPermissionsForAdd()
				|| this.hasPermissionsForEdit()
				|| this.hasConnections()
			);
		}

		hasPermissionsForAdd()
		{
			return Object.values(this.permissions)
				.filter((item) => isObjectLike(item))
				.some(({ add = false }) => Boolean(add));
		}

		hasPermissionsForEdit()
		{
			return Object.values(this.permissions)
				.filter((item) => isObjectLike(item))
				.some(({ update = false }) => Boolean(update));
		}

		hasPermissionsForRead()
		{
			return Object.values(this.permissions)
				.filter((item) => isObjectLike(item))
				.some(({ read = false }) => Boolean(read));
		}

		hasConnections()
		{
			return Object.values(this.availableConnections).some(Boolean);
		}

		getAdditionalItems()
		{
			const items = [];

			this.telegramConnectorManager = TelegramConnectorManagerOpener();

			if (this.telegramConnectorManager && this.props.showTelegramConnection)
			{
				items.push(this.getTelegramConnectionItem());
			}

			return items;
		}

		getTelegramConnectionItem()
		{
			return {
				id: 'telegram-connect',
				sectionCode: 'telegram-connect',
				title: Loc.getMessage('MCRM_COMMUNICATION_BUTTON_TELEGRAM_CONNECT_TITLE'),
				subtitle: Loc.getMessage('MCRM_COMMUNICATION_BUTTON_TELEGRAM_CONNECT_SUBTITLE'),
				isSelected: false,
				showSelectedImage: false,
				icon: Icon.TELEGRAM,
				data: {
					style: {
						container: {
							backgroundColor: AppTheme.colors.accentSoftBlue1,
						},
						item: {
							subtitle: {
								color: AppTheme.colors.base2,
							},
						},
					},
				},
				onClickCallback: this.onClickTelegramConnection,
			};
		}

		onClickTelegramConnection(resolve)
		{
			if (!this.telegramConnectorManager)
			{
				this.showTelegramConnectionAccessDeniedError();

				resolve({ closeMenu: false });
			}

			const openLinesAccess = get(this.permissions, 'openLinesAccess', null);

			const promise = openLinesAccess === null
				? this.telegramConnectorManager.hasAccess(env.userId)
				: Promise.resolve();

			return new Promise((resolve) => {
				promise
					.then((data) => {
						if (openLinesAccess === true || (data && data.canEditConnector))
						{
							resolve({
								closeCallback: () => {
									this.telegramConnectorManager.openEditor();
								},
							});
						}
						else
						{
							this.showTelegramConnectionAccessDeniedError();
							resolve({ closeMenu: false });
						}
					})
					.catch(() => {
						this.showTelegramConnectionAccessDeniedError();
						resolve({ closeMenu: false });
					})
				;
			});
		}

		showTelegramConnectionAccessDeniedError()
		{
			Alert.alert(
				Loc.getMessage('MCRM_COMMUNICATION_BUTTON_TELEGRAM_CONNECT_ACCESS_DENIED_TITLE'),
				Loc.getMessage('MCRM_COMMUNICATION_BUTTON_TELEGRAM_CONNECT_ACCESS_DENIED_DESCRIPTION'),
				null,
				Loc.getMessage('MCRM_COMMUNICATION_BUTTON_TELEGRAM_CONNECT_ACCESS_DENIED_CONFIRM'),
			);
		}

		styles()
		{
			const { horizontal = true, styles } = this.props;
			const width = horizontal ? 100 : 36;
			const height = horizontal ? 36 : 100;

			const defaultStyles = {
				main: {
					display: 'flex',
					width,
					justifyContent: 'center',
					alignItems: 'center',
				},
				shadow: {
					borderRadius: height / 2,
				},
				wrapper: {
					height,
					width,
					paddingHorizontal: horizontal ? 6 : 4,
					paddingVertical: horizontal ? 4 : 6,
					borderRadius: height / 2,
					backgroundColor: this.showHighlighted() ? AppTheme.colors.accentSoftBlue2 : AppTheme.colors.bgContentTertiary,
					flexShrink: 2,
					justifyContent: 'space-evenly',
					flexDirection: horizontal ? 'row' : 'column',
					alignItems: 'center',
					...this.getBorder(),
				},
				icon: {
					width: ICON_SIZE,
					height: ICON_SIZE,
				},
			};

			return mergeImmutable(defaultStyles, styles);
		}

		getBorder()
		{
			const { border } = this.props;

			if (!border)
			{
				return {};
			}

			return {
				borderColor: this.showHighlighted() ? AppTheme.colors.accentExtraAqua : ICON_COLOR.DISABLED,
				borderWidth: 1,
			};
		}
	}

	module.exports = { CommunicationButton };
});
