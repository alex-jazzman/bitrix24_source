<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/drum.bundle.css',
	'js' => 'dist/drum.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'booking.component.button',
		'ui.date-picker',
	],
	'skip_core' => true,
];
