<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
    die();
}

return [
    'js' => './dist/deadlineless-hint.bundle.js',
    'css' => './dist/deadlineless-hint.bundle.css',
    'rel' => [
		'main.core',
		'main.core.events',
		'main.popup',
		'tasks.v2.const',
		'tasks.v2.lib.onboarding-banners',
		'ui.auto-launch',
	],
    'skip_core' => false,
];
