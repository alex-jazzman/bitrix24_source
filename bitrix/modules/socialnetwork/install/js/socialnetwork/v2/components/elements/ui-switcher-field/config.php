<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/ui-switcher-field.bundle.css',
	'js' => 'dist/ui-switcher-field.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'socialnetwork.v2.components.elements.question-mark',
		'ui.switcher',
		'ui.system.typography.vue',
		'ui.vue3',
		'ui.vue3.components.switcher',
	],
	'skip_core' => true,
];
