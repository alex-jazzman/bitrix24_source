<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => [
		'dist/compacteventform.bundle.css',
		'/bitrix/components/bitrix/calendar.grid/templates/.default/style.css',
	],
	'js' => 'dist/compacteventform.bundle.js',
	'rel' => [
		'calendar.controls',
		'calendar.entityrelation',
		'calendar.entry',
		'calendar.sectionmanager',
		'calendar.util',
		'main.core',
		'main.core.events',
		'main.popup',
		'ui.analytics',
		'ui.dialogs.messagebox',
	],
	'skip_core' => false,
	'lang' => BX_ROOT.'/modules/calendar/classes/general/calendar_js.php',
];
