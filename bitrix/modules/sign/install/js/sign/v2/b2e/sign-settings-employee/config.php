<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/sign-settings-employee.bundle.css',
	'js' => 'dist/sign-settings-employee.bundle.js',
	'rel' => [
		'main.core',
		'main.core.cache',
		'main.core.events',
		'main.loader',
		'sign.v2.analytics',
		'sign.v2.b2e.start-process',
		'sign.v2.b2e.submit-document-info',
		'sign.v2.helper',
		'ui.wizard',
	],
	'skip_core' => false,
];