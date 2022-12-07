/**
 * @module communication/menu
 */
jn.define('communication/menu', (require, exports, module) => {

	const { getFormattedNumber } = require('utils/phone');
	const { isEmpty } = require('utils/object');
	const { CommunicationEvents } = require('communication/events');
	const { ImType } = require('layout/ui/fields/im');
	const { PhoneType } = require('layout/ui/fields/phone');
	const EntitySvg = require('assets/communication/menu');

	const CHANNELS = 'CHANNELS';
	const OPEN_LINE_CODE = 'OPENLINE';
	const MonochromeGraphite = '#767c87';

	/**
	 * @class CommunicationMenu
	 */
	class CommunicationMenu
	{
		constructor(props)
		{
			this.setConnectionTypes(props.connections);
			this.value = props.value || {};
			this.ownerInfo = props.ownerInfo || {};
			this.titlesBySectionCode = {};
			this.onCloseCommunicationMenu = this.handleOnCloseMenu.bind(this);
		}

		show(connections)
		{
			this.setConnectionTypes(connections);
			const menu = this.create();
			menu.show(PageManager);
		}

		getSvg(type)
		{
			return EntitySvg[type](MonochromeGraphite);
		}

		getItems()
		{
			return Object.keys(this.value)
				.map((contactType) => {
						const contactValues = this.value[contactType];
						if (!Array.isArray(contactValues))
						{
							return null;
						}

						return contactValues.map((contactValue) =>
							this.connectionTypes.map((connectionType) => {
									const connectionValues = contactValue[connectionType];

									if (!connectionValues)
									{
										return null;
									}

									return Array.isArray(connectionValues)
										? connectionValues.map((connectionValue) =>
											this.createItem({
												...contactValue,
												[connectionType]: connectionValue,
												connectionType,
											}))
										: this.createItem({ ...contactValue, connectionType });
								},
							),
						);
					},
				)
				.flat(Infinity)
				.filter(Boolean);
		}

		createItem(params)
		{
			const { id, type, title = '', connectionType } = params;
			const itemValue = params[connectionType];

			if (connectionType === ImType && OPEN_LINE_CODE !== itemValue.valueType)
			{
				return null;
			}

			const sectionCode = `${type}_${title}`;
			this.setTitlesSectionCode(title, type, sectionCode);

			return {
				id: `${id}_${type}`,
				sectionCode,
				title: this.getTitle(itemValue.value || itemValue, connectionType),
				subtitle: itemValue.complexName || '',
				data: {
					svgIcon: this.getSvg(connectionType),
				},
				closeCallback: this.onCloseCommunicationMenu,
				onClickCallback: () => Promise.resolve({
					closeCallback: this.handleOnCloseMenu({
						type: connectionType,
						props: this.prepareValue(params, connectionType),
					}),
				}),
			};
		}

		handleOnCloseMenu(params)
		{
			return () => CommunicationEvents.execute(params);
		}

		getTitle(value, type)
		{
			const preparers = {
				[PhoneType]: getFormattedNumber,
				[ImType]: () => BX.message('M_CRM_COMMUNICATION_MENU_OPENLINE'),
			};

			if (preparers.hasOwnProperty(type))
			{
				const preparer = preparers[type];

				return preparer(value);
			}

			return String(value);
		}

		setTitlesSectionCode(title, type, sectionCode)
		{
			const titleContactType = BX.message(`M_CRM_COMMUNICATION_MENU_${type.toUpperCase()}`) || '';
			this.titlesBySectionCode[sectionCode] = BBCodeText({
				style: {
					fontSize: 14,
					fontWeight: '400',
					color: '#959ca4',
				},
				numberOfLines: 1,
				ellipsize: 'end',
				value: `[COLOR=#525C69]${titleContactType}[/COLOR] ${title}`.trim(),
			});
		}

		prepareValue(menuValue, connectionType)
		{
			const connection = menuValue[connectionType];

			switch (connectionType)
			{
				case PhoneType:

					const entityId = menuValue.id;
					const entityTypeName = menuValue.type.toUpperCase();

					const params = {
						'ENTITY_TYPE_NAME': entityTypeName,
						'ENTITY_ID': entityId,
					};

					if (!isEmpty(this.ownerInfo) &&
						(this.ownerInfo.ownerId !== entityId || this.ownerInfo.ownerTypeName !== entityTypeName)
					)
					{
						params.BINDINGS = [
							{
								OWNER_ID: this.ownerInfo.ownerId,
								OWNER_TYPE_NAME: this.ownerInfo.ownerTypeName,
							},
						];
					}

					return {
						number: typeof connection === 'string' ? connection : connection.value,
						params,
					};
				case ImType:
					const connectionValue = menuValue[connectionType];

					return {
						event: 'openline',
						params: {
							userCode: connectionValue.value,
							titleParams: {
								name: connectionValue.complexName,
							},
						},
					};
				default:
					return menuValue[connectionType].value;
			}
		}

		setConnectionTypes(connections = [])
		{
			if (!isEmpty(connections) && Array.isArray(connections))
			{
				this.connectionTypes = connections;
			}
		}

		create()
		{
			const actions = this.getItems();

			const title = this.connectionTypes.length === 1 ? this.connectionTypes[0].toUpperCase() : CHANNELS;

			return new ContextMenu({
				testId: 'COMMUNICATION_MENU',
				actions,
				titlesBySectionCode: this.titlesBySectionCode,
				params: {
					showCancelButton: true,
					title: BX.message(`M_CRM_COMMUNICATION_MENU_${title}`),
				},
			});
		}

	}

	module.exports = { CommunicationMenu };

});