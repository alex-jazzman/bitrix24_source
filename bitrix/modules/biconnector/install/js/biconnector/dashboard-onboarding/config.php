<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
    die();
}

return [
    'js' => './dist/dashboard-onboarding.bundle.js',
    'css' => './dist/dashboard-onboarding.bundle.css',
    'rel' => [
		'main.core',
		'main.popup',
		'ui.a11y',
		'ui.design-tokens.air',
		'ui.system.typography',
	],
    'skip_core' => false,
];
