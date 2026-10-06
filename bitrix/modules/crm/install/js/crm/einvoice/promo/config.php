<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/promo.bundle.css',
	'js' => 'dist/promo.bundle.js',
	'rel' => [
		'crm.integration.analytics',
		'main.core',
		'main.popup',
		'ui.analytics',
		'ui.buttons',
		'ui.design-tokens',
		'ui.icon-set.api.core',
		'ui.icon-set.outline',
	],
	'skip_core' => false,
];
