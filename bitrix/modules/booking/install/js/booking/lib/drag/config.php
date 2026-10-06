<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => 'dist/drag.bundle.js',
	'rel' => [
		'booking.component.non-draggable-booking-popup',
		'booking.const',
		'booking.core',
		'booking.lib.analytics',
		'booking.lib.busy-slots',
		'booking.lib.duration',
		'booking.lib.is-real-id',
		'booking.lib.limit',
		'booking.provider.service.booking-service',
		'booking.provider.service.wait-list-service',
		'main.core',
		'main.date',
		'main.popup',
		'ui.draganddrop.draggable',
	],
	'skip_core' => false,
];
