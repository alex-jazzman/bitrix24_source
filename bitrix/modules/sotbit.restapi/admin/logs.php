<?php

use Bitrix\Main\Localization\Loc;
use Bitrix\Sale\Internals\PersonTypeTable;
use Bitrix\Main\GroupTable;
use Bitrix\Main\Config\Option;
use Bitrix\Main\Application;
use Bitrix\Main\Loader;
use Sotbit\RestAPI\Model\LogTable;
use Sotbit\RestAPI\Config\Config;
use Sotbit\RestAPI\Core\Helper;

require_once($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/prolog_admin_before.php");
Loader::includeModule('sotbit.restapi');
Loc::loadMessages(__FILE__);
global $APPLICATION;

if($APPLICATION->GetGroupRight("main") < "R") {
    $APPLICATION->AuthForm(Loc::getMessage("ACCESS_DENIED"));
}

$moduleId = \SotbitRestAPI::MODULE_ID;
$request = Application::getInstance()->getContext()->getRequest();
$siteID = $request->getQuery('site');
$db = Application::getConnection();
$tableName = LogTable::getTableName();

// check table
$db = Application::getConnection();
$logTable = LogTable::getEntity();
if(!$db->isTableExists($logTable->getDBTableName())) {
    $logTable->createDbTable();
}


$objectListSort = new CAdminSorting($tableName, $by, $order);
$objectList = new CAdminList($tableName, $objectListSort);

function filterCheck()
{
    global $arFilterFields, $objectList;
    foreach($arFilterFields as $f) {
        global $$f;
    }

    return count($objectList->arFilterErrors) == 0;
}

$fields = [
    'find_id'                 => Loc::getMessage($moduleId.'_ID'),
    'find_date'               => Loc::getMessage($moduleId.'_DATE'),
    'find_request_method'     => Loc::getMessage($moduleId.'_REQUEST_METHOD'),
    'find_request_path'       => Loc::getMessage($moduleId.'_REQUEST_PATH'),
    'find_user_id'            => Loc::getMessage($moduleId.'_USER_ID'),
    'find_response_http_code' => Loc::getMessage($moduleId.'_RESPONSE_HTTP_CODE'),
    'find_ip'                 => Loc::getMessage($moduleId.'_IP'),
];
if($request->get("action_button") === "delete" && ($ids = $objectList->groupAction())) {
    $ids = array_map("intval", $ids);

    if($request->get("action_target") === 'selected') {
        if($db->isTableExists($tableName)) {
            $db->truncateTable($tableName);
        }
    } else {
        if(is_array($ids)) {
            foreach($ids as $_ids) {
                LogTable::delete($_ids);
            }
        } elseif(is_numeric($ids)) {
            LogTable::delete($ids);
        }
    }
}

$arFilterFields = array_keys($fields);
$arFilter = [];
$objectList->InitFilter($arFilterFields);
InitSorting();
if(filterCheck()) {
    $arFilter = [];
    if($find_id) {
        $arFilter['ID'] = $find_id;
    }
    if($find_date) {
        $arFilter['DATE'] = $find_date;
    }
    if($find_method) {
        $arFilter['%REQUEST_METHOD'] = $find_request_method;
    }
    if($find_path) {
        $arFilter['%REQUEST_PATH'] = $find_request_path;
    }
    if($find_user_id) {
        $arFilter['=USER_ID'] = $find_user_id;
    }

    if($find_http_code) {
        $arFilter['%RESPONSE_HTTP_CODE'] = $find_response_http_code;
    }
    if($find_ip) {
        $arFilter['%IP'] = $find_ip;
    }
}
$by = !empty($by) ? $by : 'ID';
$order = !empty($order) ? $order : 'DESC';
$arSort[$by] = $order;

$arNavParams = (isset($request['mode']) && $request['mode'] === 'excel')
    ? false
    : ['nPageSize' => CAdminResult::GetNavSize($tableName)];

$objectListData = LogTable::getList(
    [
        'filter' => $arFilter,
        'order'  => $arSort,
    ]
);

$objectListData = new CAdminResult($objectListData, $tableName);
$objectListData->NavStart();
$objectList->NavText($objectListData->GetNavPrint(''));

$objectList->AddHeaders(
    [
        [
            'id'      => 'ID',
            'content' => Loc::getMessage($moduleId.'_ID'),
            'sort'    => 'ID',
            'default' => true,
            'align'   => 'right',
        ],
        [
            'id'      => 'DATE',
            'content' => Loc::getMessage($moduleId.'_DATE'),
            'sort'    => 'DATE',
            'default' => true,
        ],
        [
            'id'      => 'REQUEST_METHOD',
            'content' => Loc::getMessage($moduleId.'_REQUEST_METHOD'),
            'sort'    => 'REQUEST_METHOD',
            'default' => true,
        ],
        [
            'id'      => 'REQUEST_PATH',
            'content' => Loc::getMessage($moduleId.'_REQUEST_PATH'),
            'sort'    => 'REQUEST_PATH',
            'default' => true,
        ],
        [
            'id'      => 'USER_ID',
            'content' => Loc::getMessage($moduleId.'_USER_ID'),
            'sort'    => 'USER_ID',
            'default' => true,
        ],
        [
            'id'      => 'RESPONSE_HTTP_CODE',
            'content' => Loc::getMessage($moduleId.'_RESPONSE_HTTP_CODE'),
            'sort'    => 'RESPONSE_HTTP_CODE',
            'default' => true,
        ],
        [
            'id'      => 'IP',
            'content' => Loc::getMessage($moduleId.'_IP'),
            'sort'    => 'IP',
            'default' => true,
        ],
    ]
);

while($ar = $objectListData->fetch()) {
    $row =& $objectList->AddRow($ar['ID'], $ar);
}
$objectList->AddGroupActionTable(['delete' => true]);
$objectList->CheckListMode();

$oFilter = new CAdminFilter($tableName.'_filter', $fields);
require_once $_SERVER['DOCUMENT_ROOT'].'/bitrix/modules/main/include/prolog_admin_after.php';

if(!Config::getInstance()->isLog()) {
    echo Helper::error(Loc::getMessage($moduleId."_LOG_IS_DISABLE"));
}

?>
    <form name="filter" method="GET" action="<?= $APPLICATION->GetCurPage() ?>?">
        <input type="hidden" name="lang" value="<?= LANGUAGE_ID ?>">
        <? $oFilter->Begin() ?>
        <tr>
            <td>ID:</td>
            <td><?= InputType('text', 'find_id', htmlspecialcharsbx($find_id), false) ?></td>
        </tr>
        <tr>
            <td><?= Loc::getMessage($moduleId.'_DATE') ?>:</td>
            <td><?= CalendarDate(
                    'find_date',
                    $find_date,
                    'filter',
                    'Y'
                ) ?></td>
        </tr>
        <tr>
            <td><?= Loc::getMessage($moduleId.'_REQUEST_METHOD') ?>:</td>
            <td><?= InputType('text', 'find_request_method', htmlspecialcharsbx($find_request_method), false) ?></td>
        </tr>
        <tr>
            <td><?= Loc::getMessage($moduleId.'_REQUEST_PATH') ?>:</td>
            <td><?= InputType('text', 'find_request_path', htmlspecialcharsbx($find_request_path), false) ?></td>
        </tr>
        <tr>
            <td><?= Loc::getMessage($moduleId.'_USER_ID') ?>:</td>
            <td><?= InputType('text', 'find_user_id', htmlspecialcharsbx($find_user_id), false) ?></td>
        </tr>

        <tr>
            <td><?= Loc::getMessage($moduleId.'_RESPONSE_HTTP_CODE') ?>:</td>
            <td><?= InputType(
                    'text',
                    'find_response_http_code',
                    htmlspecialcharsbx($find_response_http_code),
                    false
                ) ?></td>
        </tr>

        <tr>
            <td><?= Loc::getMessage($moduleId.'_IP') ?>:</td>
            <td><?= InputType('text', 'find_ip', htmlspecialcharsbx($find_ip), false) ?></td>
        </tr>
        <?
        $oFilter->Buttons(['table_id' => $tableName, 'url' => $APPLICATION->GetCurPage(), 'form' => 'filter']);
        $oFilter->End();
        ?>
    </form>
<?php
$objectList->DisplayList();

require_once $_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/epilog_admin.php";