<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
    die();
}

return [
    'js' => './dist/batch-upload.bundle.js',
    'css' => './dist/batch-upload.bundle.css',
    'rel' => [
		'main.core',
		'main.core.events',
		'main.popup',
		'ui.buttons',
		'ui.design-tokens.air',
		'ui.uploader.core',
		'ui.vue3',
	],
    'skip_core' => false,
];
