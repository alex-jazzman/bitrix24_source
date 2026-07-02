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
		'sign.type',
		'sign.v2.api',
		'ui.notification',
		'ui.sidepanel-content',
	],
	'skip_core' => false,
];
