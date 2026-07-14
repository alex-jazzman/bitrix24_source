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
		'bitrix24.first-admin-guard',
		'im.public',
		'intranet.fire-employee-wizard',
		'intranet.reinvite',
		'main.core',
		'ui.avatar',
		'ui.cnt',
		'ui.dialogs.messagebox',
		'ui.entity-selector',
		'ui.form-elements.field',
		'ui.hint',
		'ui.icon-set.api.core',
		'ui.icon-set.main',
		'ui.label',
		'ui.system.chip',
	],
	'settings' => [
		'isRenamedIntegrator' => \Bitrix\Intranet\Public\Service\IntegratorService::createByDefault()->isRenamedIntegrator() ? 'Y' : 'N',
	],
];