/**
 * @module mail/testing/catalog
 */
jn.define('mail/testing/catalog', (require, exports, module) => {
	const { testingCatalog } = require('testing/catalog');

	testingCatalog.registerManifest({
		module: {
			id: 'mail',
			title: 'Почта',
			sortOrder: 350,
		},
		features: [
			{
				id: 'mail.signatures',
				title: 'Подписи',
				sortOrder: 10,
			},
			{
				id: 'mail.favorites',
				title: 'Избранные письма',
				sortOrder: 20,
			},
			{
				id: 'mail.task-pass',
				title: 'Пропуск письма из задачи',
				sortOrder: 30,
			},
			{
				id: 'mail.chain',
				title: 'Экран переписки',
				sortOrder: 40,
			},
			{
				id: 'mail.compose',
				title: 'Экран написания письма',
				sortOrder: 50,
			},
			{
				id: 'mail.large-attachment',
				title: 'Heavy attachments',
				sortOrder: 60,
			},
			{
				id: 'mail.message',
				title: 'Письмо',
				sortOrder: 70,
			},
			{
				id: 'mail.conversation-grid',
				title: 'Цепочки писем',
				sortOrder: 80,
			},
			{
				id: 'mail.delete-permission',
				title: 'Право на удаление писем',
				sortOrder: 90,
			},
		],
		tests: [
			{
				id: 'mail.signatures.model-api',
				title: 'Подписи',
				extensionName: 'mail:testing/tests/signatures',
				featureIds: ['mail.signatures'],
				basic: false,
				sortOrder: 10,
			},
			{
				id: 'mail.favorites.state',
				title: 'Состояние избранного',
				extensionName: 'mail:testing/tests/favorites',
				featureIds: ['mail.favorites'],
				basic: false,
				sortOrder: 20,
			},
			{
				id: 'mail.task-pass.message-route',
				title: 'Маршрут письма с пропуском',
				extensionName: 'mail:testing/tests/task-pass/message-route',
				featureIds: ['mail.task-pass'],
				basic: false,
				sortOrder: 30,
			},
			{
				id: 'mail.task-pass.chain-token',
				title: 'Пропуск в запросах переписки',
				extensionName: 'mail:testing/tests/task-pass/chain-token',
				featureIds: ['mail.task-pass'],
				basic: false,
				sortOrder: 40,
			},
			{
				id: 'mail.task-pass.screen-params',
				title: 'Параметры экрана письма',
				extensionName: 'mail:testing/tests/task-pass/screen-params',
				featureIds: ['mail.task-pass'],
				basic: false,
				sortOrder: 50,
			},
			{
				id: 'mail.chain.icons',
				title: 'Иконки экрана переписки',
				extensionName: 'mail:testing/tests/chain/icons',
				featureIds: ['mail.chain'],
				basic: false,
				sortOrder: 60,
			},
			{
				id: 'mail.compose.widget',
				title: 'Открытие экрана написания',
				extensionName: 'mail:testing/tests/opener/compose-widget',
				featureIds: ['mail.compose'],
				basic: false,
				sortOrder: 70,
			},
			{
				id: 'mail.compose.send-contract',
				title: 'Контракт отправки письма',
				extensionName: 'mail:testing/tests/draft-send',
				featureIds: ['mail.compose'],
				basic: false,
				sortOrder: 75,
			},
			{
				id: 'mail.large-attachment.compose',
				title: 'Heavy attachments',
				extensionName: 'mail:testing/tests/large-attachment',
				featureIds: ['mail.large-attachment'],
				basic: false,
				sortOrder: 80,
			},
			{
				id: 'mail.chain.quote',
				title: 'Цитата ответа на экране переписки',
				extensionName: 'mail:testing/tests/chain/quote',
				featureIds: ['mail.chain'],
				basic: false,
				sortOrder: 65,
			},
			{
				id: 'mail.message.theme-request',
				title: 'Оформление в запросе за телом',
				extensionName: 'mail:testing/tests/message-theme-request',
				featureIds: ['mail.message'],
				basic: false,
				sortOrder: 90,
			},
			{
				id: 'mail.conversation-grid.scenario',
				title: 'Цепочки писем',
				extensionName: 'mail:testing/tests/conversation-grid',
				featureIds: ['mail.conversation-grid'],
				basic: false,
				sortOrder: 100,
			},
			{
				id: 'mail.delete-permission.surfaces',
				title: 'Поверхности удаления письма',
				extensionName: 'mail:testing/tests/delete-permission',
				featureIds: ['mail.delete-permission'],
				basic: false,
				sortOrder: 110,
			},
		],
	});

	module.exports = {};
});
