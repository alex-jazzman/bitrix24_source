<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => 'dist/resources-service.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'booking.const',
		'booking.core',
		'booking.lib.api-client',
		'booking.lib.utils',
	],
	'skip_core' => true,
];
