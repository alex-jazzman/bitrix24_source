<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => 'dist/date-period.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'booking.const',
		'booking.core',
	],
	'skip_core' => true,
];
