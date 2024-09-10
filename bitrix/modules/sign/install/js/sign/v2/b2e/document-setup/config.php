<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/document-setup.bundle.css',
	'js' => 'dist/document-setup.bundle.js',
	'rel' => [
		'sign.v2.api',
		'ui.entity-selector',
		'sign.v2.document-setup',
		'main.core',
		'main.date',
		'sign.v2.helper',
	],
	'skip_core' => false,
];