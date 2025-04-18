<?php
use Bitrix\Main\Localization\CultureTable;
use Bitrix\Main\SiteTable;

IncludeModuleLangFile(__FILE__);

class CWizardSolPanelIntranet
{
	public static function ShowPanel()
	{
		global $USER, $APPLICATION;

		if(defined("ADMIN_SECTION") && ADMIN_SECTION == true)
			return;

		if($USER->IsAdmin())
		{
			if(isset($_REQUEST['add_new_site_sol']) && $_REQUEST['add_new_site_sol']=='sol' && check_bitrix_sessid())
			{
				$arSitesID = Array();
				$arSitesPath = Array();
				$siteCnt = 0;
				
				$result = SiteTable::getList(['select' => ['ID', 'ACTIVE', 'DIR']]);
				while ($row = $result->fetch())
				{
					if($row["ACTIVE"] === "Y")
					{
						$siteCnt++;
					}

					$arSitesID[] = mb_strtolower($row["ID"]);
					$arSitesPath[] = mb_strtolower($row["DIR"]);
				}

				$newSiteID = "";
				while(true)
				{
					$newSiteID = chr(rand(ord("a"), ord("z"))).chr(rand(ord("a"), ord("z")));
					if(!in_array($newSiteID, $arSitesID) && !in_array("/site".$newSiteID."/", $arSitesPath) && !file_exists($_SERVER['DOCUMENT_ROOT']."/site".$newSiteID))
						break;
				}

				$culture = CultureTable::getRow(array('filter'=>array(
					"=FORMAT_DATE" => FORMAT_DATE,
					"=FORMAT_DATETIME" => FORMAT_DATETIME,
					"=FORMAT_NAME" => CSite::GetDefaultNameFormat(),
					"=CHARSET" => SITE_CHARSET,
				)));

				if($culture)
				{
					$cultureId = $culture["ID"];
				}
				else
				{
					$addResult = CultureTable::add(array(
						"NAME" => $newSiteID,
						"CODE" => $newSiteID,
						"FORMAT_DATE" => FORMAT_DATE,
						"FORMAT_DATETIME" => FORMAT_DATETIME,
						"FORMAT_NAME" => CSite::GetDefaultNameFormat(),
						"CHARSET" => SITE_CHARSET,
					));
					$cultureId = $addResult->getId();
				}

				$arFields = array(
					"LID" => $newSiteID,
					"ACTIVE" => "Y",
					"SORT" => 100,
					"DEF" => "N",
					"NAME" => $newSiteID,
					"DIR" => "/site_".$newSiteID."/",
					"SITE_NAME" => $newSiteID,
					"SERVER_NAME" => $_SERVER["SERVER_NAME"],
					"EMAIL" => COption::GetOptionString("main", "email_from"),
					"LANGUAGE_ID" => LANGUAGE_ID,
					"DOC_ROOT" => "",
					"CULTURE_ID" => $cultureId,
				);

				$obSite = new CSite;
				$result = $obSite->Add($arFields);
				if ($result)
				{
					LocalRedirect("/bitrix/admin/wizard_install.php?lang=".LANGUAGE_ID."&wizardName=bitrix:portal&wizardSiteID=".$newSiteID."&".bitrix_sessid_get());
				}
				else
				{
					echo $obSite->LAST_ERROR;
				}
			}

			$arMenu = Array(
				Array(
					"ACTION" => "jsUtils.Redirect([], '".CUtil::JSEscape(SITE_DIR)."?add_new_site_sol=sol&".bitrix_sessid_get()."')",
					"HTML" => "<b>".GetMessage("SOL_BUTTON_TEST_TEXT", Array("#BR#" => " "))."</b>",
					"TITLE" => GetMessage("SOL_BUTTON_TEST_TITLE"),
				),
			);


			$arSites = [];
			
			$result = SiteTable::getList([
				'select' => ['LID', 'DIR', 'NAME'],
				'filter' => ['=ACTIVE' => 'Y'],
				'order' => ['SORT' => 'ASC']
			]);
			
			while ($row = $result->fetch())
			{	
				$arSites[] = [
					"ACTION" => "jsUtils.Redirect([], '".CUtil::JSEscape($row["DIR"])."');",
					"ICON" => ($row["LID"] === SITE_ID ? "checked" : ""),
					"TEXT" => $row["NAME"],
					"TITLE" => GetMessage("SOL_BUTTON_GOTOSITE")." ".$row["NAME"],
				];
			}

	 		$arMenu[] = Array("SEPARATOR"=>true);
	 		$arMenu[] = Array(
				"TEXT" => GetMessage("SOL_BUTTON_GOTOSITE"),
				"MENU" => $arSites,
			);

			$APPLICATION->AddPanelButton(array(
				"HREF" => SITE_DIR."?add_new_site_sol=sol&".bitrix_sessid_get(),
				"ID" => "solutions_wizard",
				"ICON" => "bx-panel-install-solution-icon",
                "TYPE" => "BIG",
				"ALT" => GetMessage("SOL_BUTTON_TEST_TITLE"),
				"TEXT" => GetMessage("SOL_BUTTON_TEST_TEXT"),
				"MAIN_SORT" => 2520,
				"SORT" => 20,
				"MENU" => $arMenu,
				'HINT' => array(
					'TITLE' => str_replace('#BR#', ' ', GetMessage("SOL_BUTTON_TEST_TEXT")),
					'TEXT' => GetMessage('SOL_BUTTON_TEST_TEXT_HINT')
				),
				'HINT_MENU' => array(
					'TITLE' => str_replace('#BR#', ' ', GetMessage("SOL_BUTTON_TEST_TEXT")),
					'TEXT' => GetMessage('SOL_BUTTON_TEST_MENU_HINT')
				)
			));
		}

	}
}
