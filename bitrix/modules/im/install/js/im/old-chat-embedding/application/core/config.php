<?php
if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

if (!\Bitrix\Main\Loader::includeModule('im'))
{
	return [];
}

return [
	'js' => [
		'./dist/core.bundle.js',
	],
	'rel' => [
		'im.old-chat-embedding.application.launch',
		'im.old-chat-embedding.const',
		'im.old-chat-embedding.lib.logger',
		'im.old-chat-embedding.lib.smile-manager',
		'im.old-chat-embedding.lib.utils',
		'im.old-chat-embedding.model',
		'im.old-chat-embedding.provider.pull',
		'main.core',
		'pull.client',
		'rest.client',
		'ui.vue3',
		'ui.vue3.vuex',
	],
	'skip_core' => false,
	'settings' => ['v2' => !\Bitrix\Im\Settings::isLegacyChatActivated()]
];