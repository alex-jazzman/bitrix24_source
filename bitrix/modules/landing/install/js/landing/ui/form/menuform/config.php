<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/menuform.bundle.css',
	'js' => 'dist/menuform.bundle.js',
	'rel' => [
		'landing.env',
		'landing.loc',
		'landing.main',
		'landing.ui.a11y',
		'landing.ui.form.baseform',
		'landing.ui.form.menuitemform',
		'main.core',
		'ui.draganddrop.draggable',
	],
	'skip_core' => false,
];