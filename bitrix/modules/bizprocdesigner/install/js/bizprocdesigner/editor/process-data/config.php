<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => './dist/process-data.bundle.js',
	'css' => './dist/process-data.bundle.css',
	'rel' => [
		'bizprocdesigner.editor.chart',
		'main.core',
		'ui.a11y',
		'ui.buttons',
		'ui.icon-set.api.vue',
		'ui.system.alert',
		'ui.system.alert.vue',
		'ui.system.checkbox',
		'ui.system.dialog',
		'ui.system.input.vue',
		'ui.system.skeleton.vue',
		'ui.vue3',
		'ui.vue3.components.button',
	],
	'skip_core' => false,
];
