<?php

use Sotbit\RestAPI\Config\Config;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\Application;
use Bitrix\Main\Loader,
    Bitrix\Main\ModuleManager,
    Bitrix\Iblock,
    Bitrix\Catalog,
    Bitrix\Currency;

const CATALOG_IBLOCK_TYPE = 'CATALOG_TYPE';
const CATALOG_IBLOCK_ID = 'CATALOG_ID';
global $USER_FIELD_MANAGER;
$module_id = 'sotbit.restapi';
$request = Application::getInstance()->getContext()->getRequest();
$catalogSettings = [];

$emptySelect = [
    '' => Loc::getMessage($module_id."_OPTION_CATALOG_PROP_EMPTY")
];


$catalogSettings['USE_PROPERTY_FEATURES'] = Iblock\Model\PropertyFeature::isEnabledFeatures();
$catalogSettings['OFFERS'] = false;

/**
 * Select Catalog Iblock
 */
$catalogSettings['IBLOCK_TYPE'] = !empty($request->get(CATALOG_IBLOCK_TYPE))
    ?
    htmlspecialcharsbx($request->get(CATALOG_IBLOCK_TYPE))
    :
    ($request->get('update') === 'Y' ? null : Config::getInstance()->get(CATALOG_IBLOCK_TYPE));

$catalogSettings['IBLOCK_ID'] = !empty($request->get(CATALOG_IBLOCK_ID))
    ?
    (int)$request->get(CATALOG_IBLOCK_ID)
    :
    ($request->get('update') === 'Y' ? null : Config::getInstance()->get(CATALOG_IBLOCK_ID));


$catalogSettings['CATALOG_CONVERT_CURRENCY'] = !empty($request->get('CATALOG_CONVERT_CURRENCY'))
    ?
    (string)$request->get('CATALOG_CONVERT_CURRENCY')
    :
    ($request->get('update') === 'Y' ? null : Config::getInstance()->get('CATALOG_CONVERT_CURRENCY'));

$catalogSettings['CATALOG_ADD_PROPERTIES_TO_BASKET'] = !empty($request->get('CATALOG_ADD_PROPERTIES_TO_BASKET'))
    ?
    (string)$request->get('CATALOG_ADD_PROPERTIES_TO_BASKET')
    :
    ($request->get('update') === 'Y' ? null : Config::getInstance()->get('CATALOG_ADD_PROPERTIES_TO_BASKET'));

$catalogSettings['CATALOG_SHOW_MAX_QUANTITY'] = !empty($request->get('CATALOG_SHOW_MAX_QUANTITY'))
    ?
    (string)$request->get('CATALOG_SHOW_MAX_QUANTITY')
    :
    ($request->get('update') === 'Y' ? null : Config::getInstance()->get('CATALOG_SHOW_MAX_QUANTITY'));



// Infoblock types
$arIBlockType = \CIBlockParameters::GetIBlockTypes();

$catalogSettings['IBLOCK_TYPE_SELECT']["REFERENCE_ID"][] = "";
$catalogSettings['IBLOCK_TYPE_SELECT']["REFERENCE"][] = Loc::getMessage($module_id."_EMPTY");
if(!empty($arIBlockType)) {
    $catalogSettings['IBLOCK_TYPE_SELECT']["REFERENCE_ID"] = array_keys($arIBlockType);
    $catalogSettings['IBLOCK_TYPE_SELECT']["REFERENCE"] = array_values($arIBlockType);
}

// Catalog offers
$iterator = Catalog\CatalogIblockTable::getList(
    [
        'select' => ['IBLOCK_ID'],
        'filter' => ['!=PRODUCT_IBLOCK_ID' => 0],
    ]
);
while($row = $iterator->fetch()) {
    $catalogSettings['IBLOCK_OFFERS'][$row['IBLOCK_ID']] = true;
}
unset($row, $iterator);

// Infoblocks IDs
if(!empty($catalogSettings['IBLOCK_TYPE'])) {
    $rsIBlock = \CIBlock::GetList(
        [
            "sort" => "asc",
        ],
        [
            "=TYPE"  => $catalogSettings['IBLOCK_TYPE'],
            "ACTIVE" => "Y",
        ]
    );

    while($arr = $rsIBlock->Fetch()) {
        if(!empty($arr)) {
            if(isset($catalogSettings['IBLOCK_OFFERS'][$arr["ID"]])) {
                continue;
            }
            $info = \CCatalogSku::GetInfoByIBlock($arr['ID']);
            if($info && $info['CATALOG'] === 'Y') {
                $catalogSettings['IBLOCK_ID_SELECT']["REFERENCE_ID"][] = $arr["ID"];
                $catalogSettings['IBLOCK_ID_SELECT']["REFERENCE"][] = "[".$arr["ID"]."] ".$arr["NAME"];
            }

        }
    }
    if(empty($catalogSettings['IBLOCK_ID_SELECT'])) {
        $catalogSettings['IBLOCK_ID_SELECT']["REFERENCE_ID"][] = '';
        $catalogSettings['IBLOCK_ID_SELECT']["REFERENCE"][] = Loc::getMessage($module_id."_EMPTY");
    }
} else {
    $catalogSettings['IBLOCK_ID_SELECT']["REFERENCE_ID"][] = '';
    $catalogSettings['IBLOCK_ID_SELECT']["REFERENCE"][] = Loc::getMessage($module_id."_EMPTY");
}

// Properties
$arProperty = [];
$catalogSettings['PROPERTY'] = [];
$catalogSettings['PROPERTY_N'] = [];
$catalogSettings['PROPERTY_X'] = $emptySelect;
$catalogSettings['PROPERTY_F'] = [];
if($catalogSettings['IBLOCK_ID']) {
    $propertyIterator = Iblock\PropertyTable::getList(
        [
            'select' => [
                'ID',
                'IBLOCK_ID',
                'NAME',
                'CODE',
                'PROPERTY_TYPE',
                'MULTIPLE',
                'LINK_IBLOCK_ID',
                'USER_TYPE',
                'SORT',
            ],
            'filter' => ['=IBLOCK_ID' => $catalogSettings['IBLOCK_ID'], '=ACTIVE' => 'Y'],
            'order'  => ['SORT' => 'ASC', 'NAME' => 'ASC'],
        ]
    );
    while($property = $propertyIterator->fetch()) {
        $propertyCode = (string)$property['CODE'];
        if($propertyCode == '') {
            $propertyCode = $property['ID'];
        }
        $propertyName = '['.$propertyCode.'] '.$property['NAME'];

        if($property['PROPERTY_TYPE'] != Iblock\PropertyTable::TYPE_FILE) {
            $arProperty[$propertyCode] = $propertyName;

            //if($property['MULTIPLE'] == 'Y') {
            if(
                $property['PROPERTY_TYPE'] === Iblock\PropertyTable::TYPE_NUMBER
                || $property['PROPERTY_TYPE'] === Iblock\PropertyTable::TYPE_STRING
                || $property['PROPERTY_TYPE'] === Iblock\PropertyTable::TYPE_LIST
                || ($property['PROPERTY_TYPE'] === Iblock\PropertyTable::TYPE_ELEMENT && (int)$property['LINK_IBLOCK_ID'] > 0)
            ) {
                $catalogSettings['PROPERTY_X'][$propertyCode] = $propertyName;
            }
        } else {
            //if($property['MULTIPLE'] == 'N') {
                $catalogSettings['PROPERTY_F'][$propertyCode] = $propertyName;
            //}
        }

        if($property['PROPERTY_TYPE'] == Iblock\PropertyTable::TYPE_NUMBER) {
            $catalogSettings['PROPERTY_N'][$propertyCode] = $propertyName;
        }
    }
    unset($propertyCode, $propertyName, $property, $propertyIterator);
}
$catalogSettings['PROPERTY_LNS'] = array_merge($emptySelect, $arProperty);
if($catalogSettings['PROPERTY_F'])
    $catalogSettings['PROPERTY_LNS'] = $catalogSettings['PROPERTY_LNS'] + $catalogSettings['PROPERTY_F'];

/*
$arIBlock_LINK = [];
$iblockFilter = (
!empty($arCurrentValues['LINK_IBLOCK_TYPE'])
    ? ['TYPE' => $arCurrentValues['LINK_IBLOCK_TYPE'], 'ACTIVE' => 'Y']
    : ['ACTIVE' => 'Y']
);
$rsIblock = CIBlock::GetList(['SORT' => 'ASC'], $iblockFilter);
while($arr = $rsIblock->Fetch()) {
    $arIBlock_LINK[$arr['ID']] = '['.$arr['ID'].'] '.$arr['NAME'];
}
unset($iblockFilter);

$arProperty_LINK = [];
if(!empty($arCurrentValues['LINK_IBLOCK_ID']) && (int)$arCurrentValues['LINK_IBLOCK_ID'] > 0) {
    $propertyIterator = Iblock\PropertyTable::getList(
        [
            'select' => [
                'ID',
                'IBLOCK_ID',
                'NAME',
                'CODE',
                'PROPERTY_TYPE',
                'MULTIPLE',
                'LINK_IBLOCK_ID',
                'USER_TYPE',
                'SORT',
            ],
            'filter' => [
                '=IBLOCK_ID'     => $arCurrentValues['LINK_IBLOCK_ID'],
                '=PROPERTY_TYPE' => Iblock\PropertyTable::TYPE_ELEMENT,
                '=ACTIVE'        => 'Y',
            ],
            'order'  => ['SORT' => 'ASC', 'NAME' => 'ASC'],
        ]
    );
    while($property = $propertyIterator->fetch()) {
        $propertyCode = (string)$property['CODE'];
        if($propertyCode == '') {
            $propertyCode = $property['ID'];
        }
        $arProperty_LINK[$propertyCode] = '['.$propertyCode.'] '.$property['NAME'];
    }
    unset($propertyCode, $property, $propertyIterator);
}*/

// user fields
$catalogSettings['USER_FIELD_S'] = $emptySelect;
$catalogSettings['USER_FIELD_F'] = $emptySelect;
if($catalogSettings['IBLOCK_ID']) {
    $arUserFields = $USER_FIELD_MANAGER->GetUserFields(
        'IBLOCK_'.$catalogSettings['IBLOCK_ID'].'_SECTION',
        0,
        LANGUAGE_ID
    );
    foreach($arUserFields as $FIELD_NAME => $arUserField) {
        $arUserField['LIST_COLUMN_LABEL'] = (string)$arUserField['LIST_COLUMN_LABEL'];
        $arProperty_UF[$FIELD_NAME] = $arUserField['LIST_COLUMN_LABEL'] ? '['.$FIELD_NAME.']'
            .$arUserField['LIST_COLUMN_LABEL'] : $FIELD_NAME;
        if($arUserField["USER_TYPE"]["BASE_TYPE"] == "string") {
            $catalogSettings['USER_FIELD_S'][$FIELD_NAME] = $arProperty_UF[$FIELD_NAME];
        }
        if($arUserField["USER_TYPE"]["BASE_TYPE"] == "file" && $arUserField['MULTIPLE'] == 'N') {
            $catalogSettings['USER_FIELD_F'][$FIELD_NAME] = $arProperty_UF[$FIELD_NAME];
        }
    }
    unset($arUserFields);
}

// Offers
$offers = false;
$catalogSettings['PROPERTY_OFFERS'] = $emptySelect;
$catalogSettings['PROPERTY_OFFERS_WITHOUT_FILE'] = $emptySelect;

$offers = CCatalogSku::GetInfoByProductIBlock($catalogSettings['IBLOCK_ID']);
if(!empty($offers)) {
    $propertyIterator = Iblock\PropertyTable::getList(
        [
            'select' => [
                'ID',
                'IBLOCK_ID',
                'NAME',
                'CODE',
                'PROPERTY_TYPE',
                'MULTIPLE',
                'LINK_IBLOCK_ID',
                'USER_TYPE',
                'SORT',
            ],
            'filter' => ['=IBLOCK_ID' => $offers['IBLOCK_ID'], '=ACTIVE' => 'Y', '!=ID' => $offers['SKU_PROPERTY_ID']],
            'order'  => ['SORT' => 'ASC', 'NAME' => 'ASC'],
        ]
    );
    while($property = $propertyIterator->fetch()) {
        $propertyCode = (string)$property['CODE'];
        if($propertyCode == '') {
            $propertyCode = $property['ID'];
        }
        $propertyName = '['.$propertyCode.'] '.$property['NAME'];

        $catalogSettings['PROPERTY_OFFERS'][$propertyCode] = $propertyName;
        if($property['PROPERTY_TYPE'] != Iblock\PropertyTable::TYPE_FILE) {
            $catalogSettings['PROPERTY_OFFERS_WITHOUT_FILE'][$propertyCode] = $propertyName;
        }
    }
    unset($propertyCode, $propertyName, $property, $propertyIterator);
}

// Catalog sort
$catalogSettings['SORT'] = CIBlockParameters::GetElementSortFields(
    ['SHOWS', 'SORT', 'TIMESTAMP_X', 'NAME', 'ID', 'ACTIVE_FROM', 'ACTIVE_TO'],
    ['KEY_LOWERCASE' => 'Y']
);

$catalogSettings['PRICE'] = [];

$catalogSettings['SORT'] = array_merge($catalogSettings['SORT'], CCatalogIBlockParameters::GetCatalogSortFields());
if(isset($catalogSettings['SORT']['CATALOG_AVAILABLE'])) {
    unset($catalogSettings['SORT']['CATALOG_AVAILABLE']);
}
$catalogSettings['PRICE'] = CCatalogIBlockParameters::getPriceTypesList();


$catalogSettings['ASC_DESC'] = array(
    "asc" => Loc::getMessage($module_id."_IBLOCK_SORT_ASC"),
    "desc" => Loc::getMessage($module_id."_IBLOCK_SORT_DESC"),
);


// Properties list
if (isset($catalogSettings['IBLOCK_ID']) && (int)$catalogSettings['IBLOCK_ID'] > 0) {

    // Property IBLOCK
    $catalogSettings['ALL_PROP_LIST'] = [];
    $catalogSettings['FILE_PROP_LIST'] = $emptySelect;
    $catalogSettings['LIST_PROP_LIST'] = $emptySelect;
    $rsProps = CIBlockProperty::GetList(
        ['SORT' => 'ASC', 'ID' => 'ASC'],
        ['IBLOCK_ID' => $catalogSettings['IBLOCK_ID'], 'ACTIVE' => 'Y']
    );
    while($arProp = $rsProps->Fetch()) {
        $strPropName = '['.$arProp['ID'].']'.('' != $arProp['CODE'] ? '['.$arProp['CODE'].']' : '').' '.$arProp['NAME'];
        if('' == $arProp['CODE']) {
            $arProp['CODE'] = $arProp['ID'];
        }
        $catalogSettings['ALL_PROP_LIST'][$arProp['CODE']] = $strPropName;
        if('F' == $arProp['PROPERTY_TYPE']) {
            $catalogSettings['FILE_PROP_LIST'][$arProp['CODE']] = $strPropName;
        }
        if('L' == $arProp['PROPERTY_TYPE']) {
            $catalogSettings['LIST_PROP_LIST'][$arProp['CODE']] = $strPropName;
        }
    }


    // Property SKU IBLOCK
    $arSKU = false;
    $catalogSettings['IBLOCK_SKU'] = false;
    if (isset($catalogSettings['IBLOCK_ID']) && (int)$catalogSettings['IBLOCK_ID'] > 0)
    {
        $arSKU = CCatalogSKU::GetInfoByProductIBlock($catalogSettings['IBLOCK_ID']);
        $catalogSettings['IBLOCK_SKU'] = !empty($arSKU) && is_array($arSKU);
    }

    $catalogSettings['ALL_OFFER_PROP_LIST'] = [];
    $catalogSettings['FILE_OFFER_PROP_LIST'] = $emptySelect;
    $catalogSettings['TREE_OFFER_PROP_LIST'] = $emptySelect;
    $rsProps = CIBlockProperty::GetList(
        array('SORT' => 'ASC', 'ID' => 'ASC'),
        array('IBLOCK_ID' => $arSKU['IBLOCK_ID'], 'ACTIVE' => 'Y')
    );
    while ($arProp = $rsProps->Fetch())
    {
        if ($arProp['ID'] == $arSKU['SKU_PROPERTY_ID'])
            continue;
        $arProp['USER_TYPE'] = (string)$arProp['USER_TYPE'];
        $strPropName = '['.$arProp['ID'].']'.('' != $arProp['CODE'] ? '['.$arProp['CODE'].']' : '').' '.$arProp['NAME'];
        if ('' == $arProp['CODE'])
            $arProp['CODE'] = $arProp['ID'];
        $catalogSettings['ALL_OFFER_PROP_LIST'][$arProp['CODE']] = $strPropName;
        if ('F' == $arProp['PROPERTY_TYPE'])
            $catalogSettings['FILE_OFFER_PROP_LIST'][$arProp['CODE']] = $strPropName;
        if ('N' != $arProp['MULTIPLE'])
            continue;
        if (
            'L' == $arProp['PROPERTY_TYPE']
            || 'E' == $arProp['PROPERTY_TYPE']
            || ('S' == $arProp['PROPERTY_TYPE'] && 'directory' == $arProp['USER_TYPE'] && CIBlockPriceTools::checkPropDirectory($arProp))
        )
            $catalogSettings['TREE_OFFER_PROP_LIST'][$arProp['CODE']] = $strPropName;
    }
}