<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die;
}

return [
	'css' => 'dist/avatar-widget.bundle.css',
	'js' => 'dist/avatar-widget.bundle.js',
	'rel' => [
		'ui.popupcomponentsmaker',
		'ui.avatar',
		'timeman.work-time-button',
		'ui.analytics',
		'intranet.desktop-account-list',
		'ui.qrauthorization',
		'ui.buttons',
		'pull.client',
		'ui.cnt',
		'ui.info-helper',
		'crm.router',
		'humanresources.hcmlink.salary-vacation-menu',
		'main.core.events',
		'im.v2.lib.desktop-api',
		'main.core',
		'main.popup',
	],
	'skip_core' => false,
];
