<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => 'dist/editor.bundle.js',
	'rel' => [
		'crm.messagesender.editor',
		'main.core',
		'messageservice.custom-template.editor',
		'ui.notification',
	],
	'skip_core' => false,
];
