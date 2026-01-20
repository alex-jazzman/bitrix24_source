<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/templates-button.bundle.css',
	'js' => 'dist/templates-button.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'ui.vue3.components.button',
		'tasks.v2.const',
		'tasks.v2.lib.entity-selector-dialog',
	],
	'skip_core' => true,
];
