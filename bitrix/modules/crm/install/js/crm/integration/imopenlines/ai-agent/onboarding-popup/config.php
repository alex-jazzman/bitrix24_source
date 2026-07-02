<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
    die();
}

return [
    'js' => './dist/onboarding-popup.bundle.js',
    'css' => './dist/onboarding-popup.bundle.css',
    'rel' => [
		'bizproc.setup-template',
		'crm.integration.ui.banner-dispatcher',
		'main.core',
		'main.popup',
		'ui.buttons',
		'ui.design-tokens',
		'ui.icon-set.api.core',
	],
    'skip_core' => false,
];
