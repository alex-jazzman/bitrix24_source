<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => './dist/script-created-popup.bundle.js',
	'css' => './dist/script-created-popup.bundle.css',
	'rel' => [
		'crm.ai.name-service',
		'crm.integration.ui.banner-dispatcher',
		'crm.router',
		'main.core',
		'main.popup',
		'ui.buttons',
	],
	'skip_core' => false,
];
