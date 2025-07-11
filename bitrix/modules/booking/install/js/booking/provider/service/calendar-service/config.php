<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => 'dist/calendar-service.bundle.js',
	'rel' => [
		'main.core',
		'booking.core',
		'booking.const',
		'booking.lib.api-client',
		'booking.lib.booking-filter',
	],
	'skip_core' => false,
];
