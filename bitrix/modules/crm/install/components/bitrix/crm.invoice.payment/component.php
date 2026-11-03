<?php

use Bitrix\Crm\Invoice\Compatible;
use Bitrix\Crm\Invoice\Invoice;
use Bitrix\Sale;
use Bitrix\Crm\V2\Internal\Integration\Sale\CheckedPaySystemServiceFactory;
use Bitrix\Crm\V2\Internal\Service\PaySystem\CheckedBusinessValueContext;
use Bitrix\Crm\V2\Internal\Service\PaySystem\HandlerCatalog;
use Bitrix\Crm\V2\Internal\Service\PaySystem\PrintOperation;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

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

$publicPayment = null;
if (isset($arParams['HASH']))
{
	$invoice = Invoice::loadByAccountNumber($arParams['ORDER_ID']);
	if (!$invoice)
	{
		return;
	}
	$arParams['ORDER_ID'] = $invoice->getId();
	$paymentCollection = $invoice->loadPaymentCollection();
	/**	@var Sale\Payment $payment*/
	$payment = $paymentCollection->current();
	if (!($payment instanceof Sale\Payment) || $arParams['HASH'] !== $payment->getHash())
	{
		ShowError(GetMessage('CRM_PERMISSION_DENIED'));
		return;
	}
	$publicPayment = $payment;
}
else
{
	$invoiceId = (int)($arParams['ORDER_ID'] ?? 0);
	if (
		$invoiceId <= 0
		|| !\Bitrix\Crm\Service\Container::getInstance()->getUserPermissions()->item()->canRead(CCrmOwnerType::Invoice, $invoiceId)
	)
	{
		ShowError(GetMessage('CRM_PERMISSION_DENIED'));

		return;
	}
}

global $APPLICATION;

$APPLICATION->RestartBuffer();

$isPublicLinkMode = (isset($arParams["PUBLIC_LINK_MODE"]) && $arParams["PUBLIC_LINK_MODE"] === 'Y');

$ORDER_ID = intval($arParams["ORDER_ID"]);

$dbOrder = Compatible\Helper::getList(
	array("DATE_UPDATE" => "DESC"),
	array(
		"LID" => SITE_ID,
		"ID" => $ORDER_ID
	),
	false,
	false,
	array('*', 'UF_DEAL_ID', 'UF_QUOTE_ID', 'UF_COMPANY_ID', 'UF_CONTACT_ID', 'UF_MYCOMPANY_ID')
);

$arOrder = $dbOrder->GetNext();
$paymentData = is_array($arOrder) ?
	CCrmInvoice::PrepareSalePaymentData($arOrder, array('PUBLIC_LINK_MODE' => $isPublicLinkMode ? 'Y' : 'N')) : null;
if ($arOrder)
{
	if ($arOrder["SUM_PAID"] <> '')
		$arOrder["PRICE"] -= $arOrder["SUM_PAID"];

	$invoice = Invoice::load($ORDER_ID);
	$payment = $publicPayment;
	if ($payment === null && $invoice)
	{
		foreach ($invoice->getPaymentCollection() as $candidate)
		{
			if (!$candidate->isInner())
			{
				$payment = $candidate;
				break;
			}
		}
	}
	$arPaySysAction = $payment ? Sale\PaySystem\Manager::getById($payment->getPaymentSystemId()) : false;
	$created = is_array($arPaySysAction)
		? (new CheckedPaySystemServiceFactory())->createFromFields(
			$arPaySysAction, HandlerCatalog::PURPOSE_LEGACY_PRINT, $payment,
		)
		: null
	;
	if ($created !== null && $created->isSuccess())
	{
		$service = $created->getData()['service'];
		$handler = $created->getData()['handler'];
		$pdf = array_key_exists('pdf', $_REQUEST);
		$operation = new PrintOperation('invoice', $pdf ? 'pdf_download' : 'print', 'invoice_payment');
		$render = static function () use (
			$arOrder, $arPaySysAction, $paymentData, $ORDER_ID, $service, $payment,
		) {
			(new CheckedBusinessValueContext())->run(
				$service->getConsumerName(),
				static fn() => $service->getHandlerDescription(),
				static fn() => CSalePaySystemAction::InitParamArrays(
					$arOrder,
					0,
					$arPaySysAction["PARAMS"],
					[
						'REQUISITE' => is_array($paymentData['REQUISITE']) ? $paymentData['REQUISITE'] : null,
						'BANK_DETAIL' => is_array($paymentData['BANK_DETAIL']) ? $paymentData['BANK_DETAIL'] : null,
						'CRM_COMPANY' => is_array($paymentData['CRM_COMPANY']) ? $paymentData['CRM_COMPANY'] : null,
						'CRM_CONTACT' => is_array($paymentData['CRM_CONTACT']) ? $paymentData['CRM_CONTACT'] : null,
						'MC_REQUISITE' => is_array($paymentData['MC_REQUISITE']) ? $paymentData['MC_REQUISITE'] : null,
						'MC_BANK_DETAIL' => is_array($paymentData['MC_BANK_DETAIL']) ? $paymentData['MC_BANK_DETAIL'] : null,
						'CRM_MYCOMPANY' => is_array($paymentData['CRM_MYCOMPANY']) ? $paymentData['CRM_MYCOMPANY'] : null
					],
					[],
					array(),
					REGISTRY_TYPE_CRM_INVOICE
				),
			);

			// USER_ID hack (0050242)
			$arInvoice = array();
			$dbInvoice = CCrmInvoice::GetList(
				array('ID' => 'DESC'),
				array('ID' => $ORDER_ID, 'PERMISSION' => 'READ'),
				false,
				false,
				array('ID', 'UF_CONTACT_ID', 'UF_COMPANY_ID')
			);
			if (is_object($dbInvoice))
				$arInvoice = $dbInvoice->Fetch();
			unset($dbInvoice);
			if (is_array($arInvoice) && isset($arInvoice['UF_CONTACT_ID']) && isset($arInvoice['UF_COMPANY_ID']))
			{
				$companyId = intval($arInvoice['UF_COMPANY_ID']);
				$contactId = intval($arInvoice['UF_CONTACT_ID']);
				$clientId = '';
				if ($companyId > 0)
					$clientId = 'C'.$companyId;
				else
					$clientId = 'P'.$contactId;
				$GLOBALS['SALE_INPUT_PARAMS']['ORDER']['USER_ID'] = $clientId;
				\Bitrix\Sale\BusinessValue::redefineProviderField(
					array(
						'ORDER' => array('USER_ID' => $clientId),
						'PROPERTY' => $paymentData['USER_FIELDS']
					)
				);
				unset($companyId, $contactId, $clientId);
			}
			unset($arInvoice);

			$context = \Bitrix\Main\Application::getInstance()->getContext();
			return $service->initiatePay($payment, $context->getRequest());
		};
		try
		{
			$captured = $operation->run(static fn() => $operation->capture($render));
		}
		catch (\Throwable)
		{
			$captured = null;
		}
		$result = $captured['value'] ?? null;
		$content = $captured['output'] ?? '';
		if (
			$result !== null
			&& $result->isSuccess()
			&& $content !== ''
			&& (!$pdf || (str_starts_with($content, '%PDF-') && str_contains($content, '%%EOF')))
		)
		{
			$operation->markGenerated($handler->getCode());
			$operation->complete();
			echo $content;
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

$r = $APPLICATION->EndBufferContentMan();
echo $r;
die();
