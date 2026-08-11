<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/rooms.bundle.css',
	'js' => 'dist/rooms.bundle.js',
	'rel' => [
		'calendar.controls',
		'calendar.sectioninterface',
		'calendar.util',
		'main.core',
		'main.core.events',
		'ui.dialogs.messagebox',
		'ui.entity-selector',
	],
	'skip_core' => false,
];