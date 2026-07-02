<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/onboarding-popup.bundle.css',
	'js' => 'dist/onboarding-popup.bundle.js',
	'rel' => [
		'crm.integration.ui.banner-dispatcher',
		'main.core',
		'main.popup',
		'ui.buttons',
		'ui.design-tokens',
		'ui.icon-set.api.core',
		'ui.icon-set.api.vue',
		'ui.lottie',
		'ui.vue3',
	],
	'skip_core' => false,
];
