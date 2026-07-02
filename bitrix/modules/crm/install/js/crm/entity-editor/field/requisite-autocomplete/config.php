<?
if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

return array(
	"js" => "dist/requisite-autocomplete.bundle.js",
	'rel' => [
		'crm.entity-editor.field.requisite.autocomplete',
		'main.core',
		'main.core.events',
	],
	'skip_core' => false,
);