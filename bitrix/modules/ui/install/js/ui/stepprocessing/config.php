<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/stepprocessing.bundle.css',
	'js' => 'dist/stepprocessing.bundle.js',
	'rel' => [
		'main.core',
		'main.core.events',
		'main.popup',
		'ui.alerts',
		'ui.buttons',
		'ui.design-tokens',
		'ui.progressbar',
	],
	'skip_core' => false,
];
