<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => './dist/currency-list.bundle.js',
	'rel' => [
		'main.core',
		'main.core.events',
		'main.sidepanel',
		'ui.a11y',
		'ui.buttons',
		'ui.notification',
		'ui.stepprocessing',
		'ui.system.dialog',
	],
	'skip_core' => false,
];
