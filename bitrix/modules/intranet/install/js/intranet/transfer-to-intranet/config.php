<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/transfer-to-intranet.bundle.css',
	'js' => 'dist/transfer-to-intranet.bundle.js',
	'rel' => [
		'intranet.department-control',
		'main.core',
		'main.core.events',
		'main.popup',
		'ui.avatar',
		'ui.buttons',
		'ui.confetti',
		'ui.fonts.inter',
		'ui.lottie',
	],
	'skip_core' => false,
	'settings' => [
		'isRenamedIntegrator' => \Bitrix\Intranet\Public\Service\IntegratorService::createByDefault()->isRenamedIntegrator(),
	]
];
