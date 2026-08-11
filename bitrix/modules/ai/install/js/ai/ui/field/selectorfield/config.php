<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/selectorfield.bundle.css',
	'js' => 'dist/selectorfield.bundle.js',
	'rel' => [
		'main.core',
		'types.js',
		'ui.form-elements.view',
	],
	'skip_core' => false,
];