<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/resourcebookinguserfield.bundle.css',
	'js' => 'dist/resourcebookinguserfield.bundle.js',
	'rel' => [
		'calendar.resourcebooking',
		'calendar.resourcebookinguserfield',
		'helper',
		'main.core',
		'main.core.events',
		'main.popup',
		'ui.entity-selector',
	],
	'lang' => BX_ROOT.'/modules/calendar/lib/userfield/resourcebooking.php',
	'skip_core' => false,
];