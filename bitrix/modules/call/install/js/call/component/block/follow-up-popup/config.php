<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
    die();
}

return [
    'js' => './dist/follow-up-popup.bundle.js',
    'css' => './dist/follow-up-popup.bundle.css',
    'rel' => [
		'main.polyfill.core',
		'call.component.ui.button',
		'call.component.ui.icon',
		'call.component.ui.popup',
		'ui.vue3',
	],
    'skip_core' => true,
];
