<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

if (!\Bitrix\Main\Loader::includeModule('tasks'))
{
	return [];
}

return [
	'js' => 'dist/analytics.bundle.js',
	'rel' => [
		'main.core',
		'ui.analytics',
		'ui.uploader.core',
		'tasks.v2.const',
	],
	'skip_core' => false,
	'settings' => (new \Bitrix\Tasks\V2\Internal\Service\Extension\Config())->getAnalyticsSettings(),
];
