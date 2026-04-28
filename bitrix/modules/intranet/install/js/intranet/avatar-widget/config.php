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
		'ui.analytics',
		'intranet.desktop-download',
		'intranet.desktop-account-list',
		'im.v2.lib.desktop-api',
		'ui.avatar',
		'timeman.work-status-control-panel',
		'main.popup',
		'main.sidepanel',
		'ui.info-helper',
		'crm.router',
		'ui.cnt',
		'pull.client',
		'humanresources.hcmlink.salary-vacation-menu',
		'ui.short-qr-auth',
		'main.core',
		'ui.buttons',
		'main.core.events',
	],
	'skip_core' => false,
];
