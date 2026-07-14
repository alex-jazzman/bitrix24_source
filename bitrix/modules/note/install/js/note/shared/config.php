<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
    die();
}

return [
    'js' => './dist/shared.bundle.js',
    'css' => './dist/shared.bundle.css',
    'rel' => [
		'main.core',
		'main.core.events',
		'note.sidebar',
		'note.ui.document-list',
		'ui.notification',
	],
    'skip_core' => false,
];
