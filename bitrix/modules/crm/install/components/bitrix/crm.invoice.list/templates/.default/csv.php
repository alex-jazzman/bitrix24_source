<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED!==true)die();

/**
 * @var array $arParams
 * @var array $arResult
 * @var \CBitrixComponentTemplate $this
 * @global \CMain $APPLICATION
 * @global \CUser $USER
 * @global \CDatabase $DB
 */

$isStExport = (isset($arResult['STEXPORT_MODE']) && $arResult['STEXPORT_MODE'] === 'Y');
$isStExportFirstPage = (isset($arResult['STEXPORT_IS_FIRST_PAGE']) && $arResult['STEXPORT_IS_FIRST_PAGE'] === 'Y');
$isExportProductFields = (
	isset($arResult['STEXPORT_EXPORT_PRODUCT_FIELDS'])
	&& $arResult['STEXPORT_EXPORT_PRODUCT_FIELDS'] === 'Y'
);

if ((!is_array($arResult['INVOICE']) || count($arResult['INVOICE']) <= 0) && (!$isStExport || $isStExportFirstPage))
{
	echo GetMessage('ERROR_INVOICE_IS_EMPTY_2');
}
else
{
	// Build up associative array of headers
	$arHeaders = array();
	foreach ($arResult['HEADERS'] as $arHead)
	{
		$arHeaders[$arHead['id']] = $arHead;
	}

	// Special logic for ENTITIES_LINKS headers: expand in 3 columns
	$showEntityLinks = false;
	foreach ($arResult['SELECTED_HEADERS'] as $headerID)
	{
		if (isset($arHeaders[$headerID]) && $headerID === 'ENTITIES_LINKS')
		{
			$showEntityLinks = true;
		}
	}

	if (!$isStExport || $isStExportFirstPage)
	{
		// Display headers
		foreach ($arResult['SELECTED_HEADERS'] as $headerID)
		{
			$arHead = isset($arHeaders[$headerID]) ? $arHeaders[$headerID] : null;
			if (!$arHead)
			{
				continue;
			}

			// Special logic for ENTITIES_LINKS headers: expand in 3 columns
			if ($headerID === 'ENTITIES_LINKS')
			{
				echo '"'.GetMessage('CRM_COLUMN_DEAL').'";';
				echo '"'.GetMessage('CRM_COLUMN_COMPANY').'";';
				echo '"'.GetMessage('CRM_COLUMN_CONTACT').'";';
			}
			else
			{
				echo '"'.$arHead['name'].'";';
			}
		}
		if ($isExportProductFields)
		{
			echo '"', GetMessage('CRM_COLUMN_PRODUCT_NAME'), '";';
			echo '"', GetMessage('CRM_COLUMN_PRODUCT_PRICE'), '";';
			echo '"', GetMessage('CRM_COLUMN_PRODUCT_QUANTITY'), '";';
		}
		echo "\n";
	}

	$arPersonTypes = \CCrmPaySystem::getPersonTypesList();
	$arPaySystems = array();
	foreach (array_keys($arPersonTypes) as $personTypeId)
	{
		$arPaySystems[$personTypeId] = \CCrmPaySystem::GetPaySystemsListItems($personTypeId, true);
	}
	unset($personTypeId);
	foreach ($arResult['INVOICE'] as $i => &$arInvoice)
	{
		// Serialize each product row as invoice with single product;
		// fallback to a single empty row so the invoice is still rendered when there are no products
		$hasProducts = !empty($arInvoice['PRODUCT_ROWS']);
		$productRows = ($showEntityLinks || $isExportProductFields) && $hasProducts
			? $arInvoice['PRODUCT_ROWS']
			: [[]]
		;
		$invoiceData = array();
		$personTypeId = $arInvoice['PERSON_TYPE_ID'];
		foreach ($productRows as $productRow)
		{
			foreach ($arResult['SELECTED_HEADERS'] as $headerID)
			{
				$arHead = isset($arHeaders[$headerID]) ? $arHeaders[$headerID] : null;
				if (!$arHead)
				{
					continue;
				}

				$headerID = $arHead['id'];
				if ($headerID === 'ENTITIES_LINKS')
				{
					// Special logic for ENTITIES_LINKS: expand in 3 columns
					echo ($arInvoice['DEAL_TITLE'] != '') ? '"'.str_replace('"', '""', htmlspecialcharsback($arInvoice['DEAL_TITLE'])).'";' : ';';
					echo ($arInvoice['COMPANY_TITLE'] != '') ? '"'.str_replace('"', '""', htmlspecialcharsback($arInvoice['COMPANY_TITLE'])).'";' : ';';
					echo ($arInvoice['CONTACT_FORMATTED_NAME'] != '') ? '"'.str_replace('"', '""', htmlspecialcharsback($arInvoice['CONTACT_FORMATTED_NAME'])).'";' : ';';
					continue;
				}
				if ($isExportProductFields && $headerID === 'PRICE')
				{
					echo '"', CCrmProductRow::ResolveExportRowSum($productRow, $arInvoice['PRICE'] ?? ''), '";';
					continue;
				}

				if (!isset($invoiceData[$headerID]))
				{
					switch ($arHead['id'])
					{
						case 'STATUS_ID':
							$statusID = !empty($arInvoice['STATUS_ID']) ? $arInvoice['STATUS_ID'] : '';
							$invoiceData['STATUS_ID'] = isset($arResult['STATUS_LIST'][$statusID]) ? $arResult['STATUS_LIST'][$statusID] : $statusID;
							break;
						case 'CURRENCY':
							$invoiceData['CURRENCY'] = CCrmCurrency::GetCurrencyName($arInvoice['CURRENCY']);
							break;
						case 'RESPONSIBLE_ID':
							$invoiceData['RESPONSIBLE_ID'] = htmlspecialcharsback($arInvoice['RESPONSIBLE']);
							break;
						case 'DATE_PAY_BEFORE':
						case 'DATE_INSERT':
						case 'DATE_BILL':
						case 'DATE_MARKED':
						case 'DATE_STATUS':
						case 'DATE_UPDATE':
						case 'PAY_VOUCHER_DATE':
							$site = new CSite();
							if (!empty($arInvoice[$arHead['id']]))
								$invoiceData[$arHead['id']] = htmlspecialcharsbx(FormatDate('SHORT', MakeTimeStamp($arInvoice[$arHead['id']], $site->GetDateFormat('FULL'))));
							else
								$invoiceData[$arHead['id']] = '';
							unset($site);
							break;
						case 'PERSON_TYPE_ID':
							$invoiceData['PERSON_TYPE_ID'] = htmlspecialcharsbx(trim($arPersonTypes[$arInvoice['PERSON_TYPE_ID']]));
							break;
						case 'PAY_SYSTEM_ID':
							$invoiceData['PAY_SYSTEM_ID'] = htmlspecialcharsbx(trim($arPaySystems[$personTypeId][$arInvoice['PAY_SYSTEM_ID']]));
							break;
						case 'UF_MYCOMPANY_ID':
							$invoiceData['UF_MYCOMPANY_ID'] = htmlspecialcharsbx(trim($arInvoice['MYCOMPANY_TITLE']));
							break;
						default:
							if (isset($arResult['INVOICE_UF'][$i]) && isset($arResult['INVOICE_UF'][$i][$headerID]))
							{
								$invoiceData[$headerID] = $arResult['INVOICE_UF'][$i][$headerID];
							}
							elseif (is_array($arInvoice[$headerID]))
							{
								$invoiceData[$headerID] = implode(', ', $arInvoice[$headerID]);
							}
							else
							{
								$invoiceData[$headerID] = strval($arInvoice[$headerID]);
							}
					}
				}
				if (isset($invoiceData[$headerID]))
				{
					echo ($invoiceData[$headerID] != '') ? '"'.str_replace('"', '""', htmlspecialcharsback($invoiceData[$headerID])).'";' : ';';
				}
			}
			if ($isExportProductFields)
			{
				$productName = isset($productRow['PRODUCT_NAME'])
					? str_replace('"', '""', htmlspecialcharsback($productRow['PRODUCT_NAME']))
					: '';
				echo '"', $productName, '";';
				echo '"', CCrmProductRow::GetPrice($productRow, ''), '";';
				echo '"', CCrmProductRow::GetQuantity($productRow, ''), '";';
			}
			echo "\n";
		}
	}
}
