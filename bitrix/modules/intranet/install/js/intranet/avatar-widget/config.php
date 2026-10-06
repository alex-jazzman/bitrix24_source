<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die;
}

return [
	'css' => 'dist/avatar-widget.bundle.css',
	'js' => 'dist/avatar-widget.bundle.js',
	'rel' => [
		'crm.router',
		'humanresources.hcmlink.salary-vacation-menu',
		'im.v2.lib.desktop-api',
		'intranet.desktop-account-list',
		'intranet.desktop-download',
		'main.core',
		'main.core.events',
		'main.popup',
		'main.sidepanel',
		'pull.client',
		'timeman.work-status-control-panel',
		'ui.analytics',
		'ui.avatar',
		'ui.buttons',
		'ui.cnt',
		'ui.info-helper',
		'ui.popupcomponentsmaker',
		'ui.short-qr-auth',
	],
	'skip_core' => false,
];
