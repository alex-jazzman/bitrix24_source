<?php

use Bitrix\Main\Application;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\Loader;
use Bitrix\Main\ModuleManager;

if (class_exists('note'))
{
	return;
}

class note extends CModule
{
	public $MODULE_ID = 'note';
	public $MODULE_VERSION;
	public $MODULE_VERSION_DATE;
	public $MODULE_NAME;
	public $MODULE_DESCRIPTION;
	public $PARTNER_NAME = '';
	public $PARTNER_URI = '';

	public function __construct()
	{
		$arModuleVersion = [];

		include __DIR__ . '/version.php';

		if (
			is_array($arModuleVersion)
			&& array_key_exists('VERSION', $arModuleVersion)
			&& array_key_exists('VERSION_DATE', $arModuleVersion)
		)
		{
			$this->MODULE_VERSION = $arModuleVersion['VERSION'];
			$this->MODULE_VERSION_DATE = $arModuleVersion['VERSION_DATE'];
		}

		$this->MODULE_NAME = Loc::getMessage('NOTE_INSTALL_MODULE_NAME');
		$this->MODULE_DESCRIPTION = Loc::getMessage('NOTE_INSTALL_MODULE_DESCRIPTION');
	}

	public function DoInstall(): void
	{
		global $APPLICATION, $USER;

		if (!$USER->IsAdmin())
		{
			return;
		}

		$this->InstallFiles();
		$this->InstallDB();

		$this->clearMenuCache();

		$APPLICATION->IncludeAdminFile(
			Loc::getMessage('NOTE_INSTALL_TITLE'),
			$_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/' . $this->MODULE_ID . '/install/step.php',
		);
	}

	public function DoUninstall(): void
	{
		global $APPLICATION, $step, $USER;

		if (!$USER->IsAdmin())
		{
			return;
		}

		$step = (int)($step ?? $_REQUEST['step'] ?? 0);
		if ($step < 2)
		{
			$APPLICATION->IncludeAdminFile(
				Loc::getMessage('NOTE_UNINSTALL_TITLE'),
				$_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/' . $this->MODULE_ID . '/install/unstep1.php',
			);
		}
		elseif ($step === 2)
		{
			$this->UnInstallDB([
				'save_tables' => $_REQUEST['save_tables'] ?? 'N',
			]);
			$this->UnInstallFiles();

			$this->clearMenuCache();

			$APPLICATION->IncludeAdminFile(
				Loc::getMessage('NOTE_UNINSTALL_TITLE'),
				$_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/' . $this->MODULE_ID . '/install/unstep2.php',
			);
		}
	}

	public function InstallDB(): bool
	{
		global $APPLICATION;

		$freshSchema = !Application::getConnection()->isTableExists('b_note_collection');

		$migrationResult = $this->installMigrations();
		if (!$migrationResult->isSuccess())
		{
			$APPLICATION->ThrowException(implode('<br>', $migrationResult->getErrorMessages()));

			return false;
		}

		ModuleManager::registerModule($this->MODULE_ID);
		if (Loader::includeModule($this->MODULE_ID))
		{
			\Bitrix\Note\Internal\Access\Install\AccessInstaller::install();

			if ($freshSchema)
			{
				(new \Bitrix\Note\Internal\Setup\WelcomeContentInstaller())->install();
			}
		}

		$this->InstallTemplateRules();

		return true;
	}

	public function UnInstallDB(array $arParams = []): bool
	{
		global $APPLICATION;

		$dropTables = (($arParams['save_tables'] ?? 'N') !== 'Y');

		$migrationResult = $this->uninstallMigrations($dropTables);
		if (!$migrationResult->isSuccess())
		{
			$APPLICATION->ThrowException(implode('<br>', $migrationResult->getErrorMessages()));

			return false;
		}

		$this->UnInstallTemplateRules();

		ModuleManager::unRegisterModule($this->MODULE_ID);

		return true;
	}

	public function InstallFiles(): bool
	{
		CopyDirFiles(
			$_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/note/install/components',
			$_SERVER['DOCUMENT_ROOT'] . '/bitrix/components',
			true,
			true
		);
		CopyDirFiles(
			$_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/note/install/js',
			$_SERVER['DOCUMENT_ROOT'] . '/bitrix/js',
			true,
			true
		);
		CopyDirFiles(
			$_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/note/install/templates',
			$_SERVER['DOCUMENT_ROOT'] . '/bitrix/templates',
			true,
			true
		);

		return true;
	}

	public function InstallTemplateRules(): bool
	{
		$siteId = CSite::GetDefSite();
		if (!$siteId)
		{
			return true;
		}

		$condition = "CSite::InDir('/note/')";
		$template = 'note_document_detail';
		$exists = \Bitrix\Main\SiteTemplateTable::getList([
			'filter' => [
				'SITE_ID' => $siteId,
				'CONDITION' => $condition,
				'TEMPLATE' => $template,
			],
			'limit' => 1,
		])->fetch();

		if (!$exists)
		{
			\Bitrix\Main\SiteTemplateTable::add([
				'SORT' => 500,
				'SITE_ID' => $siteId,
				'CONDITION' => $condition,
				'TEMPLATE' => $template,
			]);
		}

		return true;
	}

	public function UnInstallTemplateRules(): bool
	{
		$rules = \Bitrix\Main\SiteTemplateTable::getList([
			'filter' => [
				'TEMPLATE' => 'note_document_detail',
				'CONDITION' => "CSite::InDir('/note/')",
			],
			'select' => ['ID'],
		]);

		while ($rule = $rules->fetch())
		{
			\Bitrix\Main\SiteTemplateTable::delete($rule['ID']);
		}

		return true;
	}

	public function UnInstallFiles(): bool
	{
		DeleteDirFiles(
			$_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/note/install/components',
			$_SERVER['DOCUMENT_ROOT'] . '/bitrix/components'
		);
		DeleteDirFiles(
			$_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/note/install/js',
			$_SERVER['DOCUMENT_ROOT'] . '/bitrix/js'
		);
		DeleteDirFilesEx('/bitrix/templates/note_document_detail');

		return true;
	}

	private function clearMenuCache(): void
	{
		if (Loader::includeModule('intranet') && class_exists('\CIntranetUtils'))
		{
			\CIntranetUtils::clearMenuCache();
		}
	}
}
