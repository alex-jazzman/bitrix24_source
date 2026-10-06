<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/cardform.bundle.css',
	'js' => 'dist/cardform.bundle.js',
	'rel' => [
		'landing.loc',
		'landing.ui.form.baseform',
		'main.core',
	],
	'skip_core' => false,
];