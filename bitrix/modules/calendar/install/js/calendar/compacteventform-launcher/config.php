<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => 'dist/compacteventform-launcher.bundle.js',
	'rel' => [
		'calendar.compacteventform',
		'calendar.entry',
		'calendar.sectionmanager',
		'calendar.util',
		'main.core',
	],
	'skip_core' => false,
	'lang' => BX_ROOT . '/modules/calendar/classes/general/calendar_js.php',
];
