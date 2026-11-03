<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/otp-info.bundle.css',
	'js' => 'dist/otp-info.bundle.js',
	'rel' => [
		'main.core',
		'main.date',
		'main.popup',
		'ui.alerts',
		'ui.analytics',
		'ui.buttons',
		'ui.icon-set.outline',
		'ui.system.typography',
	],
	'skip_core' => false,
];
