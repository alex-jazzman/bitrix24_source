<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/parser.bundle.css',
	'js' => 'dist/parser.bundle.js',
	'rel' => [
		'ui.bbcode.ast-processor',
		'ui.bbcode.encoder',
		'ui.linkify',
		'ui.bbcode.model',
		'main.core',
	],
	'skip_core' => false,
];