<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Crm\Integration\Analytics\Dictionary;
use Bitrix\Crm\Service\Container;

/** @global CMain $APPLICATION */
/** @var array $arParams */
/** @var array $arResult */

$categoryId = 0;
$entityId = isset($arResult['VARIABLES']['company_id']) ? (int)$arResult['VARIABLES']['company_id'] : 0;
if ($entityId > 0)
{
	$categoryId = (int)Container::getInstance()
		->getFactory(CCrmOwnerType::Company)
		->getItemCategoryId($entityId)
	;
}
elseif (isset($_REQUEST['category_id']))
{
	$categoryId = (int)$_REQUEST['category_id'];
}

if (isset($_REQUEST['IFRAME']) && $_REQUEST['IFRAME'] === 'Y')
{
	$APPLICATION->IncludeComponent(
		'bitrix:crm.entity.details.frame',
		'',
		[
			'ENTITY_TYPE_ID' => CCrmOwnerType::Company,
			'ENTITY_ID' => $entityId,
			'EXTRAS' => [
				'CATEGORY_ID' => $categoryId,
				'ANALYTICS' => [
					'c_section' => $categoryId === 0 ? Dictionary::SECTION_COMPANY : Dictionary::SECTION_CATALOG_CONTRACTOR_COMPANY,
					'c_sub_section' => Dictionary::SUB_SECTION_DETAILS,
				],
			],
		]
	);
}
else
{
	Bitrix\Main\Page\Asset::getInstance()->addCss('/bitrix/js/crm/css/workareainvisible.css');

	$entityCategoryId = $entityId <= 0 ? $categoryId : null;
	$viewCategoryId = $categoryId;

	$script = CCrmViewHelper::getDetailFrameWrapperScript(
		CCrmOwnerType::Company,
		$entityId,
		$entityCategoryId,
		$viewCategoryId
	);

	echo $script;
}
