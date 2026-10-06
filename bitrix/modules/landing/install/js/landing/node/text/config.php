<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/text.bundle.css',
	'js' => 'dist/text.bundle.js',
	'rel' => [
		'landing.node.base',
		'landing.node.tableeditor',
		'main.core',
	],
	'skip_core' => false,
];