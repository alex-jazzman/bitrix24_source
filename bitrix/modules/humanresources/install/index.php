<?php

use Bitrix\Main\Localization\Loc;

if (class_exists('humanresources'))
{
	return;
}

class HumanResources extends CModule
{
	public $MODULE_ID = 'humanresources';
	public $MODULE_GROUP_RIGHTS = 'N';
	public $MODULE_VERSION;
	public $MODULE_VERSION_DATE;
	public $MODULE_NAME;
	public $MODULE_DESCRIPTION;

	/**
	 * Constructor.
	 */
	public function __construct()
	{
		$arModuleVersion = [];

		include(__DIR__ . '/version.php');

		if (is_array($arModuleVersion) && array_key_exists('VERSION', $arModuleVersion))
		{
			$this->MODULE_VERSION = $arModuleVersion['VERSION'];
			$this->MODULE_VERSION_DATE = $arModuleVersion['VERSION_DATE'];
		}

		$this->MODULE_NAME = Loc::getMessage('HUMAN_RESOURCES_CORE_MODULE_NAME');
		$this->MODULE_DESCRIPTION = Loc::getMessage('HUMAN_RESOURCES_CORE_MODULE_DESCRIPTION');
	}

	private function getDocumentRoot(): string
	{
		$context =
			\Bitrix\Main\Application::getInstance()
				->getContext()
		;

		return $context ? $context->getServer()
			->getDocumentRoot() : $_SERVER['DOCUMENT_ROOT'];
	}

	/**
	 * Calls all install methods.
	 * @returm void
	 */
	public function doInstall()
	{
		global $APPLICATION;

		$this->installFiles();
		$this->installDB();

		$APPLICATION->includeAdminFile(
			Loc::getMessage('HUMAN_RESOURCES_CORE_INSTALL_TITLE'),
			$this->getDocumentRoot() . '/bitrix/modules/humanresources/install/step1.php'
		);
	}

	/**
	 * Calls all uninstall methods, include several steps.
	 * @returm void
	 */
	public function DoUninstall()
	{
		global $APPLICATION;
		$APPLICATION->IncludeAdminFile(GetMessage("HUMAN_RESOURCES_CORE_UNINSTALL_TITLE"), $_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/".$this->MODULE_ID."/install/del_denied.php");
	}

	/**
	 * Installs DB, events, etc.
	 * @return bool
	 */
	public function installDB()
	{
		global $APPLICATION;

		$migrationResult = $this->installMigrations();
		if (!$migrationResult->isSuccess())
		{
			$APPLICATION->throwException(implode('', $migrationResult->getErrorMessages()));
			return false;
		}

		// module
		registerModule($this->MODULE_ID);

		return true;
	}

	/**
	 * Installs files.
	 * @return bool
	 */
	public function installFiles()
	{
		CopyDirFiles($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/".$this->MODULE_ID."/install/components", $_SERVER["DOCUMENT_ROOT"]."/bitrix/components", true, true);
		CopyDirFiles($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/".$this->MODULE_ID."/install/js", $_SERVER["DOCUMENT_ROOT"]."/bitrix/js", true, true);
		CopyDirFiles($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/".$this->MODULE_ID."/install/activities", $_SERVER["DOCUMENT_ROOT"]."/bitrix/activities", true, true);

		return true;
	}

	/**
	 * Uninstalls DB, events, etc.
	 * @param array $uninstallParameters Some params.
	 * @return bool
	 */
	public function uninstallDB(array $uninstallParameters = [])
	{
		global $APPLICATION;

		$dropTables = false;

		$migrationResult = $this->uninstallMigrations($dropTables);
		if (!$migrationResult->isSuccess())
		{
			$APPLICATION->throwException(implode('', $migrationResult->getErrorMessages()));
			return false;
		}

		return true;
	}

	/**
	 * Uninstalls files.
	 * @return bool
	 */
	public function uninstallFiles()
	{
		return true;
	}
}
