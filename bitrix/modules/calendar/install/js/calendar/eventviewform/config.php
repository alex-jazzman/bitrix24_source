<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => [
		'/bitrix/js/calendar/cal-style.css',
		'/bitrix/js/calendar/new/calendar.css',
		'/bitrix/components/bitrix/calendar.grid/templates/.default/style.css',
	],
	'js' => 'dist/eventviewform.bundle.js',
	'rel' => [
		'calendar.controls',
		'calendar.entityrelation',
		'calendar.entry',
		'calendar.planner',
		'calendar.sectionmanager',
		'calendar.util',
		'main.core',
		'main.core.events',
		'main.date',
		'ui.avatar',
		'ui.vue3',
		'viewer',
	],
	'skip_core' => false,
	'lang' => '/bitrix/modules/calendar/classes/general/calendar_js.php'
];
