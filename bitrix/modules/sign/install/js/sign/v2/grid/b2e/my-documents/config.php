<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/my-documents.bundle.css',
	'js' => 'dist/my-documents.bundle.js',
	'rel' => [
		'main.core',
		'main.core.events',
		'pull.client',
		'sign.v2.grid.components.action-panel',
	],
	'skip_core' => false,
];
