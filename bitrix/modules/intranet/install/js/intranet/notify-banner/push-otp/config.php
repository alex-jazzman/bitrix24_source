<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/push-otp.bundle.css',
	'js' => 'dist/push-otp.bundle.js',
	'rel' => [
		'main.core',
		'ui.buttons',
		'ui.design-tokens',
		'ui.system.typography',
	],
	'skip_core' => false,
];
