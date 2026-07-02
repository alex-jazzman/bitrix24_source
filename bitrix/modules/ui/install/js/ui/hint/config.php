<?
if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	"css" => 'dist/ui.hint.bundle.css',
	'js' => 'dist/ui.hint.bundle.js',
	'rel' => [
		'main.core',
		'main.popup',
		'ui.icon-set.api.core',
		'ui.icon-set.main',
		'ui.icon-set.outline',
	],
	'skip_core' => false,
];
