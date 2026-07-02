<?
if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => [
		'./dist/user.bundle.js',
	],
	'rel' => [
		'im.v2.application.core',
		'im.v2.const',
		'main.core',
	],
	'skip_core' => false,
];