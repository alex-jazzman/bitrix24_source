<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => 'dist/analytics.bundle.js',
	'rel' => [
		'booking.const',
		'booking.core',
		'main.core',
		'ui.analytics',
	],
	'skip_core' => false,
];
