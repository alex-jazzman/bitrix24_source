<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => './dist/document-history.bundle.js',
	'css' => './dist/document-history.bundle.css',
	'rel' => [
		'main.core',
		'main.core.events',
		'main.date',
		'note.ui.avatar-stack',
		'note.ui.backlinks',
		'note.ui.loader',
		'note.ui.popover-position',
		'pull.client',
		'ui.icon-set.api.vue',
		'ui.icon-set.outline',
		'ui.icon-set.solid',
		'ui.notification',
		'ui.system.checkbox',
	],
	'skip_core' => false,
];
