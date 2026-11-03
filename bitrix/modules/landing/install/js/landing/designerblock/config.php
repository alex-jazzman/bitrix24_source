<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

$pathLang = BX_ROOT . '/modules/landing/lang/' . LANGUAGE_ID;

return [
	'css' => 'dist/designerblock.bundle.css',
	'js' => 'dist/designerblock.bundle.js',
	'rel' => [
		'landing.backend',
		'landing.env',
		'landing.metrika',
		'landing.ui.a11y',
		'landing.ui.highlight',
		'landing.loc',
		'landing.ui.panel.content',
		'main.core',
		'ui.fonts.opensans',
	],
	'lang' => $pathLang . '/js/designerblock.php',
	'skip_core' => false,
];
