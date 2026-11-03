<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/creation-menu.bundle.css',
	'js' => 'dist/creation-menu.bundle.js',
	'rel' => [
		'main.core',
		'main.popup',
		'ui.analytics',
	],
	'skip_core' => false,
];