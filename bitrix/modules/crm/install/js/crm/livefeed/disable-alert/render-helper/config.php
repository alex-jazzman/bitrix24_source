<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/render-helper.bundle.css',
	'js' => 'dist/render-helper.bundle.js',
	'rel' => [
		'main.core',
	],
	'skip_core' => false,
];