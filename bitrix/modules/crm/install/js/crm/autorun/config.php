<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/autorun.bundle.css',
	'js' => 'dist/autorun.bundle.js',
	'rel' => [
		'crm.integration.analytics',
		'main.core',
		'ui.analytics',
		'ui.design-tokens',
		'ui.dialogs.messagebox',
	],
	'skip_core' => false,
];
