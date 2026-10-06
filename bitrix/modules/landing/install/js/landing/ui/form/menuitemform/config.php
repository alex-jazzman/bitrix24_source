<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/menuitemform.bundle.css',
	'js' => 'dist/menuitemform.bundle.js',
	'rel' => [
		'landing.loc',
		'landing.ui.form.baseform',
		'main.core',
		'ui.fonts.opensans',
	],
	'skip_core' => false,
];