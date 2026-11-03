<?php

use Bitrix\Crm\V2\Internal\Service\PaySystem\HandlerCatalog;
use Bitrix\Crm\V2\Internal\Service\PaySystem\HandlerGuard;
use Bitrix\Crm\V2\Internal\Service\PaySystem\PrintOperation;
use Bitrix\Crm\V2\Internal\Service\PaySystem\QuoteRenderer;

if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true) die();

if (!CModule::IncludeModule('crm'))
{
	ShowError(GetMessage('CRM_MODULE_NOT_INSTALLED'));
	return;
}

if (!CModule::IncludeModule('sale'))
{
	ShowError(GetMessage('CRM_MODULE_NOT_INSTALLED_SALE'));
	return;
}

$quoteID = (int)($arParams['QUOTE_ID'] ?? 0);
$permissions = \Bitrix\Crm\Service\Container::getInstance()->getUserPermissions()->item();
if ($quoteID <= 0 || !$permissions->canRead(CCrmOwnerType::Quote, $quoteID))
{
	ShowError(GetMessage('CRM_PERMISSION_DENIED'));
	return;
}

global $APPLICATION;
$APPLICATION->RestartBuffer();

$dbResult = CCrmQuote::GetList(array(), array('ID' => $quoteID, 'CHECK_PERMISSIONS' => 'N'), false, false, array('*', 'UF_*'));
$arQuote = is_object($dbResult) ? $dbResult->Fetch() : null;
$paySystemID = isset($_REQUEST['PAY_SYSTEM_ID']) ? intval($_REQUEST['PAY_SYSTEM_ID']) : 0;

if (is_array($arQuote) && $paySystemID > 0)
{
	$dbPaySysAction = CSalePaySystemAction::GetList(
		array(),
		array(
			"PAY_SYSTEM_ID" => $paySystemID,
			"PERSON_TYPE_ID" => $arQuote["PERSON_TYPE_ID"]
		),
		false,
		false,
		array('ID', 'ACTION_FILE', 'ENCODING')
	);


	if ($arPaySysAction = $dbPaySysAction->Fetch())
	{
		$resolution = (new HandlerGuard())->resolve($arPaySysAction, HandlerCatalog::PURPOSE_LEGACY_PRINT);
		if (
			$resolution->isSuccess()
			&& !\Bitrix\Sale\PaySystem\Manager::isRestHandler($arPaySysAction['ACTION_FILE'])
		)
		{
			$paramsResult = (new \Bitrix\Crm\V2\Internal\Service\PaySystem\HandlerMetadataProvider())->getParameters(
				$arPaySysAction, (int)$arQuote['PERSON_TYPE_ID'],
			);
			if (!$paramsResult->isSuccess())
			{
				ShowError(GetMessage('CRM_PERMISSION_DENIED'));
				return;
			}
			$arPaySysAction['PARAMS'] = serialize($paramsResult->getData()['params']);
			$resolution = (new HandlerGuard())->resolve($arPaySysAction, HandlerCatalog::PURPOSE_LEGACY_PRINT);
			if (!$resolution->isSuccess())
			{
				ShowError(GetMessage('CRM_PERMISSION_DENIED'));
				return;
			}
			$handler = $resolution->getData()['handler'];
			$paymentData = CCrmQuote::PrepareSalePaymentData($arQuote);
			if (is_array($paymentData))
			{
				$pdf = !empty($_REQUEST['pdf']);
				$operation = new PrintOperation('quote', $pdf ? 'pdf_download' : 'print', 'quote_payment');
				$result = $operation->run(
					static fn() => (new QuoteRenderer())->render($handler, $paymentData, $operation, $pdf),
				);
				if ($result->isSuccess())
				{
					$operation->markGenerated($handler->getCode());
					$operation->complete();
					echo $result->getData()['content'];
				}
				else
				{
					header_remove('Content-Disposition');
					header('Content-Type: text/html; charset=' . LANG_CHARSET);
					ShowError(GetMessage('CRM_PERMISSION_DENIED'));
				}
			}
			else
			{
				ShowError(GetMessage('CRM_PERMISSION_DENIED'));
			}
		}
		else
		{
			ShowError(GetMessage('CRM_PERMISSION_DENIED'));
		}
	}
	else
	{
		ShowError(GetMessage('CRM_PERMISSION_DENIED'));
	}
}
else
{
	ShowError(GetMessage('CRM_PERMISSION_DENIED'));
}

$r = $APPLICATION->EndBufferContentMan();
echo $r;
die();
