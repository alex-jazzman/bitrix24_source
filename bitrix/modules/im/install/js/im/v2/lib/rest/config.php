<?
if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => [
		'./dist/rest.bundle.js',
	],
	'rel' => [
		'im.v2.application.core',
		'im.v2.const',
		'main.core',
		'main.core.events',
	],
	'skip_core' => false,
];