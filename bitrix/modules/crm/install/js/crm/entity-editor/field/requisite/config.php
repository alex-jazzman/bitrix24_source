<?
if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

return array(
	"css" => "dist/requisite.bundle.css",
	"js" => "dist/requisite.bundle.js",
	'rel' => [
		'crm.entity-editor',
		'crm.entity-editor.field.address',
		'crm.entity-editor.field.address.base',
		'crm.entity-editor.field.requisite.autocomplete',
		'crm_common',
		'main.core',
		'main.core.events',
		'main.loader',
		'main.popup',
		'ui.design-tokens',
		'ui.dialogs.messagebox',
		'ui.dropdown',
		'ui.entity-editor',
	],
	'skip_core' => false,
);