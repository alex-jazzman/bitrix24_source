<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/faces.bundle.css',
	'js' => 'dist/faces.bundle.js',
	'rel' => [
		'ui.vue3',
		'main.core.events',
		'main.date',
		'ui.tooltip',
		'bizproc.workflow.faces.summary',
		'main.core',
		'ui.design-tokens',
		'ui.icons',
		'ui.icon-set.main',
	],
	'skip_core' => false,
];
