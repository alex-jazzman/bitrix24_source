<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/parser.bundle.css',
	'js' => 'dist/parser.bundle.js',
	'rel' => [
		'main.core',
		'ui.bbcode.ast-processor',
		'ui.bbcode.encoder',
		'ui.bbcode.model',
		'ui.linkify',
	],
	'skip_core' => false,
];