<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
    die();
}

return [
    'js' => './dist/record-indicator.bundle.js',
    'css' => './dist/record-indicator.bundle.css',
    'rel' => [
		'main.polyfill.core',
		'call.component.ui.icon',
		'ui.vue3',
	],
    'skip_core' => true,
];
