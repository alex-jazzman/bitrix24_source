<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/annual-summary.bundle.css',
	'js' => 'dist/annual-summary.bundle.js',
	'rel' => [
		'landing.imagecompressor',
		'landing.screenshoter',
		'main.core',
		'main.popup',
		'ui.analytics',
		'ui.avatar',
		'ui.buttons',
		'ui.fonts.montserrat',
	],
	'skip_core' => false,
];
