<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/sender-selector.bundle.css',
	'js' => 'dist/sender-selector.bundle.js',
	'rel' => [
		'main.core',
		'main.loader',
		'ui.entity-selector',
		'ui.icon-set.actions',
		'ui.icon-set.api.core',
		'ui.mail.provider-showcase',
		'ui.mail.sender-editor',
	],
	'skip_core' => false,
];