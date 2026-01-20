<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/setup-template.bundle.css',
	'js' => 'dist/setup-template.bundle.js',
	'rel' => [
		'pull.client',
		'ui.vue3',
		'main.core.events',
		'bizproc.rag-selector',
		'ui.entity-selector',
		'main.core',
		'ui.uploader.tile-widget',
		'ui.uploader.core',
		'ui.alerts',
		'ui.sidepanel-content',
		'ui.forms',
		'ui.layout-form',
	],
	'skip_core' => false,
];
