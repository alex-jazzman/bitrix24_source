<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/crm-form-service.bundle.css',
	'js' => 'dist/crm-form-service.bundle.js',
	'rel' => [
		'booking.const',
		'booking.core',
		'booking.lib.api-client',
		'booking.provider.service.resources-service',
		'booking.provider.service.resources-type-service',
		'main.core',
	],
	'skip_core' => false,
];
