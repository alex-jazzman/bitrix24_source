<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/toolbar-component.bundle.css',
	'js' => 'dist/toolbar-component.bundle.js',
	'rel' => [
		'crm.client-selector',
		'crm.router',
		'main.core',
		'main.core.events',
		'main.popup',
		'pull.client',
		'ui.buttons',
		'ui.dialogs.messagebox',
		'ui.hint',
		'ui.navigationpanel',
		'ui.tour',
	],
	'skip_core' => false,
];
