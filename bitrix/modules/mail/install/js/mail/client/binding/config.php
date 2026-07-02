<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => 'dist/binding.bundle.js',
	'rel' => [
		'main.core',
		'main.core.events',
		'ui.notification',
	],
	'skip_core' => false,
];