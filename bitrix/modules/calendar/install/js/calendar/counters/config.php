<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/counters.bundle.css',
	'js' => 'dist/counters.bundle.js',
	'rel' => [
		'main.core',
		'main.core.events',
		'ui.counterpanel',
	],
	'skip_core' => false,
];