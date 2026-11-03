<?php

declare(strict_types=1);

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Bizproc\Activity\ActivityDescription;
use Bitrix\Bizproc\Activity\Enum\ActivityColorIndex;
use Bitrix\Bizproc\Activity\Enum\ActivityGroup;
use Bitrix\Bizproc\Activity\Enum\ActivityType;
use Bitrix\Bizproc\FieldType;
use Bitrix\Catalog\ProductTable;
use Bitrix\Crm\Activity\Access\CatalogAccessChecker;
use Bitrix\Main\Loader;
use Bitrix\Main\Localization\Loc;
use Bitrix\Ui\Public\Enum\IconSet\Outline;

$arActivityDescription = (new ActivityDescription(
	name: Loc::getMessage('CRM_BP_GPINFO_NAME') ?? '',
	description: Loc::getMessage('CRM_BP_GPINFO_DESCRIPTION') ?? '',
	type: [
		ActivityType::NODE->value,
	],
))
	->setCategory([
		'ID' => 'document',
		'OWN_ID' => 'crm',
		'OWN_NAME' => 'CRM',
	])
	->setClass('CrmGetProductInfoActivity')
	->setJsClass('BizProcActivity')
	->setExcluded(!Loader::includeModule('crm') || !CatalogAccessChecker::hasAccess())
	->setGroups([
		ActivityGroup::SALES_CRM->value,
	])
	->setReturn([
		'Succeeded' => [
			'NAME' => Loc::getMessage('CRM_BP_GPINFO_RETURN_SUCCEEDED') ?? '',
			'TYPE' => FieldType::BOOL,
		],
		'ErrorMessage' => [
			'NAME' => Loc::getMessage('CRM_BP_GPINFO_RETURN_ERROR_MESSAGE') ?? '',
			'TYPE' => FieldType::STRING,
		],
		'Id' => [
			'NAME' => Loc::getMessage('CRM_BP_GPINFO_RETURN_ID') ?? '',
			'TYPE' => FieldType::INT,
		],
		'IsVariation' => [
			'NAME' => Loc::getMessage('CRM_BP_GPINFO_RETURN_IS_VARIATION') ?? '',
			'TYPE' => FieldType::BOOL,
		],
		'ParentId' => [
			'NAME' => Loc::getMessage('CRM_BP_GPINFO_RETURN_PARENT_ID') ?? '',
			'TYPE' => FieldType::INT,
		],
		'Name' => [
			'NAME' => Loc::getMessage('CRM_BP_GPINFO_RETURN_NAME') ?? '',
			'TYPE' => FieldType::STRING,
		],
		'Type' => [
			'NAME' => Loc::getMessage('CRM_BP_GPINFO_RETURN_TYPE') ?? '',
			'TYPE' => FieldType::SELECT,
			'OPTIONS' => Loader::includeModule('catalog') ? ProductTable::getProductTypes(true) : [],
		],
		'Active' => [
			'NAME' => Loc::getMessage('CRM_BP_GPINFO_RETURN_ACTIVE') ?? '',
			'TYPE' => FieldType::BOOL,
		],
		'Description' => [
			'NAME' => Loc::getMessage('CRM_BP_GPINFO_RETURN_DESCRIPTION') ?? '',
			'TYPE' => FieldType::TEXT,
		],
		'SectionId' => [
			'NAME' => Loc::getMessage('CRM_BP_GPINFO_RETURN_SECTION_ID') ?? '',
			'TYPE' => FieldType::INT,
		],
		'SectionName' => [
			'NAME' => Loc::getMessage('CRM_BP_GPINFO_RETURN_SECTION_NAME') ?? '',
			'TYPE' => FieldType::STRING,
		],
		'MeasureName' => [
			'NAME' => Loc::getMessage('CRM_BP_GPINFO_RETURN_MEASURE_NAME') ?? '',
			'TYPE' => FieldType::STRING,
		],
		'MeasureSymbol' => [
			'NAME' => Loc::getMessage('CRM_BP_GPINFO_RETURN_MEASURE_SYMBOL') ?? '',
			'TYPE' => FieldType::STRING,
		],
		'Images' => [
			'NAME' => Loc::getMessage('CRM_BP_GPINFO_RETURN_IMAGES') ?? '',
			'TYPE' => FieldType::FILE,
			'MULTIPLE' => true,
		],
	])
	->setAdditionalResult(['PropertiesReturnMap'])
	->setColorIndex(ActivityColorIndex::BLUE->value)
	->setIcon(Outline::PRODUCT->name)
	->toArray()
;
