<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/yandex-integration-wizard-service.bundle.css',
	'js' => 'dist/yandex-integration-wizard-service.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'booking.const',
		'booking.core',
		'booking.lib.api-client',
		'booking.model.yandex-integration-wizard',
		'booking.provider.service.resources-service',
	],
	'skip_core' => true,
];
