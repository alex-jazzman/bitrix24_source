<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
    die();
}

return [
    'js' => './dist/air-message-box.bundle.js',
    'css' => './dist/air-message-box.bundle.css',
    'rel' => [
		'main.core',
		'ui.dialogs.messagebox',
	],
    'skip_core' => false,
];
