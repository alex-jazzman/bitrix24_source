<?php

use Bitrix\Main\Application;
use Bitrix\Main\EventManager;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\Config\Option;
use Sotbit\RestAPI\Model;
use Bitrix\Main\Loader;
use Sotbit\RestAPI\Core;

Loc::loadMessages(__FILE__);

require_once($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/classes/general/update_client.php");
require_once($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/classes/general/update_client_partner.php");

Class sotbit_restapi extends CModule {
    const MODULE_ID = 'sotbit.restapi';
    public $MODULE_ID = 'sotbit.restapi';
    public $MODULE_VERSION;
    public $MODULE_VERSION_DATE;
    public $MODULE_NAME;
    public $MODULE_DESCRIPTION;
    public $MODULE_CSS;
    public $strError = '';

    public function __construct() {
        $arModuleVersion = array();
        include(__DIR__."/version.php");
        $this->MODULE_VERSION       = $arModuleVersion["VERSION"];
        $this->MODULE_VERSION_DATE  = $arModuleVersion["VERSION_DATE"];
        $this->MODULE_NAME          = Loc::getMessage("SOTBIT_RESTAPI_MODULE_NAME");
        $this->MODULE_DESCRIPTION   = Loc::getMessage("SOTBIT_RESTAPI_MODULE_DESC");
        $this->PARTNER_NAME         = Loc::getMessage("SOTBIT_RESTAPI_PARTNER_NAME");
        $this->PARTNER_URI          = Loc::getMessage("SOTBIT_RESTAPI_PARTNER_URI");
    }

    public function DoInstall() {
        global $APPLICATION;
        $this->InstallFiles();
        $request = Application::getInstance()->getContext()->getRequest();

        if($request->get('step') == 1)
        {
            RegisterModule(self::MODULE_ID);
            $this->InstallDB();
            $this->InstallEvents();

            $this->sendMetric($request);
        }
        else
        {
            $APPLICATION->IncludeAdminFile(GetMessage("INSTALL_TITLE"), $_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/sotbit.restapi/install/step.php");
        }
    }

    public function DoUninstall() {
        $this->UnInstallFiles();
        $this->UnInstallEvents();
        $this->UnInstallDB();
        UnRegisterModule(self::MODULE_ID);
    }

    public function InstallEvents() {
        EventManager::getInstance()->registerEventHandler(
            "main",
            "OnBuildGlobalMenu",
            self::MODULE_ID,
            '\Sotbit\RestApi\Core\EventHandlers',
            'onBuildGlobalMenuHandler'
        );
        EventManager::getInstance()->registerEventHandler(
            'main',
            'OnBeforeProlog',
            self::MODULE_ID,
            '\Sotbit\RestApi\Core\EventHandlers',
            'onBeforeProlog'
        );
        return true;
    }

    public function UnInstallEvents() {
        EventManager::getInstance()->unregisterEventHandler(
            "main",
            "OnBuildGlobalMenu",
            self::MODULE_ID,
            '\Sotbit\RestApi\Core\EventHandlers',
            'onBuildGlobalMenuHandler'
        );
        EventManager::getInstance()->unregisterEventHandler(
            'main',
            'OnBeforeProlog',
            self::MODULE_ID,
            '\Sotbit\RestApi\Core\EventHandlers',
            'onBeforeProlog'
        );
        return true;
    }

    public function InstallFiles($arParams = array()) {
        CopyDirFiles(Application::getDocumentRoot()."/bitrix/modules/".self::MODULE_ID."/install/themes/", Application::getDocumentRoot()."/bitrix/themes/", true, true );
        CopyDirFiles(Application::getDocumentRoot().'/bitrix/modules/'.self::MODULE_ID.'/install/admin',   Application::getDocumentRoot().'/bitrix/admin', true);
        return true;
    }

    public function UnInstallFiles() {
        DeleteDirFiles(Application::getDocumentRoot()."/bitrix/modules/".self::MODULE_ID."/install/themes/.default/", Application::getDocumentRoot()."/bitrix/themes/.default" );
        DeleteDirFiles(Application::getDocumentRoot().'/bitrix/modules/'.self::MODULE_ID.'/install/admin', Application::getDocumentRoot().'/bitrix/admin');
        return true;
    }

    public function InstallDB($arParams = array()) {
        Loader::includeModule(self::MODULE_ID);
        $db = Application::getConnection();

        // Options
        Option::set(self::MODULE_ID, "ACTIVE", "Y");
        Option::set(self::MODULE_ID, "DEBUG", "N");
        Option::set(self::MODULE_ID, "URL", "/sotbit_api");
        Option::set(self::MODULE_ID, "SECRET_KEY", Core\Helper::generateSecretKey());
        Option::set(self::MODULE_ID, "TOKEN_EXPIRE", 7 * 24 * 60 * 60);

        // Tables
        $logTable = Model\LogTable::getEntity();

        if(!$db->isTableExists($logTable->getDBTableName())) {
            $logTable->createDbTable();
        }

        return true;
    }

    public function UnInstallDB($arParams = array()) {
        Loader::includeModule(self::MODULE_ID);
        $db = Application::getConnection();

        $logTable = Model\LogTable::getEntity();

        if($db->isTableExists($logTable->getDBTableName())) {
            $db->dropTable($logTable->getDBTableName());
        }

        return true;
    }

    /**
     * Send metrics for sotbit company
     * @param $request
     */
    public function sendMetric($request)
    {
        if($_SERVER['SERVER_NAME']){
            $site = $_SERVER['SERVER_NAME'];
        }
        elseif($_SERVER['HTTP_HOST']){
            $site = $_SERVER['HTTP_HOST'];
        }
        $str = '';
        $arUpdateList = \CUpdateClient::GetUpdatesList($str);
        $content = array(
            'ACTION' => 'ADD',
            'SITE' => $site,
            'KEY' => md5("BITRIX".\CUpdateClientPartner::GetLicenseKey()."LICENCE"),
            'LICENSE' => $arUpdateList["CLIENT"][0]["@"]["LICENSE"],
            'MODULE' => self::MODULE_ID,
            'NAME' => $request->get('Name'),
            'EMAIL' => $request->get('Email'),
            'PHONE' => $request->get('Phone'),
            'BITRIX_DATE_FROM' => $arUpdateList["CLIENT"][0]["@"]["DATE_FROM"],
            'BITRIX_DATE_TO' => $arUpdateList["CLIENT"][0]["@"]["DATE_TO"],
        );

        $jsonContent = json_encode($content);
        if(json_last_error()) {
            $jsonContent = json_encode(mb_convert_encoding($content, "UTF-8", SITE_CHARSET), JSON_UNESCAPED_UNICODE);
        }

        $options = array (
            'http' => array (
                'method' => 'POST',
                'header' => "Content-Type: application/json; charset=utf-8\r\n",
                'content' => $jsonContent
            )
        );

        if(!json_last_error()) {
            $context = stream_context_create($options);
            $answer =  file_get_contents('https://www.sotbit.ru:443/api/datacollection/index.php', 0, $context);
        }
    }
}