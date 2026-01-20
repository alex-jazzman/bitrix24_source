<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/otp-info.bundle.css',
	'js' => 'dist/otp-info.bundle.js',
	'rel' => [
		'ui.buttons',
		'ui.analytics',
		'main.popup',
		'main.core',
		'main.date',
		'ui.system.typography',
		'ui.icon-set.outline',
		'ui.alerts',
	],
	'skip_core' => false,
];
