<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/otp.bundle.css',
	'js' => 'dist/otp.bundle.js',
	'rel' => [
		'main.core',
		'pull.client',
		'ui.analytics',
		'ui.icon-set.api.core',
		'ui.system.typography.vue',
		'ui.vue3',
		'ui.vue3.components.button',
		'ui.vue3.pinia',
	],
	'skip_core' => false,
];
