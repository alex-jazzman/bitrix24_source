<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
    die();
}

return [
    'js' => './dist/file-field.bundle.js',
    'css' => './dist/file-field.bundle.css',
    'rel' => [
		'main.core',
		'ui.design-tokens',
		'ui.uploader.core',
		'ui.uploader.tile-widget',
	],
    'skip_core' => false,
];
