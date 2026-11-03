<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/clue.bundle.css',
	'js' => 'dist/clue.bundle.js',
	'rel' => [
		'main.core',
		'spotlight',
		'ui.banner-dispatcher',
		'ui.tour',
	],
	'skip_core' => false,
	'settings' => [
		'copilotName' => \Bitrix\Tasks\Integration\AI\Settings::getCopilotName(),
	],
];
