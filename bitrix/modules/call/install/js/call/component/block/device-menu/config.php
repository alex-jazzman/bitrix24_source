<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
    die();
}

return [
    'js' => './dist/device-menu.bundle.js',
    'css' => './dist/device-menu.bundle.css',
    'rel' => [
		'main.polyfill.core',
		'call.component.ui.checkbox',
		'call.component.ui.icon',
		'call.component.ui.menu',
		'call.component.ui.popup',
		'call.component.ui.toggle',
		'ui.vue3',
	],
    'skip_core' => true,
];
