<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/hcm-link-company-selector.bundle.css',
	'js' => 'dist/hcm-link-company-selector.bundle.js',
	'rel' => [
		'humanresources.hcmlink.company-connect-page',
		'main.core',
		'main.core.events',
		'sign.v2.api',
		'ui.entity-selector',
	],
	'skip_core' => false,
];