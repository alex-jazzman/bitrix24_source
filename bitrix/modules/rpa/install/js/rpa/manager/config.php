<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => [
		'/bitrix/js/rpa/manager/src/common.css'
	],
	'js' => '/bitrix/js/rpa/manager/dist/manager.bundle.js',
	'rel' => [
		'main.core',
		'main.core.events',
		'sidepanel',
		'ui.design-tokens',
		'ui.fonts.opensans',
	],
	'skip_core' => false,
];
