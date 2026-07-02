<?
if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

$counterDisplayLimit = null;

if (\Bitrix\Main\Loader::includeModule('im'))
{
	$counterDisplayLimit = \Bitrix\Im\V2\Message\Counter\CounterOverflowService::getOverflowValue();
}

return [
	'js' => [
		'./dist/counter.bundle.js',
	],
	'rel' => [
		'im.v2.application.core',
		'im.v2.const',
		'im.v2.lib.desktop',
		'im.v2.lib.logger',
		'main.core',
		'main.core.events',
	],
	'skip_core' => false,
	'settings' => [
		'counterDisplayLimit' => $counterDisplayLimit,
	],
];
