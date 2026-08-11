<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/editor.bundle.css',
	'js' => 'dist/editor.bundle.js',
	'rel' => [
		'crm.entity-selector',
		'crm_common',
		'main.core',
		'main.core.events',
		'messageservice.template.editor',
		'ui.design-tokens',
	],
	'skip_core' => false,
];
