<?php

use Bitrix\Main\EventManager;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\ModuleManager;

Loc::loadMessages(__FILE__);

class MailMobile extends CModule
{
	public $MODULE_ID = 'mailmobile';
	public $MODULE_VERSION;
	public $MODULE_VERSION_DATE;
	public $MODULE_NAME;
	public $MODULE_DESCRIPTION;

	private $workspaceClass = \Bitrix\MailMobile\Workspace::class;

	public function __construct()
	{
		$arModuleVersion = [];
		include(__DIR__ . '/version.php');

		if (is_array($arModuleVersion) && $arModuleVersion['VERSION'] && $arModuleVersion['VERSION_DATE'])
		{
			$this->MODULE_VERSION = $arModuleVersion['VERSION'];
			$this->MODULE_VERSION_DATE = $arModuleVersion['VERSION_DATE'];
		}

		$this->MODULE_NAME = Loc::getMessage('MAILMOBILE_MODULE_NAME');
		$this->MODULE_DESCRIPTION = Loc::getMessage('MAILMOBILE_MODULE_DESCRIPTION');
	}

	public function installDB(): bool
	{
		ModuleManager::registerModule($this->MODULE_ID);

		$eventManager = EventManager::getInstance();

		$eventManager->registerEventHandler(
			'mobileapp',
			'onJNComponentWorkspaceGet',
			$this->MODULE_ID,
			$this->workspaceClass,
			'getPath'
		);

		return true;
	}

	public function uninstallDB($arParams = []): void
	{
		$eventManager = EventManager::getInstance();

		$eventManager->unRegisterEventHandler(
			'mobileapp',
			'onJNComponentWorkspaceGet',
			$this->MODULE_ID,
			$this->workspaceClass,
			'getPath'
		);

		ModuleManager::unRegisterModule($this->MODULE_ID);
	}

	public function installFiles(): bool
	{
		CopyDirFiles(
			$_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/mailmobile/install/mobileapp/',
			$_SERVER['DOCUMENT_ROOT'] . '/bitrix/mobileapp/',
			true,
			true
		);

		return true;
	}

	public function uninstallFiles(): void
	{
	}

	public function installEvents(): void
	{
	}

	public function uninstallEvents(): void
	{
	}

	private function installDependencies(): void
	{
		$pathToMobileApp = $_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/mobileapp/install/index.php';

		if (!ModuleManager::isModuleInstalled('mobile') && file_exists($pathToMobileApp))
		{
			include_once($pathToMobileApp);

			$mobile = new mobile();
			$mobile->InstallFiles();
			$mobile->InstallDB();
		}
	}

	public function doInstall(): void
	{
		global $USER, $APPLICATION;

		if (!$USER->isAdmin())
		{
			return;
		}

		if (!ModuleManager::isModuleInstalled('mail'))
		{
			$APPLICATION->throwException(Loc::getMessage('MAILMOBILE_MODULE_INSTALL_ERROR_MAIL'));
		}
		else
		{
			$this->installDB();
			$this->installFiles();
			$this->installEvents();
			$this->installDependencies();
		}

		$APPLICATION->IncludeAdminFile(
			Loc::getMessage('MAILMOBILE_INSTALL_TITLE'),
			$_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/mailmobile/install/step.php'
		);
	}

	protected function showUninstallStep(int $step)
	{
		global $APPLICATION;

		if ($this->errors !== false)
		{
			$GLOBALS['errors'] = (array)$this->errors;
		}

		$APPLICATION->IncludeAdminFile(
			Loc::getMessage('MAILMOBILE_UNINSTALL_TITLE'),
			$_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/mailmobile/install/unstep'. $step .'.php');
	}

	public function doUninstall(): void
	{
		global $USER, $APPLICATION, $step;

		$this->errors = false;

		if (!$USER->isAdmin())
		{
			return;
		}

		if (ModuleManager::isModuleInstalled('crmmobile'))
		{
			$APPLICATION->throwException(Loc::getMessage('MAILMOBILE_MODULE_INSTALL_ERROR_MAIL'));
		}

		$step = (int)$step;
		if($step < 2)
		{
			$this->showUninstallStep(1);
		}
		elseif($step === 2)
		{
			$this->uninstallDB();
			$this->uninstallFiles();
			$this->uninstallEvents();

			$APPLICATION->IncludeAdminFile(
				Loc::getMessage('MAILMOBILE_UNINSTALL_TITLE'),
				$_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/mailmobile/install/unstep2.php'
			);
		}
	}
}
