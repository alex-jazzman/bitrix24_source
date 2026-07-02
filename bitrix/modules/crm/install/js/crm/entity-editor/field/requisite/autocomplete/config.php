<?
if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

return array(
	"js" => "dist/autocomplete.bundle.js",
	"css" => "dist/autocomplete.bundle.css",
	'rel' => [
		'crm.placement.detailsearch',
		'main.core',
		'main.core.events',
		'main.loader',
		'ui.buttons',
		'ui.common',
		'ui.design-tokens',
		'ui.dialogs.messagebox',
		'ui.dropdown',
		'ui.feedback.form',
		'ui.forms',
		'ui.notification.center',
	],
	'skip_core' => false,
);