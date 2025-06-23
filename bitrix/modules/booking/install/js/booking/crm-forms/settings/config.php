<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => 'dist/settings.bundle.js',
	'css' => 'dist/settings.bundle.css',
	'rel' => [
		'main.core.events',
		'booking.provider.service.crm-form-service',
		'booking.const',
		'ui.entity-selector',
		'main.core',
	],
	'skip_core' => false,
];
