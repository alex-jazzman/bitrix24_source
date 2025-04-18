<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED!==true)die();

if (!CModule::IncludeModule('crm'))
	return;

if (\Bitrix\Crm\Service\Container::getInstance()->getUserPermissions()->entityType()->canReadItems(CCrmOwnerType::Order))
{
	return;
}

$arParams['PATH_TO_ORDER_PAYMENT_LIST'] = CrmCheckPath('PATH_TO_ORDER_PAYMENT_LIST', $arParams['PATH_TO_ORDER_PAYMENT_LIST'], $APPLICATION->GetCurPage());
$arParams['PATH_TO_ORDER_PAYMENT_SHOW'] = CrmCheckPath('PATH_TO_ORDER_PAYMENT_SHOW', $arParams['PATH_TO_ORDER_PAYMENT_SHOW'], $APPLICATION->GetCurPage().'?order_id=#order_id#&show');
$arParams['PATH_TO_ORDER_PAYMENT_EDIT'] = CrmCheckPath('PATH_TO_ORDER_PAYMENT_EDIT', $arParams['PATH_TO_ORDER_PAYMENT_EDIT'], $APPLICATION->GetCurPage().'?order_id=#order_id#&edit');

$arParams['ELEMENT_ID'] = isset($arParams['ELEMENT_ID']) ? (int)$arParams['ELEMENT_ID'] : 0;

if (!isset($arParams['TYPE']))
	$arParams['TYPE'] = 'list';

$toolbarID = 'toolbar_order_'.$arParams['TYPE'];
if($arParams['ELEMENT_ID'] > 0)
{
	$toolbarID .= '_'.$arParams['ELEMENT_ID'];
}
$arResult['TOOLBAR_ID'] = $toolbarID;

$arResult['BUTTONS'] = array();

$userPermissions = \Bitrix\Crm\Service\Container::getInstance()->getUserPermissions();
if ($arParams['TYPE'] == 'list')
{
	$bRead = $userPermissions->entityType()->canReadItems(CCrmOwnerType::OrderPayment);
	$bAdd = $userPermissions->entityType()->canAddItems(CCrmOwnerType::OrderPayment);
	$bWrite = $userPermissions->entityType()->canUpdateItems(CCrmOwnerType::OrderPayment);
	$bDelete = false;
	$bConfig = $userPermissions->isCrmAdmin();
}
else
{
	$bRead = $userPermissions->item()->canRead(CCrmOwnerType::OrderPayment, $arParams['ELEMENT_ID']);
	$bAdd = $userPermissions->entityType()->canAddItems(CCrmOwnerType::OrderPayment);
	$bWrite = $userPermissions->item()->canUpdate(CCrmOwnerType::OrderPayment, $arParams['ELEMENT_ID']);
	$bDelete = $userPermissions->item()->canDelete(CCrmOwnerType::OrderPayment, $arParams['ELEMENT_ID']);
}

if (!$bRead && !$bAdd && !$bWrite)
	return false;

if($arParams['TYPE'] === 'details')
{
	if($arParams['ELEMENT_ID'] <= 0)
	{
		return false;
	}

	$scripts = isset($arParams['~SCRIPTS']) && is_array($arParams['~SCRIPTS']) ? $arParams['~SCRIPTS'] : array();

	//Force start new bar after first button
	$arResult['BUTTONS'][] = array('NEWBAR' => true);

	if($bDelete && isset($scripts['DELETE']))
	{
		$arResult['BUTTONS'][] = array(
			'TEXT' => GetMessage('ORDER_PAYMENT_DELETE'),
			'TITLE' => GetMessage('ORDER_PAYMENT_DELETE_TITLE'),
			'ONCLICK' => $scripts['DELETE'],
			'ICON' => 'btn-delete'
		);
	}

	if(\Bitrix\Crm\Integration\DocumentGeneratorManager::getInstance()->isDocumentButtonAvailable())
	{
		\Bitrix\Crm\Service\Container::getInstance()->getLocalization()->loadMessages();
		$arResult['BUTTONS'][] = [
			'TEXT' => GetMessage('CRM_COMMON_DOCUMENT'),
			'TYPE' => 'crm-document-button',
			'PARAMS' => \Bitrix\Crm\Integration\DocumentGeneratorManager::getInstance()->getDocumentButtonParameters(
				mb_strtolower(\Bitrix\Crm\Integration\DocumentGenerator\DataProvider\Payment::class),
				$arParams['ELEMENT_ID']
			),
		];
	}

	$this->IncludeComponentTemplate();
	return;
}

if($arParams['TYPE'] === 'list')
{
	if ($bConfig)
	{
		CCrmComponentHelper::RegisterScriptLink('/bitrix/js/crm/common.js');
		$arResult['BUTTONS'][] = \Bitrix\Crm\Settings\LeadSettings::getCrmTypeMenuItem(true);
	}

	if(count($arResult['BUTTONS']) > 1)
	{
		//Force start new bar after first button
		array_splice($arResult['BUTTONS'], 1, 0, array(array('NEWBAR' => true)));
	}

	$this->IncludeComponentTemplate();
	return;
}

$qty = count($arResult['BUTTONS']);

if ($qty >= 3)
	$arResult['BUTTONS'][] = array('NEWBAR' => true);

if ($bAdd && $arParams['TYPE'] != 'list')
{
	$arResult['BUTTONS'][] = array(
		'TEXT' => GetMessage('ORDER_PAYMENT_ADD'),
		'TITLE' => GetMessage('ORDER_PAYMENT_ADD_TITLE'),
		'LINK' => CComponentEngine::MakePathFromTemplate(
				$arParams['PATH_TO_ORDER_PAYMENT_EDIT'],
				array('payment_id' => 0)
		),
		'TARGET' => '_blank',
		'ICON' => 'btn-new'
	);
}

$this->IncludeComponentTemplate();
?>
