<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => 'dist/busy-slots.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'booking.const',
		'booking.core',
		'booking.lib.cell',
		'booking.lib.duration',
		'booking.lib.resources-date-cache',
		'booking.lib.slot-ranges',
		'booking.provider.service.resource-dialog-service',
	],
	'skip_core' => true,
];
