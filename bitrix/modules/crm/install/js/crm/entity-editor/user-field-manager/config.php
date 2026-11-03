<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
    die();
}

return [
    'js' => './dist/user-field-manager.bundle.js',
    'css' => './dist/user-field-manager.bundle.css',
    'rel' => [
		'main.core',
		'ui.entity-editor',
	],
    'skip_core' => false,
];
