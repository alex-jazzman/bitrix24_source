<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/sandbox.bundle.css',
	'js' => 'dist/sandbox.bundle.js',
	'rel' => [
		'ui.vue3',
		'crm.timeline.tools',
		'main.date',
		'ui.notification',
		'main.core',
		'ui.text-editor',
		'crm.vue3.dialog',
		'ui.forms',
		'ui.layout-form',
		'ui.design-tokens',
		'ui.design-tokens.air',
	],
	'skip_core' => false,
];
