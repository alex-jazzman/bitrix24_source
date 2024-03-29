<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/stepprocessing.bundle.css',
	'js' => 'dist/stepprocessing.bundle.js',
	'rel' => [
		'ui.design-tokens',
		'ui.progressbar',
		'main.core.events',
		'main.popup',
		'ui.alerts',
		'ui.buttons',
		'main.core',
	],
	'skip_core' => false,
];
