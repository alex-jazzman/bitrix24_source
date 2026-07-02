<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => 'dist/main-page-service.bundle.js',
	'rel' => [
		'booking.const',
		'booking.core',
		'booking.lib.api-client',
		'booking.lib.date-period',
		'booking.lib.resources-date-cache',
		'booking.provider.service.booking-service',
		'booking.provider.service.client-service',
		'booking.provider.service.resources-service',
		'booking.provider.service.resources-type-service',
		'booking.provider.service.wait-list-service',
		'main.core',
		'main.core.cache',
	],
	'skip_core' => false,
];
