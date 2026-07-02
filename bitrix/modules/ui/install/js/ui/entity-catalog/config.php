<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/entity-catalog.bundle.css',
	'js' => 'dist/entity-catalog.bundle.js',
	'rel' => [
		'main.core',
		'main.core.events',
		'main.popup',
		'ui.advice',
		'ui.cnt',
		'ui.feedback.form',
		'ui.forms',
		'ui.icons',
		'ui.vue3',
		'ui.vue3.components.counter',
		'ui.vue3.components.hint',
		'ui.vue3.pinia',
	],
	'skip_core' => false,
];