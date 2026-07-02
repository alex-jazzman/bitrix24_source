<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => 'dist/booking-service.bundle.js',
	'rel' => [
		'booking.const',
		'booking.core',
		'booking.lib.api-client',
		'booking.lib.booking-filter',
		'booking.lib.date-period',
		'booking.lib.deep-to-raw',
		'booking.lib.request-revision-guard',
		'booking.provider.service.client-service',
		'booking.provider.service.main-page-service',
		'booking.provider.service.resources-service',
		'main.core',
	],
	'skip_core' => false,
];
