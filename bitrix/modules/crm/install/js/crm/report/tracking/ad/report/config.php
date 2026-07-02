<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/report.bundle.css',
	'js' => 'dist/report.bundle.js',
	'rel' => [
		'main.core',
		'main.core.events',
		'main.popup',
		'sidepanel',
		'ui.fonts.opensans',
		'ui.progressbar',
	],
	'skip_core' => false,
];