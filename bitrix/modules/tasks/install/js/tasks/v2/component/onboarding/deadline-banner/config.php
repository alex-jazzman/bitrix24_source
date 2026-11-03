<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
    die();
}

return [
    'js' => './dist/deadline-banner.bundle.js',
    'css' => './dist/deadline-banner.bundle.css',
    'rel' => [
		'main.polyfill.core',
		'tasks.v2.lib.onboarding-banners',
		'ui.icon-set.api.vue',
		'ui.icon-set.outline',
	],
    'skip_core' => true,
];
