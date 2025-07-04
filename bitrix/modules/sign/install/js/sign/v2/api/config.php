<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/api.bundle.css',
	'js' => 'dist/api.bundle.js',
	'rel' => [
		'main.core',
		'ui.notification',
		'ui.sidepanel-content',
		'sign.v2.api',
		'sign.type',
	],
	'skip_core' => false,
];
