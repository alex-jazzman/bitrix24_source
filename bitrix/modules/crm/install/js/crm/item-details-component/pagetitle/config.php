<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/pagetitle.bundle.css',
	'js' => 'dist/pagetitle.bundle.js',
	'rel' => [
		'crm.category-model',
		'main.core',
		'main.core.events',
		'main.popup',
		'ui.design-tokens',
		'ui.dialogs.messagebox',
		'ui.notification',
	],
	'skip_core' => false,
];
