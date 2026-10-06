<?php
/** @noinspection ClassConstantCanBeUsedInspection */

use Bitrix\BIConnector\Integration\Superset\SupersetInitializer;
use Bitrix\Main\Config\Option;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\ModuleManager;

Loc::loadMessages(__FILE__);

if (class_exists('biconnector'))
{
	return;
}

class BIConnector extends \CModule
{
	public $MODULE_ID = 'biconnector';
	public $MODULE_VERSION;
	public $MODULE_VERSION_DATE;
	public $MODULE_NAME;
	public $MODULE_DESCRIPTION;
	private $errors;

	public function __construct()
	{
		$arModuleVersion = [];

		include __DIR__ . '/version.php';

		if (is_array($arModuleVersion) && array_key_exists('VERSION', $arModuleVersion))
		{
			$this->MODULE_VERSION = $arModuleVersion['VERSION'];
			$this->MODULE_VERSION_DATE = $arModuleVersion['VERSION_DATE'];
		}

		$this->MODULE_NAME = Loc::getMessage('BICONNECTOR_INSTALL_NAME');
		$this->MODULE_DESCRIPTION = Loc::getMessage('BICONNECTOR_INSTALL_DESCRIPTION');
	}

	public function InstallFiles($params = [])
	{
		CopyDirFiles(
			$_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/biconnector/install/public/bitrix/tools',
			$_SERVER['DOCUMENT_ROOT'] . '/bitrix/tools', true, true
		);
		CopyDirFiles(
			$_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/biconnector/install/components',
			$_SERVER['DOCUMENT_ROOT'] . '/bitrix/components', true, true
		);
		CopyDirFiles(
			$_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/biconnector/install/images',
			$_SERVER['DOCUMENT_ROOT'] . '/bitrix/images',
			true, true
		);
		CopyDirFiles(
			$_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/biconnector/install/js',
			$_SERVER['DOCUMENT_ROOT'] . '/bitrix/js',
			true, true
		);

		CopyDirFiles(
			$_SERVER["DOCUMENT_ROOT"] . "/bitrix/modules/biconnector/install/templates",
			$_SERVER["DOCUMENT_ROOT"] . "/bitrix/templates",
			true, true
		);

		\CopyDirFiles(
			$_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/biconnector/install/activities",
			$_SERVER["DOCUMENT_ROOT"]."/bitrix/activities",
			true,
			true
		);

		if (!isset($params['manual_installing']))
		{
			$params['public_dir'] = 'biconnector';
			$params['public_rewrite'] = true;
		}

		if ($params['public_dir'] !== '')
		{
			$siteList = CSite::GetList();
			while ($site = $siteList->Fetch())
			{
				CopyDirFiles(
					$_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/biconnector/install/public/biconnector',
					$site['ABS_DOC_ROOT'] . $site['DIR'] . '/' . $params['public_dir'], $params['public_rewrite']
				);
			}
		}

		return true;
	}

	function InstallTemplateRules()
	{
		$siteId = CSite::GetDefSite();
		if ($siteId)
		{
			$dashboardDetailTemplate = [
				'SORT' => 500,
				'SITE_ID' => $siteId,
				'CONDITION' => "CSite::InDir('/bi/dashboard/detail/')",
				'TEMPLATE' => 'dashboard_detail'
			];

			\Bitrix\Main\SiteTemplateTable::add($dashboardDetailTemplate);
		}

		return true;
	}

	public function InstallDB()
	{
		global $APPLICATION;
		$this->errors = false;

		$migrationResult = $this->installMigrations();
		if (!$migrationResult->isSuccess())
		{
			$APPLICATION->ThrowException(implode('<br>', $migrationResult->getErrorMessages()));
			return false;
		}

		$this->InstallTasks();

		ModuleManager::registerModule($this->MODULE_ID);

		Option::set('biconnector', 'check_permissions_by_group', 'Y');

		$this->InstallTemplateRules();

		return true;
	}

	public function InstallEvents()
	{
		return true;
	}

	public function UnInstallDB($arParams = [])
	{
		global $APPLICATION;
		$this->errors = false;

		$this->clearSupersetData();

		$dropTables = !array_key_exists('save_tables', $arParams) || $arParams['save_tables'] !== 'Y';

		$migrationResult = $this->uninstallMigrations($dropTables);
		if (!$migrationResult->isSuccess())
		{
			$this->errors = $migrationResult->getErrorMessages();
		}

		$this->UnInstallTasks();

		$this->UnInstallTemplateRules();

		UnRegisterModule($this->MODULE_ID);

		if ($this->errors !== false)
		{
			$APPLICATION->ThrowException(implode('<br>', $this->errors));
			return false;
		}

		return true;
	}

	function UnInstallTemplateRules()
	{
		$templateCheck = \Bitrix\Main\SiteTemplateTable::getList([
			'filter' => [
				'TEMPLATE' => 'dashboard_detail',
			]
		])->fetch();

		if ($templateCheck)
		{
			\Bitrix\Main\SiteTemplateTable::delete($templateCheck['ID']);
		}
	}

	public function UnInstallEvents()
	{
		return true;
	}

	public function UnInstallFiles()
	{
		DeleteDirFiles(
			$_SERVER['DOCUMENT_ROOT'] . 'bitrix/modules/' . $this->MODULE_ID . '/install/public/bitrix/tools/',
			$_SERVER['DOCUMENT_ROOT'] . '/bitrix/tools'
		);
		DeleteDirFiles(
			$_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/' . $this->MODULE_ID . '/install/images',
			$_SERVER['DOCUMENT_ROOT'] . '/bitrix/images'
		);
		DeleteDirFiles(
			$_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/' . $this->MODULE_ID . '/install/js',
			$_SERVER['DOCUMENT_ROOT'] . '/bitrix/js'
		);

		DeleteDirFilesEx('/bitrix/templates/dashboard_detail/');

		return true;
	}

	public function DoInstall()
	{
		global $APPLICATION, $USER;

		$step = (int)($_REQUEST['step'] ?? 1);
		if ($USER->isAdmin())
		{
			if ($step < 2)
			{
				$APPLICATION->includeAdminFile(GetMessage('BICONNECTOR_INSTALL_TITLE'), $_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/' . $this->MODULE_ID . '/install/step1.php');
			}
			elseif ($step === 2)
			{
				if ($this->InstallDB())
				{
					$this->InstallFiles([
						'public_dir' => $_REQUEST['install_public'] === 'Y' ? 'biconnector' : '',
						'public_rewrite' => $_REQUEST['public_rewrite'] === 'Y',
						'manual_installing' => true,
					]);

					$GLOBALS["CACHE_MANAGER"]->CleanDir("menu");
					\CBitrixComponent::clearComponentCache("bitrix:menu");
				}
				$APPLICATION->includeAdminFile(GetMessage('BICONNECTOR_INSTALL_TITLE'), $_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/' . $this->MODULE_ID . '/install/step2.php');
			}
		}
	}

	public function DoUninstall()
	{
		global $APPLICATION, $USER;

		$step = (int)($_REQUEST['step'] ?? 1);

		if ($USER->isAdmin())
		{
			if ($step < 2)
			{
				if ($this->isActiveSuperset())
				{
					$dashboardUrl = $this->getUrlToDisableBuilder();

					$this->errors[] = Loc::getMessage(
						"BICONNECTOR_UNINSTALL_TITLE_DELETE_BI_BUILDER",
						[
							'[link]' => '<a href="' . $dashboardUrl . '" target="_blank">',
							'[/link]' => '</a>',
						],
					);
				}
				$GLOBALS["biconnector_uninstaller_errors"] = $this->errors;

				$APPLICATION->includeAdminFile(GetMessage('BICONNECTOR_UNINSTALL_TITLE'), $_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/' . $this->MODULE_ID . '/install/unstep1.php');
			}
			elseif ($step === 2)
			{
				$this->UnInstallDB([
					'save_tables' => $_REQUEST['save_tables'],
				]);
				$this->UnInstallFiles();

				$GLOBALS["CACHE_MANAGER"]->CleanDir("menu");
				\CBitrixComponent::clearComponentCache("bitrix:menu");

				$APPLICATION->includeAdminFile(GetMessage('BICONNECTOR_UNINSTALL_TITLE'), $_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/' . $this->MODULE_ID . '/install/unstep2.php');
			}
		}
	}

	public function GetModuleTasks()
	{
		return [
			'biconnector_deny' => [
				'LETTER' => 'D',
				'BINDING' => 'module',
				'OPERATIONS' => []
			],
			'biconnector_read' => [ //Can view all dashboards
				'LETTER' => 'R',
				'BINDING' => 'module',
				'OPERATIONS' => [
					'biconnector_dashboard_view',
				]
			],
			'biconnector_add' => [ //Can view all keys and fully manage all dashboards
				'LETTER' => 'U',
				'BINDING' => 'module',
				'OPERATIONS' => [
					'biconnector_key_view',
					'biconnector_dashboard_view',
					'biconnector_dashboard_manage',
				]
			],
			'biconnector_full' => [ //Can operate on all module entities
				'LETTER' => 'W',
				'BINDING' => 'module',
				'OPERATIONS' => [
					'biconnector_key_view',
					'biconnector_key_manage',
					'biconnector_dashboard_view',
					'biconnector_dashboard_manage',
				]
			],
		];
	}

	public static function OnGetTableSchema()
	{
		return [
			'biconnector' => [
				'b_biconnector_dictionary_cache' => [
					'DICTIONARY_ID' => [
						'b_biconnector_dictionary_data' => 'DICTIONARY_ID',
					],
				],
				'b_biconnector_key' => [
					'ID' => [
						'b_biconnector_key_user' => 'KEY_ID',
						'b_biconnector_log' => 'KEY_ID',
					],
				],
				'b_biconnector_dashboard' => [
					'ID' => [
						'b_biconnector_dashboard_user' => 'DASHBOARD_ID',
					],
				],
			],
			'main' => [
				'b_user' => [
					'ID' => [
						'b_biconnector_key' => 'CREATED_BY',
						'b_biconnector_key_user' => 'CREATED_BY',
						'^b_biconnector_key_user' => 'USER_ID',
						'b_biconnector_dashboard' => 'CREATED_BY',
						'b_biconnector_dashboard_user' => 'CREATED_BY',
						'^b_biconnector_dashboard_user' => 'USER_ID',
					],
				],
			],
			'rest' => [
				'b_rest_app' => [
					'ID' => [
						'b_biconnector_key' => 'APP_ID',
					],
				],
			],
		];
	}

	private function isActiveSuperset(): bool
	{
		\Bitrix\Main\Loader::includeModule($this->MODULE_ID);

		return SupersetInitializer::isSupersetExist();
	}

	/**
	 * @return string
	 */
	protected function getUrlToDisableBuilder(): string
	{
		if (\Bitrix\Main\Loader::includeModule('intranet'))
		{
			return \Bitrix\Intranet\Portal::getInstance()->getSettings()->getSettingsUrl();
		}

		return '/settings/configs/';
	}

	private function clearSupersetData()
	{
		\Bitrix\Main\Loader::includeModule($this->MODULE_ID);
		SupersetInitializer::clearSupersetData();
		\Bitrix\BIConnector\Superset\Logger\SupersetInitializerLogger::logInfo('Superset data cleared during module uninstall');
	}
}
