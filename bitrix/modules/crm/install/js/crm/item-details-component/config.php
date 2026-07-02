<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/item-details-component.bundle.css',
	'js' => 'dist/item-details-component.bundle.js',
	'rel' => [
		'crm.integration.analytics',
		'crm.item-details-component.pagetitle',
		'crm.item-details-component.stage-flow',
		'crm.messagesender',
		'crm.router',
		'crm.stage.permission-checker',
		'crm.stage-model',
		'main.core',
		'main.core.events',
		'main.loader',
		'ui.dialogs.messagebox',
		'ui.notification',
		'ui.stageflow',
	],
	'skip_core' => false,
];
