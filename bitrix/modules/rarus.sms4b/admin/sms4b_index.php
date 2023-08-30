<?php
require_once($_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/main/include/prolog_admin_before.php');

use Bitrix\Main\Application;
use \Bitrix\Main\Localization\Loc;

$request = Application::getInstance()->getContext()->getRequest();
Loc::loadLanguageFile(__FILE__);

if ($GLOBALS['APPLICATION']->GetGroupRight('rarus.sms4b') < 'R') {
    $GLOBALS['APPLICATION']->AuthForm(Loc::getMessage('SMS4B_MAIN_ACCESS_DENIED'));
}

$GLOBALS['APPLICATION']->SetTitle(Loc::getMessage('SMS4B_MAIN_SMS4B_INDEX_TITLE'));

if ($request->getQuery('mode') === 'list') {
    require($_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/main/include/prolog_admin_js.php');
} else {
    require_once($_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/main/include/prolog_admin_after.php');
}

global $adminPage;
$adminPage->ShowSectionIndex('menu_sms4b', 'rarus.sms4b');

if ($request->getQuery('mode') === 'list') {
    require($_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/main/include/epilog_admin_js.php');
} else {
    require_once($_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/main/include/epilog_admin.php');
}
