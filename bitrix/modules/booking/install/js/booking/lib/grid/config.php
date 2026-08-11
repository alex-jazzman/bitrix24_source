<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => 'dist/grid.bundle.js',
	'rel' => [
		'booking.const',
		'booking.core',
		'booking.lib.duration',
		'main.core',
	],
	'skip_core' => false,
];
