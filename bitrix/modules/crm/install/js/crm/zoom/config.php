<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/zoom.bundle.css',
	'js' => 'dist/zoom.bundle.js',
	'rel' => [
		'calendar.planner',
		'calendar.util',
		'main.core',
		'main.core.events',
	],
	'skip_core' => false,
];
