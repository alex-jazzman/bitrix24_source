<?
if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/grid.bundle.css',
	'js' => [
		'dist/grid.bundle.js'
	],
	'skip_core' => false,
	'rel' => [
		'ui.avatar',
		'ui.label',
		'ui.cnt',
		'intranet.reinvite',
		'ui.icon-set.main',
		'bitrix24.first-admin-guard',
		'ui.form-elements.field',
		'ui.dialogs.messagebox',
		'im.public',
		'ui.entity-selector',
		'main.core',
	],
	'settings' => [
		'isRenamedIntegrator' => \Bitrix\Intranet\Public\Service\IntegratorService::createByDefault()->isRenamedIntegrator() ? 'Y' : 'N',
	],
];