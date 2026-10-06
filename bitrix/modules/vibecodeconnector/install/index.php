<?php

use Bitrix\Main\Config\Option;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\ModuleManager;

Loc::loadMessages(__FILE__);

if (class_exists('vibecodeconnector'))
{
	return;
}

class Vibecodeconnector extends CModule
{
	public $MODULE_ID = 'vibecodeconnector';
	public $MODULE_VERSION;
	public $MODULE_VERSION_DATE;
	public $MODULE_NAME;
	public $MODULE_DESCRIPTION;
	public $MODULE_GROUP_RIGHTS = 'N';

	public function __construct()
	{
		$arModuleVersion = [];
		include __DIR__ . '/version.php';
		$this->MODULE_VERSION = $arModuleVersion['VERSION'];
		$this->MODULE_VERSION_DATE = $arModuleVersion['VERSION_DATE'];
		$this->MODULE_NAME = Loc::getMessage('VIBECODECONNECTOR_INSTALL_MODULE_NAME_V2');
		$this->MODULE_DESCRIPTION = Loc::getMessage('VIBECODECONNECTOR_INSTALL_MODULE_DESCRIPTION_V2');
	}

	public function DoInstall(): void
	{
		global $APPLICATION, $USER;

		$request = \Bitrix\Main\Context::getCurrent()->getRequest();
		$interactive = $request->get('id') === $this->MODULE_ID;

		if ($interactive)
		{
			$step = (int)$request->getPost('step');
			if ($step < 2)
			{
				$APPLICATION->IncludeAdminFile(
					Loc::getMessage('VIBECODECONNECTOR_INSTALL_BETA_STEP_TITLE'),
					__DIR__ . '/step1.php'
				);

				return;
			}

			if ($request->getPost('beta_accept') !== 'Y')
			{
				$APPLICATION->ThrowException(Loc::getMessage('VIBECODECONNECTOR_INSTALL_BETA_ERROR_NOT_ACCEPTED'));
				$APPLICATION->IncludeAdminFile(
					Loc::getMessage('VIBECODECONNECTOR_INSTALL_BETA_STEP_TITLE'),
					__DIR__ . '/step1.php'
				);

				return;
			}

			$userId = (isset($USER) && is_object($USER)) ? (string)$USER->GetID() : '';
			Option::set('vibecodeconnector', 'beta_accepted', 'Y');
			Option::set('vibecodeconnector', 'beta_accepted_by', $userId);
			Option::set('vibecodeconnector', 'beta_accepted_at', date('Y-m-d H:i:s'));
		}

		if ($this->InstallDB() === false)
		{
			return;
		}

		$this->InstallFiles();

		if ($interactive)
		{
			$APPLICATION->IncludeAdminFile(
				Loc::getMessage('VIBECODECONNECTOR_INSTALL_DONE_HEADING'),
				__DIR__ . '/step2.php'
			);
		}
	}

	public function DoUninstall(): void
	{
		global $APPLICATION;

		$request = \Bitrix\Main\Context::getCurrent()->getRequest();

		if ($this->isRegisteredWithPlatform())
		{
			$APPLICATION->ThrowException(Loc::getMessage('VIBECODECONNECTOR_UNINSTALL_PLATFORM_STILL_REGISTERED'));

			if ($request->get('id') === $this->MODULE_ID)
			{
				$APPLICATION->IncludeAdminFile(
					Loc::getMessage('VIBECODECONNECTOR_UNINSTALL_TITLE'),
					__DIR__ . '/unstep1.php'
				);
			}

			return;
		}

		$this->UninstallFiles();
		$this->UnInstallDB();
	}

	private function isRegisteredWithPlatform(): bool
	{
		if (!\Bitrix\Main\Loader::includeModule($this->MODULE_ID))
		{
			return false;
		}

		return \Bitrix\Main\DI\ServiceLocator::getInstance()
			->get(\Bitrix\Vibecodeconnector\Internal\Service\Registration\RegistrationService::class)
			->isRegistered();
	}

	public function InstallFiles(): void
	{
		CopyDirFiles(
			$_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/vibecodeconnector/install/js',
			$_SERVER['DOCUMENT_ROOT'] . '/bitrix/js',
			true,
			true,
		);

		CopyDirFiles(
			$_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/vibecodeconnector/install/admin',
			$_SERVER['DOCUMENT_ROOT'] . '/bitrix/admin',
			true,
		);
	}

	public function UninstallFiles(): void
	{
		DeleteDirFilesEx('/bitrix/js/vibecodeconnector/');

		DeleteDirFiles(
			$_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/vibecodeconnector/install/admin',
			$_SERVER['DOCUMENT_ROOT'] . '/bitrix/admin',
		);
	}

	function InstallDB($registerModule = true)
	{
		global $APPLICATION;

		$migrationResult = $this->installMigrations();
		if (!$migrationResult->isSuccess())
		{
			$APPLICATION->ThrowException(implode('<br>', $migrationResult->getErrorMessages()));

			return false;
		}

		if ($registerModule !== false)
		{
			ModuleManager::registerModule($this->MODULE_ID);
		}

		if ($this->isDefaultVisibilityAllowed())
		{
			Option::set('vibecodeconnector', 'is_ready', 'Y');
			Option::set('vibecodeconnector', 'open_app_in_iframe', 'Y');
			Option::set('immobile', 'is_vibecode_button_available', 'Y');
		}

		return true;
	}

	private function isDefaultVisibilityAllowed(): bool
	{
		if (!\Bitrix\Main\Loader::includeModule('bitrix24'))
		{
			return false;
		}

		return \CBitrix24::getPortalZone() === 'ru';
	}

	function UnInstallDB()
	{
		global $APPLICATION;

		$dropTables = true;

		$migrationResult = $this->uninstallMigrations($dropTables);
		if (!$migrationResult->isSuccess())
		{
			$APPLICATION->ThrowException(implode('<br>', $migrationResult->getErrorMessages()));

			return false;
		}

		ModuleManager::unRegisterModule($this->MODULE_ID);

		return true;
	}

	function InstallEvents()
	{
		\RegisterModuleDependences(
			'main',
			'OnEpilog',
			$this->MODULE_ID,
			\Bitrix\Vibecodeconnector\Infrastructure\Integration\Main\EventHandler::class,
			'onEpilog',
			101
		);

		return true;
	}
}
