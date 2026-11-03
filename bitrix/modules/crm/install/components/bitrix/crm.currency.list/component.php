<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Crm\Service\Container;
use Bitrix\Crm\V2\Infrastructure\Component\Currency\Grid\CurrencyGrid;
use Bitrix\Crm\V2\Internal\Service\Currency\Compatibility\LegacyCurrencyMutationAdapter;
use Bitrix\Crm\V2\Internal\Service\Currency\CurrencyMutationService;
use Bitrix\Main\Grid\Settings;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\UI\Extension;
use Bitrix\UI\Buttons\CreateButton;
use Bitrix\UI\Buttons\Tag;
use Bitrix\UI\Toolbar\ButtonLocation;
use Bitrix\UI\Toolbar\Facade\Toolbar;

if (!CModule::IncludeModule('crm'))
{
	ShowError(GetMessage('CRM_MODULE_NOT_INSTALLED'));

	return;
}

$canEdit = Container::getInstance()->getUserPermissions()->isCrmAdmin();
if (!$canEdit)
{
	ShowError(GetMessage('CRM_PERMISSION_DENIED'));

	return;
}

$gridId = 'CRM_CURRENCY_LIST';
$addUrl = CrmCheckPath('PATH_TO_CURRENCY_ADD', $arParams['PATH_TO_CURRENCY_ADD'] ?? '', '?add');
$editUrlTemplate = CrmCheckPath(
	'PATH_TO_CURRENCY_EDIT',
	$arParams['PATH_TO_CURRENCY_EDIT'] ?? '',
	'?currency_id=#currency_id#&edit',
);

$getSafeUrl = static function(string $url, string $fallback): string
{
	$url = trim($url);
	$scheme = parse_url($url, PHP_URL_SCHEME);
	$host = parse_url($url, PHP_URL_HOST);
	if (
		$scheme === false
		|| $host === false
		|| ($host !== null && $scheme === null)
		|| (is_string($scheme) && !in_array(strtolower($scheme), ['http', 'https'], true))
	)
	{
		return $fallback;
	}

	return $url;
};

$addUrl = $getSafeUrl($addUrl, '?add');
$editUrlTemplate = $getSafeUrl($editUrlTemplate, '?currency_id=#currency_id#&edit');
if (!str_contains($editUrlTemplate, '#currency_id#'))
{
	$editUrlTemplate = '?currency_id=#currency_id#&edit';
}

$mutationAdapter = new LegacyCurrencyMutationAdapter();
$mutationService = new CurrencyMutationService($mutationAdapter);
$createGrid = static function(string $baseCurrencyId, string $accountingCurrencyId) use (
	$gridId,
	$editUrlTemplate,
	$mutationService,
	$mutationAdapter,
): CurrencyGrid {
	return new CurrencyGrid(
		new Settings(['ID' => $gridId]),
		$editUrlTemplate,
		$baseCurrencyId,
		$accountingCurrencyId,
		$mutationService,
		$mutationAdapter,
		null,
		[
			'ID' => (string)GetMessage('CRM_COLUMN_ID'),
			'NAME' => (string)GetMessage('CRM_COLUMN_NAME'),
			'SORT' => (string)GetMessage('CRM_COLUMN_SORT'),
			'EXCH_RATE' => (string)GetMessage('CRM_COLUMN_EXCH_RATE'),
			'AMOUNT_CNT' => (string)GetMessage('CRM_COLUMN_AMOUNT_CNT'),
			'BASE' => (string)GetMessage('CRM_COLUMN_CURRENCY_LIST_BASE'),
			'ACCOUNTING' => (string)GetMessage('CRM_COLUMN_ACCOUNTING'),
		],
		(string)GetMessage('CRM_CURRENCY_ACTION_SET_BASE'),
	);
};

$grid = $createGrid(
	$mutationAdapter->getBaseCurrencyId(),
	$mutationAdapter->getAccountingCurrencyId(),
);

$grid->processRequest();
$currentPage = $grid->getPagination()->getCurrentPage();

$baseCurrencyId = $mutationAdapter->getBaseCurrencyId();
$accountingCurrencyId = $mutationAdapter->getAccountingCurrencyId();
$grid = $createGrid($baseCurrencyId, $accountingCurrencyId);
$grid->getPagination()->setCurrentPage($currentPage);

$arResult = $grid->getComponentParams([
	'gridId' => $gridId,
	'addUrl' => $addUrl,
	'editUrlTemplate' => $editUrlTemplate,
	'batchController' => 'crm.v2.Currency.BatchDeletion',
	'batchStorageKey' => 'crm.currency.list.batchDeletion.v1',
	'canEdit' => $canEdit,
	'canDelete' => $canEdit,
	'USE_CHECKBOX_LIST_FOR_SETTINGS_POPUP' => \Bitrix\Main\ModuleManager::isModuleInstalled('ui'),
]);

Extension::load('crm.currency-list');
Toolbar::deleteFavoriteStar();

if ($canEdit)
{
	Toolbar::addButton(
		new CreateButton([
			'tag' => Tag::LINK,
			'link' => $addUrl,
			'text' => Loc::getMessage('CRM_CURRENCY_LIST_ADD'),
			'dataset' => [
				'testid' => 'crm-currency-list-add',
			],
		]),
		ButtonLocation::AFTER_TITLE,
	);
}

$this->IncludeComponentTemplate();
