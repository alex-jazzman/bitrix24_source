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
		'call.lib.call-manager',
		'main.core',
	],
	'skip_core' => false,
	'settings' => [
		'callInstalled' => \Bitrix\Main\ModuleManager::isModuleInstalled('call'),
	],
];