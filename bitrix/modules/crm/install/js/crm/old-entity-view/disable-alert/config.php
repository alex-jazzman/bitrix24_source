<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/disable-alert.bundle.css',
	'js' => 'dist/disable-alert.bundle.js',
	'rel' => [
		'crm.integration.analytics',
		'crm.router',
		'main.core',
		'ui.analytics',
		'ui.buttons',
		'ui.design-tokens',
		'ui.design-tokens.air',
		'ui.dialogs.messagebox',
		'ui.notification',
	],
	'skip_core' => false,
];
