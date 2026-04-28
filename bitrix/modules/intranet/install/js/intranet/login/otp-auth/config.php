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
		'pull.client',
		'main.core',
		'ui.vue3.components.button',
		'ui.icon-set.api.core',
		'ui.analytics',
		'ui.vue3.pinia',
		'ui.system.typography.vue',
	],
	'skip_core' => false,
];
