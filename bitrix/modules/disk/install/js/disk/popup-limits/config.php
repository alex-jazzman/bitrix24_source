<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'style.css',
	'js' => 'dist/popup-limits.bundle.js',
	'rel' => [
		'main.core',
		'main.popup',
		'ui.buttons',
	],
	'skip_core' => false,
];
