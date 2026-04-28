<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/disable-alert.bundle.css',
	'js' => 'dist/disable-alert.bundle.js',
	'rel' => [
		'ui.design-tokens',
		'ui.design-tokens.air',
		'ui.dialogs.messagebox',
		'ui.notification',
		'ui.buttons',
		'crm.router',
		'main.core',
		'ui.analytics',
		'crm.integration.analytics',
	],
	'skip_core' => false,
];
