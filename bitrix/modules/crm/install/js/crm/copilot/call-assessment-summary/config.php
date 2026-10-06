<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/call-assessment-summary.bundle.css',
	'js' => 'dist/call-assessment-summary.bundle.js',
	'rel' => [
		'main.core',
		'ui.design-tokens.air',
		'ui.entity-selector',
		'ui.system.chip.vue',
		'ui.system.input.vue',
		'ui.system.typography.vue',
		'ui.vue3',
		'ui.vue3.components.button',
		'ui.vue3.components.switcher',
	],
	'skip_core' => false,
];
