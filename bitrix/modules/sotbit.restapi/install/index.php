<?php

use Bitrix\Main\Application;
use Bitrix\Main\EventManager;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\Config\Option;
use Sotbit\RestAPI\Model;
use Bitrix\Main\Loader;
use Sotbit\RestAPI\Core;

Loc::loadMessages(__FILE__);

Class sotbit_restapi extends CModule {
    const MODULE_ID = 'sotbit.restapi';
    public $MODULE_ID = 'sotbit.restapi';
    public $MODULE_VERSION;
    public $MODULE_VERSION_DATE;
    public $MODULE_NAME;
    public $MODULE_DESCRIPTION;
    public $MODULE_CSS;
    public $strError = '';
    public $db;
    public $request;
    public $tables;

    public function __construct() {
        $arModuleVersion = array();
        include(__DIR__."/version.php");
        $this->MODULE_VERSION       = $arModuleVersion["VERSION"];
        $this->MODULE_VERSION_DATE  = $arModuleVersion["VERSION_DATE"];
        $this->MODULE_NAME          = Loc::getMessage("SOTBIT_RESTAPI_MODULE_NAME");
        $this->MODULE_DESCRIPTION   = Loc::getMessage("SOTBIT_RESTAPI_MODULE_DESC");
        $this->PARTNER_NAME         = Loc::getMessage("SOTBIT_RESTAPI_PARTNER_NAME");
        $this->PARTNER_URI          = Loc::getMessage("SOTBIT_RESTAPI_PARTNER_URI");

        $this->db = Application::getConnection();
        $this->request = Application::getInstance()->getContext()->getRequest();
        $this->tables = [
            Model\LogTable::class
        ];
    }

    public function DoInstall() {
        global $APPLICATION;
        $this->InstallFiles();

        if($this->request->get('step') == 1)
        {
            RegisterModule(self::MODULE_ID);
            $this->InstallDB();
            $this->InstallEvents();

            $this->sendMetric($this->request);
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

        // Options
        Option::set(self::MODULE_ID, "ACTIVE", "Y");
        Option::set(self::MODULE_ID, "DEBUG", "N");
        Option::set(self::MODULE_ID, "URL", "/sotbit_api");
        Option::set(self::MODULE_ID, "SECRET_KEY", $this->generateSecretKey());
        Option::set(self::MODULE_ID, "TOKEN_EXPIRE", 7 * 24 * 60 * 60);

        // Tables
        foreach($this->tables as $class) {
            $classEntity = $class::getEntity();
            if(!$this->db->isTableExists($classEntity->getDBTableName())) {
                $classEntity->createDbTable();
            }
        }

        return true;
    }

    public function UnInstallDB($arParams = array()) {
        Loader::includeModule(self::MODULE_ID);

        // Tables
        foreach($this->tables as $class) {
            $classEntity = $class::getEntity();
            if($this->db->isTableExists($classEntity->getDBTableName())) {
                $this->db->dropTable($classEntity->getDBTableName());
            }
        }

        return true;
    }

    /**
     * Send metrics for sotbit company
     * @param $request
     */
    public function sendMetric($request)
    {
        $content = array(
            'ACTION' => 'ADD',
            'KEY' => md5("BITRIX". \Bitrix\Main\Application::getInstance()->getLicense()->getKey() . "LICENCE"),
            'MODULE' => self::MODULE_ID,
            'NAME' => $request->get('Name'),
            'EMAIL' => $request->get('Email'),
            'PHONE' => $request->get('Phone'),
            'SITE' => $request->get('Site'),
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

    public function generateSecretKey(): string
    {
        return sprintf(
            '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            random_int(0, 0xffff),
            random_int(0, 0xffff),
            random_int(0, 0xffff),
            random_int(0, 0x0fff) | 0x4000,
            random_int(0, 0x3fff) | 0x8000,
            random_int(0, 0xffff),
            random_int(0, 0xffff),
            random_int(0, 0xffff)
        );
    }
}