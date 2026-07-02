<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => './dist/document-list.bundle.js',
	'css' => './dist/document-list.bundle.css',
	'rel' => [
		'main.core',
		'main.date',
		'main.polyfill.intersectionobserver',
		'note.ui.loader',
		'ui.hint',
	],
	'skip_core' => false,
];
