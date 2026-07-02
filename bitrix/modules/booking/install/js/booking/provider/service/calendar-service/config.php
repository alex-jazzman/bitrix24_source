<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => 'dist/calendar-service.bundle.js',
	'rel' => [
		'booking.const',
		'booking.core',
		'booking.lib.api-client',
		'booking.lib.booking-filter',
		'main.core',
	],
	'skip_core' => false,
];
