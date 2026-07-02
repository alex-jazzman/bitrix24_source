<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => 'dist/deal-helper.bundle.js',
	'rel' => [
		'booking.const',
		'booking.core',
		'booking.provider.service.booking-service',
		'booking.provider.service.main-page-service',
		'booking.provider.service.wait-list-service',
		'main.core',
		'main.sidepanel',
	],
	'skip_core' => false,
];
