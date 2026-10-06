<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
    die();
}

return [
    'js' => './dist/assign-menu.bundle.js',
    'css' => './dist/assign-menu.bundle.css',
    'rel' => [
		'mail.label.core',
		'main.core',
		'ui.a11y',
		'ui.entity-selector',
		'ui.notification',
	],
    'skip_core' => false,
];
