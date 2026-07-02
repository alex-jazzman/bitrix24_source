<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/popup.bundle.css',
	'js' => 'dist/popup.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'im.const',
		'ui.vue',
	],
	'skip_core' => true,
];