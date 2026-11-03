<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
    die();
}

return [
    'js' => './dist/sender-avatar-editor.bundle.js',
    'css' => './dist/sender-avatar-editor.bundle.css',
    'rel' => [
		'main.core',
		'ui.vue3',
	],
    'skip_core' => false,
];
