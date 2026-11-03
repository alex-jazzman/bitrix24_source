<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
    die();
}

return [
    'js' => './dist/editor-vibeoffice.bundle.js',
    'rel' => [
		'disk.document-header',
		'main.core',
		'main.core.events',
		'pull.client',
		'ui.a11y',
	],
    'skip_core' => false,
];
