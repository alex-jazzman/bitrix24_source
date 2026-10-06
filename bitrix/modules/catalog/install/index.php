<?php
use Bitrix\Main;
use Bitrix\Main\Localization\Loc;
use	Bitrix\Main\ModuleManager;

class catalog extends CModule
{
	var $MODULE_ID = "catalog";
	var $MODULE_VERSION;
	var $MODULE_VERSION_DATE;
	var $MODULE_NAME;
	var $MODULE_DESCRIPTION;
	var $MODULE_CSS;
	var $MODULE_GROUP_RIGHTS = "Y";

	private $bitrix24mode;

	function __construct()
	{
		$arModuleVersion = array();

		include(__DIR__.'/version.php');

		if (is_array($arModuleVersion) && isset($arModuleVersion["VERSION"]))
		{
			$this->MODULE_VERSION = $arModuleVersion["VERSION"];
			$this->MODULE_VERSION_DATE = $arModuleVersion["VERSION_DATE"];
		}

		$this->MODULE_NAME = Loc::getMessage("CATALOG_INSTALL_NAME");
		$this->MODULE_DESCRIPTION = Loc::getMessage("CATALOG_INSTALL_DESCRIPTION2");

		$this->bitrix24mode = ModuleManager::isModuleInstalled('bitrix24');
	}

	function DoInstall()
	{
		global $APPLICATION, $step, $errors;

		$step = (int)$step;
		$errors = false;

		if(!ModuleManager::isModuleInstalled("currency"))
			$errors = Loc::getMessage("CATALOG_UNINS_CURRENCY");
		elseif(!ModuleManager::isModuleInstalled("iblock"))
			$errors = Loc::getMessage("CATALOG_UNINS_IBLOCK");
		else
		{
			$this->InstallFiles();
			$this->InstallDB();
			$this->InstallEvents();
		}

		$APPLICATION->IncludeAdminFile(Loc::getMessage("CATALOG_INSTALL_TITLE"), $_SERVER['DOCUMENT_ROOT']."/bitrix/modules/catalog/install/step1.php");
	}

	function InstallFiles()
	{
		CopyDirFiles($_SERVER['DOCUMENT_ROOT']."/bitrix/modules/catalog/install/admin", $_SERVER['DOCUMENT_ROOT']."/bitrix/admin");
		CopyDirFiles($_SERVER['DOCUMENT_ROOT']."/bitrix/modules/catalog/install/components", $_SERVER['DOCUMENT_ROOT']."/bitrix/components", true, true);
		CopyDirFiles($_SERVER['DOCUMENT_ROOT']."/bitrix/modules/catalog/install/images", $_SERVER['DOCUMENT_ROOT']."/bitrix/images/catalog", true, true);
		CopyDirFiles($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/catalog/install/js", $_SERVER["DOCUMENT_ROOT"]."/bitrix/js", true, true);
		CopyDirFiles($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/catalog/install/panel", $_SERVER["DOCUMENT_ROOT"]."/bitrix/panel", true, true);
		CopyDirFiles($_SERVER['DOCUMENT_ROOT']."/bitrix/modules/catalog/install/themes", $_SERVER['DOCUMENT_ROOT']."/bitrix/themes", true, true);
		CopyDirFiles($_SERVER['DOCUMENT_ROOT']."/bitrix/modules/catalog/install/tools", $_SERVER['DOCUMENT_ROOT']."/bitrix/tools", true, true);

		CopyDirFiles($_SERVER['DOCUMENT_ROOT']."/bitrix/modules/catalog/install/public/catalog_import", $_SERVER['DOCUMENT_ROOT']."/bitrix/php_interface/include/catalog_import");
		CopyDirFiles($_SERVER['DOCUMENT_ROOT']."/bitrix/modules/catalog/load_import/cron_frame.php", $_SERVER['DOCUMENT_ROOT']."/bitrix/php_interface/include/catalog_import/cron_frame.php");
		CopyDirFiles($_SERVER['DOCUMENT_ROOT']."/bitrix/modules/catalog/install/public/catalog_export", $_SERVER['DOCUMENT_ROOT']."/bitrix/php_interface/include/catalog_export");
		CopyDirFiles($_SERVER['DOCUMENT_ROOT']."/bitrix/modules/catalog/load/cron_frame.php", $_SERVER['DOCUMENT_ROOT']."/bitrix/php_interface/include/catalog_export/cron_frame.php");
		CopyDirFiles($_SERVER['DOCUMENT_ROOT']."/bitrix/modules/catalog/install/public/catalog_export/froogle_util.php", $_SERVER['DOCUMENT_ROOT']."/bitrix/tools/catalog_export/froogle_util.php");
		CopyDirFiles($_SERVER['DOCUMENT_ROOT']."/bitrix/modules/catalog/install/public/catalog_export/yandex_util.php", $_SERVER['DOCUMENT_ROOT']."/bitrix/tools/catalog_export/yandex_util.php");
		CopyDirFiles($_SERVER['DOCUMENT_ROOT']."/bitrix/modules/catalog/install/public/catalog_export/yandex_detail.php", $_SERVER['DOCUMENT_ROOT']."/bitrix/tools/catalog_export/yandex_detail.php");

		CheckDirPath($_SERVER['DOCUMENT_ROOT']."/bitrix/catalog_export/");

		return true;
	}

	function InstallDB()
	{
		global $APPLICATION;
		global $DB;

		$migrationResult = $this->installMigrations();
		if (!$migrationResult->isSuccess())
		{
			$APPLICATION->ThrowException(implode('. ', $migrationResult->getErrorMessages()));
			return false;
		}

		ModuleManager::registerModule('catalog');

		if ($this->bitrix24mode)
		{
			Main\Config\Option::set('catalog', 'enable_viewed_products', 'Y');
			Main\Config\Option::set('catalog', 'viewed_time', '2');
			Main\Config\Option::set('catalog', 'viewed_count', '10');
			Main\Config\Option::set('catalog', 'viewed_period', '1');
		}

		\CAgent::AddAgent(
			'\Bitrix\Catalog\CatalogViewedProductTable::clearAgent();',
			'catalog',
			'N',
			(int)COption::GetOptionString("catalog", "viewed_period") * 86400
		);

		Main\Config\Option::set('catalog', 'subscribe_repeated_notify', 'Y', '');
		if ($this->bitrix24mode)
		{
			/**
			 * B24 rest compatibility.
			 * Remove this code after migration rest catalog events to d7 events.
			 */
			Main\Config\Option::set('catalog', 'enable_processing_deprecated_events', 'Y', '');
			if (Main\Loader::includeModule('catalog'))
			{
				\Bitrix\Catalog\Compatible\EventCompatibility::registerEvents();
			}
			else
			{
				\CTimeZone::Disable();
				\CAgent::AddAgent(
					'\Bitrix\Catalog\Compatible\EventCompatibility::execAgent();',
					'catalog',
					'Y',
					1,
					'',
					'Y',
					\ConvertTimeStamp(time()+ 1, 'FULL'),
					100,
					false,
					false
				);
				\CTimeZone::Enable();
			}
		}
		else
		{
			if (Main\Config\Option::get('catalog', 'enable_processing_deprecated_events') === 'Y')
			{
				\Bitrix\Catalog\Compatible\EventCompatibility::registerEvents();
			}
		}

		$this->InstallTasks();

		$arCount = $DB->Query("select count(ID) as CNT from b_catalog_measure", true)->Fetch();
		if(is_array($arCount) && isset($arCount['CNT']) && intval($arCount['CNT']) <= 0)
		{
			$DB->Query("insert into b_catalog_measure (CODE, SYMBOL_INTL, SYMBOL_LETTER_INTL, IS_DEFAULT) values(6, 'm', 'MTR', 'N')", true);
			$DB->Query("insert into b_catalog_measure (CODE, SYMBOL_INTL, SYMBOL_LETTER_INTL, IS_DEFAULT) values(112, 'l', 'LTR', 'N')", true);
			$DB->Query("insert into b_catalog_measure (CODE, SYMBOL_INTL, SYMBOL_LETTER_INTL, IS_DEFAULT) values(163, 'g', 'GRM', 'N')", true);
			$DB->Query("insert into b_catalog_measure (CODE, SYMBOL_INTL, SYMBOL_LETTER_INTL, IS_DEFAULT) values(166, 'kg', 'KGM', 'N')", true);
			$DB->Query("insert into b_catalog_measure (CODE, SYMBOL_INTL, SYMBOL_LETTER_INTL, IS_DEFAULT) values(796, 'pc. 1', 'PCE. NMB', 'Y')", true);
		}

		return true;
	}

	function InstallEvents()
	{
		include($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/catalog/install/events/set_events.php");
		return true;
	}

	function DoUnInstall()
	{
		global $APPLICATION, $step, $errors;
		$step = (int)$step;
		if ($step < 2)
		{
			$APPLICATION->IncludeAdminFile(Loc::getMessage("CATALOG_INSTALL_TITLE"), $_SERVER['DOCUMENT_ROOT']."/bitrix/modules/catalog/install/unstep1.php");
		}
		elseif ($step == 2)
		{
			$errors = false;

			$this->UnInstallDB(array(
				"savedata" => $_REQUEST["savedata"],
			));

			$this->UnInstallFiles();
			$this->UnInstallEvents();

			$APPLICATION->IncludeAdminFile(Loc::getMessage("CATALOG_INSTALL_TITLE"), $_SERVER['DOCUMENT_ROOT']."/bitrix/modules/catalog/install/unstep2.php");
		}
	}

	function UnInstallFiles()
	{
		DeleteDirFiles($_SERVER['DOCUMENT_ROOT']."/bitrix/modules/catalog/install/admin", $_SERVER['DOCUMENT_ROOT']."/bitrix/admin");
		DeleteDirFiles($_SERVER['DOCUMENT_ROOT']."/bitrix/modules/catalog/install/themes/.default/", $_SERVER['DOCUMENT_ROOT']."/bitrix/themes/.default");//css
		DeleteDirFilesEx("/bitrix/themes/.default/icons/catalog/");//icons
		DeleteDirFilesEx("/bitrix/tools/catalog/"); // scripts
		DeleteDirFilesEx("/bitrix/js/catalog/");//javascript
		DeleteDirFilesEx("/bitrix/panel/catalog/");//panel

		return true;
	}

	function UnInstallDB($arParams = array())
	{
		global $APPLICATION;
		global $USER_FIELD_MANAGER;

		if (!defined('BX_CATALOG_UNINSTALLED'))
			define('BX_CATALOG_UNINSTALLED', true);

		$enableDeprecatedEvents = Main\Config\Option::get('catalog', 'enable_processing_deprecated_events') === 'Y';

		$dropTables = !isset($arParams["savedata"]) || $arParams["savedata"] != "Y";

		$migrationResult = $this->uninstallMigrations($dropTables);
		if (!$migrationResult->isSuccess())
		{
			$APPLICATION->ThrowException(implode('. ', $migrationResult->getErrorMessages()));
			return false;
		}

		if ($dropTables)
		{
			$USER_FIELD_MANAGER->OnEntityDelete('PRODUCT');
			$this->UnInstallTasks();
			COption::RemoveOption("catalog");
		}

		if (Main\Loader::includeModule('catalog'))
		{
			if ($this->bitrix24mode)
			{
				\Bitrix\Catalog\Compatible\EventCompatibility::unRegisterEvents();
			}
			elseif ($enableDeprecatedEvents)
			{
				\Bitrix\Catalog\Compatible\EventCompatibility::unRegisterEvents();
			}
		}

		ModuleManager::unRegisterModule('catalog');

		return true;
	}

	function UnInstallEvents()
	{
		include_once($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/catalog/install/events/del_events.php");
		return true;
	}

	function GetModuleTasks()
	{
		return array(
			'catalog_denied' => array(
				"LETTER" => "D",
				"BINDING" => "module",
				"OPERATIONS" => array(
				),
			),
			'catalog_view' => array(
				'LETTER' => 'M',
				'BINDING' => 'module',
				'OPERATIONS' => array(
					'catalog_view'
				)
			),
			'catalog_read' => array(
				"LETTER" => "R",
				"BINDING" => "module",
				"OPERATIONS" => array(
					'catalog_read'
				)
			),
			'catalog_price_edit' => array(
				"LETTER" => "T",
				"BINDING" => "module",
				"OPERATIONS" => array(
					'catalog_read',
					'catalog_price',
					'catalog_group',
					'catalog_discount',
					'catalog_vat',
					'catalog_extra',
					'catalog_store',
				),
			),
			'catalog_store_edit' => array(
				"LETTER" => "S",
				"BINDING" => "module",
				"OPERATIONS" => array(
					'catalog_read',
					'catalog_price',
					'catalog_extra',
					'catalog_store',
					'catalog_purchas_info',
				),
			),
			'catalog_export_import' => array(
				"LETTER" => "U",
				"BINDING" => "module",
				"OPERATIONS" => array(
					'catalog_read',
					'catalog_export_edit',
					'catalog_export_exec',
					'catalog_import_edit',
					'catalog_import_exec',
				),
			),
			'catalog_full_access' => array(
				"LETTER" => "W",
				"BINDING" => "module",
				"OPERATIONS" => array(
					'catalog_read',
					'catalog_price',
					'catalog_group',
					'catalog_discount',
					'catalog_vat',
					'catalog_extra',
					'catalog_store',
					'catalog_measure',
					'catalog_purchas_info',
					'catalog_export_edit',
					'catalog_export_exec',
					'catalog_import_edit',
					'catalog_import_exec',
					'catalog_settings',
				),
			),
		);
	}

	public static function getTableSchema(): array
	{
		return [
			'iblock' => [
				'b_iblock' => [
					'ID' => [
						'b_catalog_iblock' => 'IBLOCK_ID',
						'b_catalog_iblock^' => 'PRODUCT_IBLOCK_ID',
					],
				],
				'b_iblock_element' => [
					'ID' => [
						'b_catalog_product' => 'ID',
					],
				],
				'b_iblock_property' => [
					'ID' => [
						'b_catalog_iblock' => 'SKU_PROPERTY_ID',
					],
				],
			],
			'catalog' => [
				'b_catalog_contractor' => [
					'ID' => [
						'b_catalog_store_docs' => 'CONTRACTOR_ID',
					],
				],
				'b_catalog_discount' => [
					'ID' => [
						'b_catalog_discount_cond' => 'DISCOUNT_ID',
						'b_catalog_discount_coupon' => 'DISCOUNT_ID',
						'b_catalog_discount_entity' => 'DISCOUNT_ID',
						'b_catalog_discount_module' => 'DISCOUNT_ID',
						'b_catalog_disc_save_group' => 'DISCOUNT_ID',
						'b_catalog_disc_save_range' => 'DISCOUNT_ID',
						'b_catalog_disc_save_user' => 'DISCOUNT_ID',
					],
				],
				'b_catalog_docs_element' => [
					'ID' => [
						'b_catalog_docs_barcode' => 'DOC_ELEMENT_ID',
					],
				],
				'b_catalog_extra' => [
					'ID' => [
						'b_catalog_price' => 'EXTRA_ID',
					],
				],
				'b_catalog_group' => [
					'ID' => [
						'b_catalog_discount_cond' => 'PRICE_TYPE_ID',
						'b_catalog_group2group' => 'CATALOG_GROUP_ID',
						'b_catalog_group_lang' => 'CATALOG_GROUP_ID',
						'b_catalog_price' => 'CATALOG_GROUP_ID',
						'b_catalog_rounding' => 'CATALOG_GROUP_ID',
					],
				],
				'b_catalog_measure' => [
					'ID' => [
						'b_catalog_product' => 'MEASURE',
					],
				],
				'b_catalog_product' => [
					'ID' => [
						'b_catalog_docs_element' => 'ELEMENT_ID',
						'b_catalog_measure_ratio' => 'PRODUCT_ID',
						'b_catalog_price' => 'PRODUCT_ID',
						'b_catalog_product' => 'TRIAL_PRICE_ID',
						'b_catalog_product_sets' => 'ITEM_ID',
						'b_catalog_product2group' => 'PRODUCT_ID',
						'b_catalog_store_barcode' => 'PRODUCT_ID',
						'b_catalog_store_product' => 'PRODUCT_ID',
					],
				],
				'b_catalog_store' => [
					'ID' => [
						'b_catalog_docs_element' => 'STORE_FROM',
						'b_catalog_docs_element^' => 'STORE_TO',
						'b_catalog_store_barcode' => 'STORE_ID',
						'b_catalog_store_product' => 'STORE_ID',
					],
				],
				'b_catalog_store_docs' => [
					'ID' => [
						'b_catalog_docs_barcode' => 'DOC_ID',
						'b_catalog_docs_element' => 'DOC_ID',
						'b_catalog_store_document_file' => 'DOCUMENT_ID',
					],
				],
				'b_catalog_vat' => [
					'ID' => [
						'b_catalog_iblock' => 'VAT_ID',
						'b_catalog_product' => 'VAT_ID',
					],
				],
			],
			'currency' => [
				'b_catalog_currency' => [
					'CURRENCY' => [
						'b_catalog_discount' => 'CURRENCY',
						'b_catalog_product' => 'PURCHASING_CURRENCY',
						'b_catalog_price' => 'CURRENCY',
						'b_catalog_store_docs' => 'CURRENCY',
					],
				],
			],
			'main' => [
				'b_file' => [
					'ID' => [
						'b_catalog_store' => 'IMAGE_ID',
						'b_catalog_store_document_file' => 'FILE_ID',
					],
				],
				'b_group' => [
					'ID' => [
						'b_catalog_discount_cond' => 'USER_GROUP_ID',
						'b_catalog_disc_save_group' => 'GROUP_ID',
						'b_catalog_group2group' => 'GROUP_ID',
					],
				],
				'b_lang' => [
					'LID' => [
						'b_catalog_discount' => 'SITE_ID',
						'b_catalog_store' => 'SITE_ID',
						'b_catalog_store_docs' => 'SITE_ID',
					],
				],
				'b_module' => [
					'ID' => [
						'b_catalog_discount_module' => 'MODULE_ID',
						'b_catalog_discount_entity' => 'MODULE_ID',
					],
				],
				'b_user' => [
					'ID' => [
						'b_catalog_contractor' => 'CREATED_BY',
						'b_catalog_contractor^' => 'MODIFIED_BY',
						'b_catalog_discount' => 'CREATED_BY',
						'b_catalog_discount^' => 'MODIFIED_BY',
						'b_catalog_discount_coupon' => 'CREATED_BY',
						'b_catalog_discount_coupon^' => 'MODIFIED_BY',
						'b_catalog_disc_save_user' => 'USER_ID',
						'b_catalog_export' => 'CREATED_BY',
						'b_catalog_export^' => 'MODIFIED_BY',
						'b_catalog_group' => 'CREATED_BY',
						'b_catalog_group^' => 'MODIFIED_BY',
						'b_catalog_product_sets' => 'CREATED_BY',
						'b_catalog_product_sets^' => 'MODIFIED_BY',
						'b_catalog_rounding' => 'CREATED_BY',
						'b_catalog_rounding^' => 'MODIFIED_BY',
						'b_catalog_store' => 'MODIFIED_BY',
						'b_catalog_store^' => 'USER_ID',
						'b_catalog_store_barcode' => 'CREATED_BY',
						'b_catalog_store_barcode^' => 'MODIFIED_BY',
						'b_catalog_store_docs' => 'CREATED_BY',
						'b_catalog_store_docs^' => 'MODIFIED_BY',
					],
				],
			],
		];
	}
}
