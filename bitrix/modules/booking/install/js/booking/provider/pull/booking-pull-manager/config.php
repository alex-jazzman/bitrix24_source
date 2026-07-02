<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => 'dist/booking-pull-manager.bundle.js',
	'rel' => [
		'booking.const',
		'booking.core',
		'booking.provider.service.booking-service',
		'booking.provider.service.calendar-service',
		'booking.provider.service.client-service',
		'booking.provider.service.counters-service',
		'booking.provider.service.main-page-service',
		'booking.provider.service.resources-service',
		'booking.provider.service.resources-type-service',
		'booking.provider.service.wait-list-service',
		'main.core',
		'pull.queuemanager',
	],
	'skip_core' => false,
];
