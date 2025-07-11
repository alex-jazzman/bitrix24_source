<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => 'dist/drag.bundle.js',
	'rel' => [
		'main.core',
		'main.popup',
		'main.date',
		'ui.draganddrop.draggable',
		'booking.const',
		'booking.core',
		'booking.lib.busy-slots',
		'booking.lib.analytics',
		'booking.provider.service.booking-service',
	],
	'skip_core' => false,
];
