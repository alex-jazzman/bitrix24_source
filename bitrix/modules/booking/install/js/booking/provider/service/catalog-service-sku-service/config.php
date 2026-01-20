<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/catalog-service-sku-service.bundle.css',
	'js' => 'dist/catalog-service-sku-service.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'booking.core',
		'booking.lib.api-client',
	],
	'skip_core' => true,
];
