<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/ui-field.bundle.css',
	'js' => 'dist/ui-field.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'socialnetwork.v2.components.elements.question-mark',
		'ui.vue3',
	],
	'skip_core' => true,
];
