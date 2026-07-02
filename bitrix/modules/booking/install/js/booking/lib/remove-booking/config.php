<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => 'dist/remove-booking.bundle.js',
	'rel' => [
		'booking.const',
		'booking.core',
		'booking.provider.service.booking-service',
		'main.core',
		'ui.notification',
	],
	'skip_core' => false,
];
