<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/meetings.bundle.css',
	'js' => 'dist/meetings.bundle.js',
	'rel' => [
		'calendar.analytics',
		'main.core',
		'main.core.events',
		'main.loader',
		'main.popup',
		'socialnetwork.v2.lib.event-sender',
		'ui.design-tokens',
		'ui.dialogs.messagebox',
		'ui.fonts.opensans',
		'ui.hint',
		'ui.icons.b24',
		'ui.icons.service',
		'ui.popupcomponentsmaker',
	],
	'skip_core' => false,
];