<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/filter-result-navigator.bundle.css',
	'js' => 'dist/filter-result-navigator.bundle.js',
	'rel' => [
		'booking.const',
		'booking.core',
		'booking.lib.duration',
		'booking.lib.remove-resource',
		'booking.lib.utils',
		'booking.provider.service.calendar-service',
		'main.core',
	],
	'skip_core' => false,
];
