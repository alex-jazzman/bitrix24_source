<?php

use Bitrix\Main\Config\Option;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\ModuleManager;

Loc::loadMessages(__FILE__);

Class sale extends CModule
{
	var $MODULE_ID = "sale";
	var $MODULE_VERSION;
	var $MODULE_VERSION_DATE;
	var $MODULE_NAME;
	var $MODULE_DESCRIPTION;
	var $MODULE_CSS;
	var $MODULE_GROUP_RIGHTS = "Y";

	function __construct()
	{
		$arModuleVersion = array();

		include(__DIR__.'/version.php');

		if (is_array($arModuleVersion) && array_key_exists("VERSION", $arModuleVersion))
		{
			$this->MODULE_VERSION = $arModuleVersion["VERSION"];
			$this->MODULE_VERSION_DATE = $arModuleVersion["VERSION_DATE"];
		}

		$this->MODULE_NAME = Loc::getMessage("SALE_INSTALL_NAME");
		$this->MODULE_DESCRIPTION = Loc::getMessage("SALE_INSTALL_DESCRIPTION");
	}

	function DoInstall()
	{
		global $APPLICATION, $step;
		$step = intval($step);
		if($step<2)
		{
			$APPLICATION->IncludeAdminFile(Loc::getMessage("SALE_INSTALL_TITLE"), $_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/sale/install/step1.php");
		}
		elseif($step==2)
		{
			$this->InstallFiles();
			if($this->InstallDB())
				$this->InstallEvents();
			$GLOBALS["errors"] = $this->errors;

			$APPLICATION->IncludeAdminFile(Loc::getMessage("SALE_INSTALL_TITLE"), $_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/sale/install/step2.php");
		}
	}

	function DoUninstall()
	{
		global $APPLICATION, $step;
		$step = intval($step);
		if($step<2)
		{
			$APPLICATION->IncludeAdminFile(Loc::getMessage("SALE_INSTALL_TITLE"), $_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/sale/install/unstep1.php");
		}
		elseif($step==2)
		{
			$this->UnInstallFiles();
			if($_REQUEST["saveemails"] != "Y")
				$this->UnInstallEvents();

			$this->UnInstallDB(array(
				"savedata" => $_REQUEST["savedata"],
			));

			$GLOBALS["errors"] = $this->errors;
			$APPLICATION->IncludeAdminFile(Loc::getMessage("SALE_INSTALL_TITLE"), $_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/sale/install/unstep2.php");
		}
	}

	function GetModuleRightList()
	{
		$arr = array(
			"reference_id" => array("D",/* "R",*/ "P", "U", "W"),
			"reference" => array(
					"[D] ".Loc::getMessage("SINS_PERM_D"),
					//"[R] ".Loc::getMessage("SINS_PERM_R"),
					"[P] ".Loc::getMessage("SINS_PERM_P"),
					"[U] ".Loc::getMessage("SINS_PERM_U"),
					"[W] ".Loc::getMessage("SINS_PERM_W")
				)
			);
		return $arr;
	}

	function InstallDB()
	{
		global $DB, $APPLICATION;
		$this->errors = false;

		$clearInstall = !$DB->TableExists('b_sale_basket');

		$migrationResult = $this->installMigrations();
		if (!$migrationResult->isSuccess())
		{
			$this->errors = $migrationResult->getErrorMessages();
			$APPLICATION->ThrowException(implode("", $this->errors));
			return false;
		}

		ModuleManager::registerModule('sale');

		COption::SetOptionString("sale", "viewed_capability", "N");
		COption::SetOptionString("sale", "viewed_count", 10);
		COption::SetOptionString("sale", "viewed_time", 5);
		COption::SetOptionString("main", "~sale_converted_15", 'Y');
		COption::SetOptionString("main", "~sale_paysystem_converted", 'Y');

		COption::SetOptionString("sale", "expiration_processing_events", 'Y');

		COption::SetOptionString("sale", "p2p_status_list", serialize(array(
			"N", "P", "F", "F_CANCELED", "F_DELIVERY", "F_PAY", "F_OUT"
		)));

		if ($clearInstall)
		{
			Option::set('sale', 'basket_discount_converted', 'Y', '');
			//set to use new discounts by default.
			Option::set('sale', 'use_sale_discount_only', 'Y');
		}

		COption::SetOptionString("sale", "product_reserve_clear_period", "3");

		Option::set('sale', 'sale_locationpro_import_performed', 'Y');
		Option::set('sale', 'product_viewed_save', 'N', '');

		Option::set('sale', 'encode_fuser_id', 'Y');

		// install tasks + operations for statuses
		$operations = array();
		$operations []= Bitrix\Main\OperationTable::add(array('MODULE_ID' => 'sale', 'BINDING' => 'status', 'NAME' => 'sale_status_view'     ));
		$operations []= Bitrix\Main\OperationTable::add(array('MODULE_ID' => 'sale', 'BINDING' => 'status', 'NAME' => 'sale_status_cancel'   ));
		$operations []= Bitrix\Main\OperationTable::add(array('MODULE_ID' => 'sale', 'BINDING' => 'status', 'NAME' => 'sale_status_mark'     ));
		$operations []= Bitrix\Main\OperationTable::add(array('MODULE_ID' => 'sale', 'BINDING' => 'status', 'NAME' => 'sale_status_delivery' ));
		$operations []= Bitrix\Main\OperationTable::add(array('MODULE_ID' => 'sale', 'BINDING' => 'status', 'NAME' => 'sale_status_deduction'));
		$operations []= Bitrix\Main\OperationTable::add(array('MODULE_ID' => 'sale', 'BINDING' => 'status', 'NAME' => 'sale_status_payment'  ));
		$operations []= Bitrix\Main\OperationTable::add(array('MODULE_ID' => 'sale', 'BINDING' => 'status', 'NAME' => 'sale_status_to'       ));
		$operations []= Bitrix\Main\OperationTable::add(array('MODULE_ID' => 'sale', 'BINDING' => 'status', 'NAME' => 'sale_status_update'   ));
		$operations []= Bitrix\Main\OperationTable::add(array('MODULE_ID' => 'sale', 'BINDING' => 'status', 'NAME' => 'sale_status_delete'   ));
		$operations []= Bitrix\Main\OperationTable::add(array('MODULE_ID' => 'sale', 'BINDING' => 'status', 'NAME' => 'sale_status_from'     ));
		Bitrix\Main\TaskTable::add(array('MODULE_ID' => 'sale', 'BINDING' => 'status', 'NAME' => 'sale_status_none', 'SYS' => 'Y', 'LETTER' => 'D'));
		$result = Bitrix\Main\TaskTable::add(array('MODULE_ID' => 'sale', 'BINDING' => 'status', 'NAME' => 'sale_status_all', 'SYS' => 'Y', 'LETTER' => 'X'));
		if ($result->isSuccess())
		{
			$taskId = $result->getId();
			foreach ($operations as $result)
				if ($result->isSuccess())
					Bitrix\Main\TaskOperationTable::add(array('TASK_ID' => $taskId, 'OPERATION_ID' => $result->getId()));
		}

		if (\Bitrix\Main\Loader::includeModule('sale'))
		{
			\Bitrix\Sale\Compatible\EventCompatibility::registerEvents();

			// install statuses
			$orderInitialStatus = Bitrix\Sale\OrderStatus::getInitialStatus();
			$orderFinalStatus   = Bitrix\Sale\OrderStatus::getFinalStatus();
			$deliveryInitialStatus = Bitrix\Sale\DeliveryStatus::getInitialStatus();
			$deliveryFinalStatus   = Bitrix\Sale\DeliveryStatus::getFinalStatus();
			$statusLanguages = array();
			$result = Bitrix\Main\Localization\LanguageTable::getList(array(
				'select' => array('LID'),
				'filter' => array('=ACTIVE' => 'Y'),
			));
			while ($row = $result->Fetch())
			{
				$languageId = $row['LID'];
				Bitrix\Main\Localization\Loc::loadLanguageFile($_SERVER['DOCUMENT_ROOT'].'/bitrix/modules/sale/lib/status.php', $languageId);
				foreach (array($orderInitialStatus, $orderFinalStatus, $deliveryInitialStatus, $deliveryFinalStatus) as $statusId)
					if ($statusName = Loc::getMessage("SALE_STATUS_{$statusId}"))
						$statusLanguages[$statusId] []= array(
							'LID'         => $languageId,
							'NAME'        => $statusName,
							'DESCRIPTION' => Loc::getMessage("SALE_STATUS_{$statusId}_DESCR"),
						);
			}
			Bitrix\Sale\OrderStatus::install(array(
				'ID'     => $orderInitialStatus,
				'SORT'   => 100,
				'NOTIFY' => 'Y',
				'LANG'   => $statusLanguages[$orderInitialStatus],
			));
			Bitrix\Sale\OrderStatus::install(array(
				'ID'     => $orderFinalStatus,
				'SORT'   => 200,
				'NOTIFY' => 'Y',
				'LANG'   => $statusLanguages[$orderFinalStatus],
			));
			Bitrix\Sale\DeliveryStatus::install(array(
				'ID'     => $deliveryInitialStatus,
				'SORT'   => 300,
				'NOTIFY' => 'Y',
				'LANG'   => $statusLanguages[$deliveryInitialStatus],
			));
			Bitrix\Sale\DeliveryStatus::install(array(
				'ID'     => $deliveryFinalStatus,
				'SORT'   => 400,
				'NOTIFY' => 'Y',
				'LANG'   => $statusLanguages[$deliveryFinalStatus],
			));

			// enabling location pro
			COption::SetOptionString("sale", "sale_locationpro_migrated", "Y");
			COption::SetOptionString("sale", "sale_locationpro_enabled", "Y");

			if(\Bitrix\Main\ModuleManager::isModuleInstalled('bitrix24'))
			{
				// this will create at least base types if we are at Bitrix24
				include_once($_SERVER["DOCUMENT_ROOT"].BX_ROOT."/modules/sale/lib/location/migration/migrate.php");
				\Bitrix\Sale\Location\Migration\CUpdaterLocationPro::createBaseTypes();
			}

			CSaleYMHandler::install();
		}

		if(Option::get('sale', 'use_sale_discount_only') !== 'Y')
		{
			\CAdminNotify::add(
				array(
					"MESSAGE" => Loc::getMessage('SALE_UPDATER_16036_MIGRATE_NOTIFY', array(
						"#LINK#" => "/bitrix/admin/sale_discount_catalog_migrator.php?lang=" . LANGUAGE_ID,
					)),
					"TAG" => "sale_discount_catalog_migrator",
					"MODULE_ID" => "sale",
					"ENABLE_CLOSE" => "N",
				)
			);
		}

		return true;
	}

	function UnInstallDB($arParams = array())
	{
		global $APPLICATION;

		$this->errors = false;

		$dropTables = array_key_exists("savedata", $arParams) && $arParams["savedata"] != "Y";

		$migrationResult = $this->uninstallMigrations($dropTables);
		if (!$migrationResult->isSuccess())
		{
			$this->errors = $migrationResult->getErrorMessages();
			$APPLICATION->ThrowException(implode("", $this->errors));
			return false;
		}

		if (\Bitrix\Main\Loader::includeModule('sale'))
		{
			\Bitrix\Sale\Compatible\EventCompatibility::unRegisterEvents();
		}

		ModuleManager::unRegisterModule('sale');

		return true;
	}

	function InstallEvents()
	{
		global $DB;
		include_once($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/sale/install/events.php");
		return true;
	}

	function UnInstallEvents()
	{
		global $DB;

		$statusMes = Array();
		$dbStatus = $DB->Query("SELECT * FROM b_sale_status", true);

		if($dbStatus)
		{
			while($arStatus = $dbStatus->Fetch())
			{
				$statusMes[] = "SALE_STATUS_CHANGED_".$arStatus["ID"];
			}
		}

		$statusMes[] = "SALE_NEW_ORDER";
		$statusMes[] = "SALE_ORDER_CANCEL";
		$statusMes[] = "SALE_ORDER_PAID";
		$statusMes[] = "SALE_ORDER_DELIVERY";
		$statusMes[] = "SALE_RECURRING_CANCEL";
		$statusMes[] = "SALE_STATUS_CHANGED";
		$statusMes[] = "SALE_ORDER_REMIND_PAYMENT";
		$statusMes[] = "SALE_NEW_ORDER_RECURRING";
		$statusMes[] = "SALE_ORDER_TRACKING_NUMBER";
		$statusMes[] = "SALE_SUBSCRIBE_PRODUCT";
		$statusMes[] = "SALE_CHECK_PRINT";
		$statusMes[] = "SALE_CHECK_VALIDATION_ERROR";
		$statusMes[] = "SALE_CHECK_PRINT_ERROR";
		$statusMes[] = "SALE_ORDER_SHIPMENT_STATUS_CHANGED";

		$eventType = new CEventType;
		$eventM = new CEventMessage;
		foreach($statusMes as $v)
		{
			$eventType->Delete($v);
			$dbEvent = CEventMessage::GetList("id", "asc", Array("EVENT_NAME" => $v));
			while($arEvent = $dbEvent->Fetch())
			{
				$eventM->Delete($arEvent["ID"]);
			}
		}

		return true;
	}

	function InstallFiles()
	{
		CopyDirFiles($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/sale/install/admin", $_SERVER["DOCUMENT_ROOT"]."/bitrix/admin", true, true);
		CopyDirFiles($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/sale/install/panel", $_SERVER["DOCUMENT_ROOT"]."/bitrix/panel", true, true);
		CopyDirFiles($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/sale/install/images",  $_SERVER["DOCUMENT_ROOT"]."/bitrix/images/sale", true, true);
		CopyDirFiles($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/sale/install/themes", $_SERVER["DOCUMENT_ROOT"]."/bitrix/themes", true, true);
		CopyDirFiles($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/sale/install/components", $_SERVER["DOCUMENT_ROOT"]."/bitrix/components", true, true);
		CopyDirFiles($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/sale/install/gadgets", $_SERVER["DOCUMENT_ROOT"]."/bitrix/gadgets", true, true);
		CopyDirFiles($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/sale/install/tools", $_SERVER["DOCUMENT_ROOT"]."/bitrix/tools", true, true);
		CopyDirFiles($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/sale/install/wizards", $_SERVER["DOCUMENT_ROOT"]."/bitrix/wizards", true, true);
		CopyDirFiles($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/sale/install/js", $_SERVER["DOCUMENT_ROOT"]."/bitrix/js", true, true);
		CopyDirFiles($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/sale/install/services", $_SERVER["DOCUMENT_ROOT"]."/bitrix/services", true, true);
		CopyDirFiles($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/sale/install/css", $_SERVER["DOCUMENT_ROOT"]."/bitrix/css", true, true);
		CopyDirFiles($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/sale/install/fonts", $_SERVER["DOCUMENT_ROOT"]."/bitrix/fonts", true, true);
		return true;
	}

	function UnInstallFiles()
	{
		DeleteDirFiles($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/sale/install/admin", $_SERVER["DOCUMENT_ROOT"]."/bitrix/admin");
		DeleteDirFilesEx("/bitrix/js/sale/");//javascript
		DeleteDirFilesEx("/bitrix/css/sale/");//javascript
		DeleteDirFiles($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/sale/install/themes/.default/", $_SERVER["DOCUMENT_ROOT"]."/bitrix/themes/.default");//css
		DeleteDirFilesEx("/bitrix/themes/.default/icons/sale/");//icons
		DeleteDirFilesEx("/bitrix/images/sale/");//images
		DeleteDirFilesEx("/bitrix/panel/sale/");
		DeleteDirFiles($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/sale/install/tools/", $_SERVER["DOCUMENT_ROOT"]."/bitrix/tools");//tools
		DeleteDirFiles($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/sale/install/services", $_SERVER["DOCUMENT_ROOT"]."/bitrix/services");

		return true;
	}

	public static function OnGetTableSchema()
	{
		return array(
			'sale' => array(
				'b_sale_discount' => array(
					'ID' => array(
						'b_sale_discount_coupon' => 'DISCOUNT_ID',
						'b_sale_discount_group' => 'DISCOUNT_ID',
						'b_sale_discount_module' => 'DISCOUNT_ID',
						'b_sale_discount_entities' => 'DISCOUNT_ID',
						'b_sale_order_discount' => 'DISCOUNT_ID',
					),
				),
				'b_sale_order_discount' => array(
					'ID' => array(
						'b_sale_order_coupons' => 'ORDER_DISCOUNT_ID',
						'b_sale_order_modules' => 'ORDER_DISCOUNT_ID',
						'b_sale_order_rules' => 'ORDER_DISCOUNT_ID',
						'b_sale_order_rules_descr' => 'ORDER_DISCOUNT_ID',
					),
				),
				'b_sale_order' => array(
					'ID' => array(
						'b_sale_order_coupons' => 'ORDER_ID',
						'b_sale_order_rules' => 'ORDER_ID',
						'b_sale_order_discount_data' => 'ORDER_ID',
						'b_sale_order_rules_descr' => 'ORDER_ID',
					),
				),
				'b_sale_discount_coupon' => array(
					'ID' => array(
						'b_sale_order_coupons' => 'COUPON_ID',
						'b_sale_order_rules' => 'COUPON_ID',
					),
				),
				'b_sale_order_rules' => array(
					'ID' => array(
						'b_sale_order_rules_descr' => 'RULE_ID',
					),
				),
			),
			'main' => array(
				'b_group' => array(
					'ID' => array(
						'b_sale_discount_group' => 'GROUP_ID',
					)
				),
				'b_user' => array(
					'ID' => array(
						'b_sale_discount' => 'MODIFIED_BY',
						'b_sale_discount^' => 'CREATED_BY',
						'b_sale_discount_coupon' => 'USER_ID',
						'b_sale_discount_coupon^' => 'MODIFIED_BY',
					)
				),
			),
		);
	}
}
