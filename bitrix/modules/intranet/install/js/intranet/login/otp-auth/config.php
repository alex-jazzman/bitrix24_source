<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/otp.bundle.css',
	'js' => 'dist/otp.bundle.js',
	'rel' => [
		'ui.vue3',
		'main.core',
		'ui.system.typography.vue',
		'ui.analytics',
	],
	'skip_core' => false,
];
