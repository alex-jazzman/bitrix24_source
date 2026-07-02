<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => 'dist/aha-moments.bundle.js',
	'rel' => [
		'booking.const',
		'booking.core',
		'booking.provider.service.option-service',
		'main.core',
		'main.popup',
		'spotlight',
		'ui.auto-launch',
		'ui.banner-dispatcher',
		'ui.tour',
	],
	'skip_core' => false,
];
