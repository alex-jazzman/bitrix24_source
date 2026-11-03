<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
    die();
}

return [
    'js' => './dist/deadline-aha.bundle.js',
    'css' => './dist/deadline-aha.bundle.css',
    'rel' => [
		'main.core',
		'main.core.events',
		'main.popup',
		'tasks.v2.lib.onboarding-banners',
		'ui.icon-set.api.core',
		'ui.icon-set.outline',
	],
    'skip_core' => false,
];
