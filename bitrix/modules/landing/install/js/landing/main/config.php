<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/main.bundle.css',
	'js' => 'dist/main.bundle.js',
	'rel' => [
		'landing.backend',
		'landing.env',
		'landing.loc',
		'landing.pageobject',
		'landing.sliderhacks',
		'landing.ui.a11y',
		'landing.ui.panel.content',
		'landing.ui.panel.floatingnodepanel',
		'landing.ui.panel.saveblock',
		'main.core',
		'main.core.events',
	],
	'skip_core' => false,
];