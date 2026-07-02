<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/permission-checker.bundle.css',
	'js' => 'dist/permission-checker.bundle.js',
	'rel' => [
		'crm.stage-model',
		'main.core',
		'ui.notification',
	],
	'skip_core' => false,
];