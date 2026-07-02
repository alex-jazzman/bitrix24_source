<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => 'dist/booking-service.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'booking.lib.date-period',
		'booking.lib.duration',
	],
	'skip_core' => true,
];
