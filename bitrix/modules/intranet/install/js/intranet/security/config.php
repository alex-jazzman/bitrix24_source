<?
if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

return array(
	'css' => array(),
	'js' => array(
		'dist/security.bundle.js'
	),
	'rel' => [
		'main.core',
		'ui.analytics',
	],
	'skip_core' => false,
);