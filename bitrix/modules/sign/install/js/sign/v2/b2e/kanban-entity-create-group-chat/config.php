<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/kanban-entity-create-group-chat.bundle.css',
	'js' => 'dist/kanban-entity-create-group-chat.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'im.public',
		'sign.feature-resolver',
		'sign.v2.api',
	],
	'skip_core' => true,
];