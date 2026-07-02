<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/wait-list-service.bundle.css',
	'js' => 'dist/wait-list-service.bundle.js',
	'rel' => [
		'booking.const',
		'booking.core',
		'booking.lib.api-client',
		'booking.provider.service.client-service',
		'booking.provider.service.main-page-service',
		'main.core',
	],
	'skip_core' => false,
];
