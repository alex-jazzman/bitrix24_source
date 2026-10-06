<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
    die();
}

return [
	'js' => './dist/timeline-promo.bundle.js',
	'css' => './dist/timeline-promo.bundle.css',
	'rel' => [
		'crm.ai.name-service',
		'crm.integration.ui.banner-dispatcher',
		'crm.router',
		'main.core',
		'main.core.events',
		'main.popup',
		'ui.buttons',
	],
	'skip_core' => false,
];
