<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/menu.bundle.css',
	'js' => 'dist/menu.bundle.js',
	'rel' => [
		'landing.backend',
		'landing.env',
		'landing.loc',
		'landing.main',
		'landing.menu.menuitem',
		'landing.ui.form.menuform',
		'landing.ui.panel.stylepanel',
		'main.core',
	],
	'skip_core' => false,
];