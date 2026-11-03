<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => [
		'/bitrix/js/calendar/planner.css'
	],
	'js' => 'dist/planner.bundle.js',
	'rel' => [
		'calendar.ui.tools.draganddrop',
		'calendar.util',
		'main.core',
		'main.core.events',
		'main.date',
		'main.popup',
		'ui.avatar',
		'ui.info-helper',
	],
	'skip_core' => false,
	'lang' => '/bitrix/modules/calendar/classes/general/calendar_planner.php'
];
