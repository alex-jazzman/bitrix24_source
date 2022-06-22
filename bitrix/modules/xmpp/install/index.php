<?php
use Bitrix\Main;
use Bitrix\Main\Localization\Loc;

if(class_exists('xmpp'))
{
	return;
}

Loc::loadMessages(__FILE__);

class xmpp extends \CModule
{
	public $MODULE_ID = "xmpp";
	public $MODULE_VERSION;
	public $MODULE_VERSION_DATE;
	public $MODULE_NAME;
	public $MODULE_DESCRIPTION;

	public function __construct()
	{
		$arModuleVersion = array();

		include(__DIR__.'/version.php');

		if (is_array($arModuleVersion) && array_key_exists("VERSION", $arModuleVersion))
		{
			$this->MODULE_VERSION = $arModuleVersion["VERSION"];
			$this->MODULE_VERSION_DATE = $arModuleVersion["VERSION_DATE"];
		}
		else
		{
			$this->MODULE_VERSION = XMPP_VERSION;
			$this->MODULE_VERSION_DATE = XMPP_VERSION_DATE;
		}

		$this->MODULE_NAME = Loc::getMessage("XMPP_MODULE_NAME");
		$this->MODULE_DESCRIPTION = Loc::getMessage("XMPP_MODULE_DESC");
	}

	public function InstallDB($arParams = array())
	{
		Main\ModuleManager::registerModule($this->MODULE_ID);
		$eventManager = Main\EventManager::getInstance();
		$eventManager->registerEventHandlerCompatible("socialnetwork", "OnSocNetMessagesAdd", $this->MODULE_ID, "CXMPPFactory", "OnSocNetMessagesAdd");
		$eventManager->registerEventHandlerCompatible("im", "OnAfterMessagesAdd", $this->MODULE_ID, "CXMPPFactory", "OnSocNetMessagesAdd");
		$eventManager->registerEventHandlerCompatible("im", "OnAfterMessagesUpdate", $this->MODULE_ID, "CXMPPFactory", "OnImMessagesUpdate");
		$eventManager->registerEventHandlerCompatible("im", "OnAfterMessagesDelete", $this->MODULE_ID, "CXMPPFactory", "OnImMessagesUpdate");
		$eventManager->registerEventHandlerCompatible("im", "OnAfterFileUpload", $this->MODULE_ID, "CXMPPFactory", "OnImFileUpload");
		$eventManager->registerEventHandlerCompatible("im", "OnAfterNotifyAdd", $this->MODULE_ID, "CXMPPFactory", "OnSocNetMessagesAdd");
		$eventManager->registerEventHandlerCompatible("main", "OnApplicationsBuildList", "main", '\Bitrix\Xmpp\XmppApplication', "onApplicationsBuildList", 100, "modules/xmpp/lib/xmppapplication.php"); // main here is not a mistake

		return true;
	}

	public function UnInstallDB($arParams = array())
	{
		$eventManager = Main\EventManager::getInstance();
		$eventManager->unRegisterEventHandler("socialnetwork", "OnSocNetMessagesAdd", $this->MODULE_ID, "CXMPPFactory", "OnSocNetMessagesAdd");
		$eventManager->unRegisterEventHandler("im", "OnAfterMessagesAdd", $this->MODULE_ID, "CXMPPFactory", "OnSocNetMessagesAdd");
		$eventManager->unRegisterEventHandler("im", "OnAfterMessagesUpdate", $this->MODULE_ID, "CXMPPFactory", "OnImMessagesUpdate");
		$eventManager->unRegisterEventHandler("im", "OnAfterMessagesDelete", $this->MODULE_ID, "CXMPPFactory", "OnImMessagesUpdate");
		$eventManager->unRegisterEventHandler("im", "OnAfterFileUpload", $this->MODULE_ID, "CXMPPFactory", "OnImFileUpload");
		$eventManager->unRegisterEventHandler("im", "OnAfterNotifyAdd", $this->MODULE_ID, "CXMPPFactory", "OnSocNetMessagesAdd");
		$eventManager->unRegisterEventHandler("main", "OnApplicationsBuildList", "main", '\Bitrix\Xmpp\XmppApplication', "onApplicationsBuildList", "modules/xmpp/lib/xmppapplication.php"); // main here is not a mistake
		Main\ModuleManager::unRegisterModule($this->MODULE_ID);
		return true;
	}

	/**
	 * @return bool
	 */
	public function InstallFiles()
	{
		if($_ENV["COMPUTERNAME"]!='BX')
		{
			CopyDirFiles($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/xmpp/install/admin", $_SERVER["DOCUMENT_ROOT"]."/bitrix/admin", true, true);
			CopyDirFiles($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/xmpp/install/themes", $_SERVER["DOCUMENT_ROOT"]."/bitrix/themes", true, true);
		}
		return true;
	}

	/**
	 * @return bool
	 */
	public function UnInstallFiles()
	{
		DeleteDirFiles($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/xmpp/install/admin", $_SERVER["DOCUMENT_ROOT"]."/bitrix/admin");
		DeleteDirFiles($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/xmpp/install/themes", $_SERVER["DOCUMENT_ROOT"]."/bitrix/themes");

		return true;
	}

	/**
	 * @return void
	 */
	public function DoInstall()
	{
		global $APPLICATION;

		if (Main\ModuleManager::isModuleInstalled($this->MODULE_ID))
		{
			return;
		}
		if (!check_bitrix_sessid())
		{
			return;
		}

		$this->InstallDB();
		$this->InstallFiles();

		$APPLICATION->IncludeAdminFile(Loc::getMessage("XMPP_INSTALL_TITLE"), $_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/xmpp/install/step.php");
	}

	/**
	 * @return void
	 */
	public function DoUninstall()
	{
		global $APPLICATION;

		if (!check_bitrix_sessid())
		{
			return;
		}

		$this->UnInstallDB();
		$this->UnInstallFiles();

		$APPLICATION->IncludeAdminFile(Loc::getMessage("XMPP_UNINSTALL_TITLE"), $_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/xmpp/install/unstep.php");
	}
}
