<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/sandbox.bundle.css',
	'js' => 'dist/sandbox.bundle.js',
	'rel' => [
		'crm.timeline.tools',
		'crm.vue3.dialog',
		'main.core',
		'main.date',
		'ui.design-tokens',
		'ui.design-tokens.air',
		'ui.forms',
		'ui.layout-form',
		'ui.notification',
		'ui.text-editor',
		'ui.vue3',
	],
	'skip_core' => false,
];
