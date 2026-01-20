<?
if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => [
		'./dist/call.bundle.js',
	],
	'rel' => [
		'main.core',
		'call.lib.call-manager',
	],
	'skip_core' => false,
	'settings' => [
		'callInstalled' => \Bitrix\Main\ModuleManager::isModuleInstalled('call'),
	],
];