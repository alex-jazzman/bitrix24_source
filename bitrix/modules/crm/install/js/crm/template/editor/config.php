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
		'main.core.events',
		'ui.design-tokens',
		'ui.entity-selector',
		'ui.notification',
		'ui.progressbar',
		'crm_common',
		'main.popup',
		'ui.buttons',
		'main.core',
	],
	'skip_core' => false,
];
