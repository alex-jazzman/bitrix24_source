<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/annual-summary.bundle.css',
	'js' => 'dist/annual-summary.bundle.js',
	'rel' => [
		'ui.analytics',
		'ui.avatar',
		'ui.buttons',
		'landing.imagecompressor',
		'landing.screenshoter',
		'main.popup',
		'main.core',
		'ui.fonts.montserrat',
	],
	'skip_core' => false,
];
