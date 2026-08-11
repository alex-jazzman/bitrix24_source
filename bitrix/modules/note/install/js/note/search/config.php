<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
    die();
}

return [
    'js' => './dist/search.bundle.js',
    'css' => './dist/search.bundle.css',
    'rel' => [
		'main.core',
		'note.analytics',
		'note.ui.document-list',
		'ui.notification',
	],
    'skip_core' => false,
];
