<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
    die();
}

return [
    'js' => './dist/confirm-modal.bundle.js',
    'css' => './dist/confirm-modal.bundle.css',
    'rel' => [
		'main.polyfill.core',
		'call.component.ui.modal',
		'ui.vue3',
	],
    'skip_core' => true,
];
