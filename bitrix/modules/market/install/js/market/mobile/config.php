<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => 'dist/application.bundle.js',
	'css' => 'dist/application.bundle.css',
	'rel' => [
		'main.core',
		'market.mobile.bridge',
		'market.mobile.detail',
		'ui.vue3',
	],
	'skip_core' => false,
];
