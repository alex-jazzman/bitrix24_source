<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/cardsform.bundle.css',
	'js' => 'dist/cardsform.bundle.js',
	'rel' => [
		'landing.loc',
		'landing.pageobject',
		'landing.ui.a11y',
		'landing.ui.collection.formcollection',
		'landing.ui.field.textfield',
		'landing.ui.form.baseform',
		'landing.ui.form.cardform',
		'landing.ui.panel.content',
		'main.core',
		'main.core.events',
		'ui.draganddrop.draggable',
	],
	'skip_core' => false,
];