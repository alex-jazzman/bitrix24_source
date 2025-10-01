export const Layout = {
	chat: 'chat',
	createChat: 'createChat',
	updateChat: 'updateChat',
	channel: 'channel',
	notification: 'notification',
	openlines: 'openlines',
	openlinesV2: 'openlinesV2',
	conference: 'conference',
	settings: 'settings',
	aiAssistant: 'aiAssistant',
	collab: 'collab',
	market: 'market',
};

export type LayoutType = $Values<typeof Layout>;
