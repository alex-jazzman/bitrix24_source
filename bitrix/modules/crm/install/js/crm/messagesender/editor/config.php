<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/editor.bundle.css',
	'js' => 'dist/editor.bundle.js',
	'rel' => [
		'crm.integration.analytics',
		'main.core',
		'main.core.events',
		'messageservice.message.editor',
		'ui.entity-selector',
		'ui.icon-set.api.vue',
	],
	'skip_core' => false,
];
