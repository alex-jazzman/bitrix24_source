<?php

use Bitrix\BIConnectorMobile\Integration\CatalogMobile\DocumentTabProvider;
use Bitrix\BIConnectorMobile\Integration\CrmMobile\AnalyticsTabProvider;
use Bitrix\BIConnectorMobile\Integration\Mobile\ProfileTabProvider;
use Bitrix\BIConnectorMobile\MobileMenuManager;
use Bitrix\BIConnectorMobile\Workspace;
use Bitrix\Main\Config\Option;
use Bitrix\Main\EventManager;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\ModuleManager;

Loc::loadMessages(__FILE__);

class biconnectormobile extends CModule
{
	public $MODULE_ID = 'biconnectormobile';
	public $MODULE_VERSION;
	public $MODULE_VERSION_DATE;
	public $MODULE_NAME;
	public $MODULE_DESCRIPTION;

	private $workspaceClass = Workspace::class;

	public function __construct()
	{
		$arModuleVersion = [];

		include(__DIR__ . '/version.php');

		if (is_array($arModuleVersion) && $arModuleVersion['VERSION'] && $arModuleVersion['VERSION_DATE'])
		{
			$this->MODULE_VERSION = $arModuleVersion['VERSION'];
			$this->MODULE_VERSION_DATE = $arModuleVersion['VERSION_DATE'];
		}

		$this->MODULE_NAME = Loc::getMessage('BICONNECTORMOBILE_MODULE_NAME');
		$this->MODULE_DESCRIPTION = Loc::getMessage('BICONNECTORMOBILE_MODULE_DESCRIPTION');
	}

	public function installDB()
	{
		ModuleManager::registerModule($this->MODULE_ID);

		EventManager::getInstance()->registerEventHandler(
			'mobileapp',
			'onJNComponentWorkspaceGet',
			$this->MODULE_ID,
			$this->workspaceClass,
			'getPath',
		);

		return true;
	}

	public function uninstallDB($arParams = [])
	{
		EventManager::getInstance()->unRegisterEventHandler(
			'mobileapp',
			'onJNComponentWorkspaceGet',
			$this->MODULE_ID,
			$this->workspaceClass,
			'getPath',
		);

		// The module keeps no tables, and its only option is the feature switch: nothing here is worth keeping,
		// and a switch left behind would silently bring the section back on the next installation.
		Option::delete($this->MODULE_ID);

		ModuleManager::unRegisterModule($this->MODULE_ID);
	}

	public function installEvents()
	{
		EventManager::getInstance()->registerEventHandler(
			'mobile',
			'onMobileMenuStructureBuilt',
			$this->MODULE_ID,
			MobileMenuManager::class,
			'onMobileMenuStructureBuilt',
		);

		EventManager::getInstance()->registerEventHandler(
			'crmmobile',
			'onGetTabs',
			$this->MODULE_ID,
			AnalyticsTabProvider::class,
			'onGetTabs',
		);

		EventManager::getInstance()->registerEventHandler(
			'catalogmobile',
			'onGetDocumentTabs',
			$this->MODULE_ID,
			DocumentTabProvider::class,
			'onGetDocumentTabs',
		);

		EventManager::getInstance()->registerEventHandler(
			'mobile',
			'onProfileTabsCollect',
			$this->MODULE_ID,
			ProfileTabProvider::class,
			'onProfileTabsCollect',
		);
	}

	public function uninstallEvents()
	{
		EventManager::getInstance()->unRegisterEventHandler(
			'mobile',
			'onMobileMenuStructureBuilt',
			$this->MODULE_ID,
			MobileMenuManager::class,
			'onMobileMenuStructureBuilt',
		);

		EventManager::getInstance()->unRegisterEventHandler(
			'crmmobile',
			'onGetTabs',
			$this->MODULE_ID,
			AnalyticsTabProvider::class,
			'onGetTabs',
		);

		EventManager::getInstance()->unRegisterEventHandler(
			'catalogmobile',
			'onGetDocumentTabs',
			$this->MODULE_ID,
			DocumentTabProvider::class,
			'onGetDocumentTabs',
		);

		EventManager::getInstance()->unRegisterEventHandler(
			'mobile',
			'onProfileTabsCollect',
			$this->MODULE_ID,
			ProfileTabProvider::class,
			'onProfileTabsCollect',
		);
	}

	public function installFiles()
	{
		CopyDirFiles(
			$_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/' . $this->MODULE_ID . '/install/mobileapp/',
			$_SERVER['DOCUMENT_ROOT'] . '/bitrix/mobileapp/',
			true,
			true,
		);

		return true;
	}

	public function uninstallFiles(): void
	{
		DeleteDirFilesEx('/bitrix/mobileapp/' . $this->MODULE_ID);
		// The frame page of the detail screen is not deleted here: it lives in the public tree of the module
		// mobile (mobile/public/mobile/biconnector), the same way the mobile KB page belongs to it.
	}

	private function installDependencies(): void
	{
		$pathToMobile = $_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/mobile/install/index.php';

		if (!ModuleManager::isModuleInstalled('mobile') && file_exists($pathToMobile))
		{
			include_once($pathToMobile);

			$mobile = new mobile();
			$mobile->InstallFiles();
			$mobile->InstallDB();
		}
	}

	public function doInstall()
	{
		global $USER, $APPLICATION;

		if (!$USER->isAdmin())
		{
			return;
		}

		// Nothing to ask the administrator about, so the module list installs the module right away and the page
		// below only reports the outcome.
		if (ModuleManager::isModuleInstalled('biconnector'))
		{
			$this->installDB();
			$this->installFiles();
			$this->installEvents();
			$this->installDependencies();
		}
		else
		{
			$APPLICATION->throwException(Loc::getMessage('BICONNECTORMOBILE_MODULE_INSTALL_ERROR_BICONNECTOR'));
		}

		$APPLICATION->includeAdminFile(
			Loc::getMessage('BICONNECTORMOBILE_INSTALL_TITLE'),
			$this->getInstallPagePath('step.php'),
		);
	}

	public function doUninstall()
	{
		global $USER, $APPLICATION;

		if (!$USER->isAdmin())
		{
			return;
		}

		$step = (int)($_REQUEST['step'] ?? 1);

		if ($step < 2)
		{
			$APPLICATION->includeAdminFile(
				Loc::getMessage('BICONNECTORMOBILE_UNINSTALL_TITLE'),
				$this->getInstallPagePath('unstep1.php'),
			);

			return;
		}

		if ($step === 2)
		{
			$this->uninstallDB();
			$this->uninstallEvents();
			$this->uninstallFiles();

			$APPLICATION->includeAdminFile(
				Loc::getMessage('BICONNECTORMOBILE_UNINSTALL_TITLE'),
				$this->getInstallPagePath('unstep2.php'),
			);
		}
	}

	private function getInstallPagePath(string $page): string
	{
		return $_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/' . $this->MODULE_ID . '/install/' . $page;
	}
}
