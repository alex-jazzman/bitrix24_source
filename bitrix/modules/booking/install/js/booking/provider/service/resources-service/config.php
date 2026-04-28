<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => 'dist/resources-service.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'booking.lib.utils',
		'booking.core',
		'booking.const',
		'booking.lib.api-client',
	],
	'skip_core' => true,
];
