<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => './dist/promo-popup.bundle.js',
	'css' => './dist/promo-popup.bundle.css',
	'rel' => [
		'crm.ai.name-service',
		'crm.integration.ui.banner-dispatcher',
		'main.core',
		'main.popup',
		'ui.buttons',
	],
	'skip_core' => false,
];
