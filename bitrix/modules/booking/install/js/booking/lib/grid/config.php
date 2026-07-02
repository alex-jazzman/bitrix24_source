<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => 'dist/grid.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'booking.const',
		'booking.core',
		'booking.lib.duration',
	],
	'skip_core' => true,
];
