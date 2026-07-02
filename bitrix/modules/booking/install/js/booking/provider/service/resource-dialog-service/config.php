<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => 'dist/resource-dialog-service.bundle.js',
	'rel' => [
		'booking.const',
		'booking.core',
		'booking.lib.api-client',
		'booking.lib.resources-date-cache',
		'booking.provider.service.booking-service',
		'booking.provider.service.client-service',
		'booking.provider.service.resources-service',
		'main.core',
	],
	'skip_core' => false,
];
