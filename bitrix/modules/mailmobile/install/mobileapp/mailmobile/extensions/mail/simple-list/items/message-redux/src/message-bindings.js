/**
 * @module mail/simple-list/items/message-redux/src/message-bindings
 */
jn.define('mail/simple-list/items/message-redux/src/message-bindings', (require, exports, module) => {
	const { Text5 } = require('ui-system/typography/text');
	const { Color, Indent } = require('tokens');
	const { Loc } = require('loc');

	const { ActionMenu } = require('mail/simple-list/items/message-redux/src/action-menu');

	const BINDING_TYPES = [
		{ key: 'crmBindId', type: 'crm', locKey: 'MAILMOBILE_GRID_MESSAGE_BINDING_CRM_TITLE' },
		{ key: 'chatBindId', type: 'chat', locKey: 'MAILMOBILE_GRID_MESSAGE_BINDING_CHAT_TITLE' },
		{ key: 'taskBindId', type: 'task', locKey: 'MAILMOBILE_GRID_MESSAGE_BINDING_TASK_TITLE' },
		{ key: 'eventBindId', type: 'event', locKey: 'MAILMOBILE_GRID_MESSAGE_BINDING_EVENT_TITLE' },
		{ key: 'blogPostBindId', type: 'blog', locKey: 'MAILMOBILE_GRID_MESSAGE_BINDING_BLOG_POST_TITLE' },
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
			case 'blog':
				actionMenu.openFeedPostEntity();
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
					paddingTop: Indent.XS.toNumber(),
					paddingBottom: Indent.XS.toNumber(),
					paddingLeft: Indent.L.toNumber(),
					paddingRight: Indent.L.toNumber(),
					marginRight: Indent.S.toNumber(),
				},
				onClick,
			},
			Text5({
				testId: 'mailmobile-message-list-item-binding-capsule',
				color: Color.accentMainPrimary,
				style: {
					alignSelf: 'center',
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
	 * @param {number} props.blogPostBindId
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
					marginTop: Indent.S.toNumber(),
					flexDirection: 'row',
				},
			},
			...bindings,
		);
	}

	module.exports = { MessageBindings };
});
