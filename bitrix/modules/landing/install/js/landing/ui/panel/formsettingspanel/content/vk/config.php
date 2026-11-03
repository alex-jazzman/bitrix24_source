<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/vk.bundle.css',
	'js' => 'dist/vk.bundle.js',
	'rel' => [
		'crm.form.integration',
		'landing.loc',
		'landing.ui.card.basecard',
		'landing.ui.card.headercard',
		'landing.ui.card.messagecard',
		'landing.ui.panel.basepresetpanel',
		'main.core',
		'main.core.events',
	],
	'skip_core' => false,
];