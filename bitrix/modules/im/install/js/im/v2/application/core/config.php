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
		'im.v2.application.launch',
		'im.v2.model',
		'im.v2.provider.pull',
		'imopenlines.v2.lib.launch-resources',
		'main.core',
		'pull.client',
		'rest.client',
		'ui.vue3',
		'ui.vue3.vuex',
	],
	'skip_core' => false,
	'settings' => [
		'isCloud' => \Bitrix\Main\ModuleManager::isModuleInstalled('bitrix24'),
	]
];