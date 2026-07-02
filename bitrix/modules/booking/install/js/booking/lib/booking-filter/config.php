<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => 'dist/booking-filter.bundle.js',
	'rel' => [
		'booking.const',
		'booking.core',
		'main.core',
	],
	'skip_core' => false,
];
