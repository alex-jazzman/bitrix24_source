/**
 * @module mail/simple-list/items/message-redux/src/message-bindings
 */
jn.define('mail/simple-list/items/message-redux/src/message-bindings', (require, exports, module) => {
	const { Text } = require('ui-system/typography/text');
	const AppTheme = require('apptheme');
	const { Color } = require('tokens');
	const { Loc } = require('loc');

	const { ActionMenu } = require('mail/simple-list/items/message-redux/src/action-menu');

	const BINDING_TYPES = [
		{ key: 'crmBindId', type: 'crm', locKey: 'MAILMOBILE_GRID_MESSAGE_BINDING_CRM_TITLE' },
		{ key: 'chatBindId', type: 'chat', locKey: 'MAILMOBILE_GRID_MESSAGE_BINDING_CHAT_TITLE' },
		{ key: 'taskBindId', type: 'task', locKey: 'MAILMOBILE_GRID_MESSAGE_BINDING_TASK_TITLE' },
		{ key: 'eventBindId', type: 'event', locKey: 'MAILMOBILE_GRID_MESSAGE_BINDING_EVENT_TITLE' },
	];

	function openBindingEntity(itemId, type)
	{
		const actionMenu = new ActionMenu(itemId);

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
			case 'event':
				actionMenu.openEventEntity();
				break;
			default:
				break;
		}
	}

	function capsule(text, onClick)
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

	/**
	 * @param {object} props
	 * @param {number} props.itemId
	 * @param {number} props.crmBindId
	 * @param {number} props.chatBindId
	 * @param {number} props.taskBindId
	 * @param {number} props.eventBindId
	 */
	function MessageBindings(props)
	{
		const { itemId } = props;
		const bindings = [];

		for (const { key, type, locKey } of BINDING_TYPES)
		{
			if (props[key])
			{
				bindings.push(capsule(
					Loc.getMessage(locKey),
					() => openBindingEntity(itemId, type),
				));
			}
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

	module.exports = { MessageBindings };
});
