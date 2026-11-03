<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/errorbox.bundle.css',
	'js' => 'dist/errorbox.bundle.js',
	'rel' => [
		'main.core',
		'ui.alerts',
		'ui.buttons',
	],
	'skip_core' => false,
];