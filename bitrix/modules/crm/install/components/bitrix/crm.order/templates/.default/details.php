<?php
if(!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED!==true) die();
/** @global CMain $APPLICATION */
/** @var array $arParams */
/** @var array $arResult */

$APPLICATION->IncludeComponent(
	'bitrix:crm.entity.details.frame',
	'',
	array(
		'ENTITY_TYPE_ID' => CCrmOwnerType::Order,
		'ENTITY_ID' => $arResult['VARIABLES']['order_id'],
		'DISABLE_TOP_MENU' => 'Y',
		'EXTRAS' => array(
			'BUILDER_CONTEXT' => $arParams['BUILDER_CONTEXT']
		)
	)
);
