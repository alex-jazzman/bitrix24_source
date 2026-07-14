<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
    die();
}

return [
    'js' => './dist/delete-project-popup.bundle.js',
    'css' => './dist/delete-project-popup.bundle.css',
    'rel' => [
		'main.core',
		'main.popup',
		'ui.buttons',
		'ui.dialogs.messagebox',
		'ui.icon-set.api.core',
	],
    'skip_core' => false,
];
