<?php

use Bitrix\Booking\Internals\Integration\Calendar\Schedule;
use Bitrix\Main\Loader;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

$schedule = null;
if (Loader::includeModule('booking'))
{
	$schedule = Schedule::getRange();
}

return [
	'js' => 'dist/core.bundle.js',
	'rel' => [
		'booking.model.bookings',
		'booking.model.clients',
		'booking.model.counters',
		'booking.model.dictionary',
		'booking.model.favorites',
		'booking.model.filter',
		'booking.model.interface',
		'booking.model.main-resources',
		'booking.model.message-status',
		'booking.model.notifications',
		'booking.model.resource-types',
		'booking.model.resources',
		'booking.model.sale-channels',
		'booking.model.sku',
		'booking.model.wait-list',
		'booking.provider.pull.booking-pull-manager',
		'main.core',
		'ui.vue3.vuex',
	],
	'skip_core' => false,
	'settings' => [
		'schedule' => [
			'fromHour' => $schedule?->getFromAsHours() ?? 9,
			'toHour' => $schedule?->getToAsHours() ?? 19,
		],
	],
];
