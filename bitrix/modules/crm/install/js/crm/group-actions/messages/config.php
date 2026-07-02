<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/messages.bundle.css',
	'js' => 'dist/messages.bundle.js',
	'rel' => [
		'crm.autorun',
		'crm.integration.analytics',
		'main.core',
		'main.core.events',
		'main.popup',
		'ui.design-tokens',
		'ui.entity-catalog',
		'ui.notification',
	],
	'skip_core' => false,
];