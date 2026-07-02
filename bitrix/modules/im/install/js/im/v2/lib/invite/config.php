<?
if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => [
		'./dist/invite.bundle.js',
	],
	'rel' => [
		'im.v2.application.core',
		'im.v2.lib.notifier',
		'main.core',
		'main.sidepanel',
	],
	'skip_core' => false,
];