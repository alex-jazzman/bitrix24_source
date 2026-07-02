<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => '/bitrix/js/crm/type-model/dist/type-model.bundle.js',
	'rel' => [
		'crm.model',
		'main.core',
	],
	'skip_core' => false,
];