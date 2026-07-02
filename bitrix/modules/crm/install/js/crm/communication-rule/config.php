<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/communication-rule.bundle.css',
	'js' => 'dist/communication-rule.bundle.js',
	'rel' => [
		'main.core',
		'main.core.events',
		'main.popup',
		'ui.entity-selector',
		'ui.layout-form',
		'ui.vue3',
	],
	'skip_core' => false,
];
