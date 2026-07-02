<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/remove-wait-list-item.bundle.css',
	'js' => 'dist/remove-wait-list-item.bundle.js',
	'rel' => [
		'booking.const',
		'booking.core',
		'booking.provider.service.wait-list-service',
		'main.core',
		'ui.notification',
	],
	'skip_core' => false,
];
