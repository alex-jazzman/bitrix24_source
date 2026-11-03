<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/tour.bundle.css',
	'js' => 'dist/tour.bundle.js',
	'rel' => [
		'main.core',
		'main.core.events',
		'main.popup',
		'ui.design-tokens',
	],
	'skip_core' => false,
];
