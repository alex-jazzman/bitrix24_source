<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => './dist/editor.bundle.js',
	'css' => './dist/editor.bundle.css',
	'rel' => [
		'crm.stage.color',
		'crm.stage.description-tooltip',
		'crm.stage.entity-text',
		'main.core',
		'main.popup',
		'ui.a11y',
		'ui.buttons',
		'ui.dialogs.messagebox',
		'ui.hint',
		'ui.icon-set.api.core',
		'ui.icon-set.outline',
		'ui.notification',
		'ui.system.input',
		'ui.system.typography',
	],
	'skip_core' => false,
];
