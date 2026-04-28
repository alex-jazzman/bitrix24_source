<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/crm-form-service.bundle.css',
	'js' => 'dist/crm-form-service.bundle.js',
	'rel' => [
		'main.core',
		'booking.core',
		'booking.const',
		'booking.lib.api-client',
		'booking.provider.service.resources-type-service',
		'booking.provider.service.resources-service',
		'booking.model.crm-form',
	],
	'skip_core' => false,
];
