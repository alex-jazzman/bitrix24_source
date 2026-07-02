<?
if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => [
		'./dist/progressbar.bundle.js',
	],
	'rel' => [
		'im.v2.const',
		'main.core',
		'main.core.events',
		'ui.progressbarjs.uploader',
	],
	'skip_core' => false,
];