<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/entry.bundle.css',
	'js' => 'dist/entry.bundle.js',
	'rel' => [
		'calendar.compacteventform',
		'calendar.roomsmanager',
		'calendar.sectionmanager',
		'calendar.util',
		'main.core',
		'main.core.events',
		'ui.dialogs.messagebox',
		'ui.notification',
	],
	'skip_core' => false,
];