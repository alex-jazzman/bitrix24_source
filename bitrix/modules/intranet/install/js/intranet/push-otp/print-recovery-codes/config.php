<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

$logoUrl = \Bitrix\Intranet\Portal::getInstance()->getSettings()->getDefaultLogo()->getBlack();

return [
	'css' => 'dist/print-recovery-codes.bundle.css',
	'js' => 'dist/print-recovery-codes.bundle.js',
	'rel' => [
		'main.core',
		'main.sidepanel',
	],
	'settings' => [
		'logoUrl' => $logoUrl,
	],
	'skip_core' => false,
];
