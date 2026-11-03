<?php

use Bitrix\Tasks\Integration\Calendar\Schedule\PortalSchedule;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/notification.bundle.css',
	'js' => 'dist/notification.bundle.js',
	'rel' => [
		'main.core',
		'main.core.events',
		'main.date',
		'main.popup',
		'tasks.date-rounder',
		'tasks.interval-selector',
		'ui.analytics',
		'ui.buttons',
		'ui.date-picker',
		'ui.form-elements.view',
	],
	'settings' => [
		'portalSettings' => (new PortalSchedule())->getSettings(),
	],
	'skip_core' => false,
];
