<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => 'dist/user-department-popup.bundle.js',
	'css' => 'dist/user-department-popup.bundle.css',
	'rel' => [
		'main.popup',
		'main.core',
		'ui.buttons',
		'intranet.department-control',
		'ui.avatar',
	],
	'skip_core' => false,
	'settings' => [
		'isRenamedIntegrator' => \Bitrix\Intranet\Public\Service\IntegratorService::createByDefault()->isRenamedIntegrator(),
	],
];
