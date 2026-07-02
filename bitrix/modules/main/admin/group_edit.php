<?php

/**
 * Bitrix Framework
 * @package bitrix
 * @subpackage main
 * @copyright 2001-2026 Bitrix
 */

/**
 * @global CMain $APPLICATION
 * @global CUser $USER
 */

use Bitrix\Main\Authentication\Policy;
use Bitrix\Main\UserGroupTable;
use Bitrix\Main\Page\Asset;

require_once __DIR__ . '/../include/prolog_admin_before.php';
define('HELP_FILE', 'users/group_edit.php');

if (!$USER->CanDoOperation('view_groups'))
	$APPLICATION->AuthForm(GetMessage("ACCESS_DENIED"));

IncludeModuleLangFile(__FILE__);

$asset = Asset::getInstance();
$asset->addJs('/bitrix/js/main/gp.js');

$strError = '';

$ID = (int)($_REQUEST['ID'] ?? 0);
$COPY_ID = (int)($_REQUEST['COPY_ID'] ?? 0);
if($COPY_ID > 0)
	$ID = $COPY_ID;

$modules = CModule::GetList();
$arModules = array();
while ($mr = $modules->Fetch())
	$arModules[] = $mr["ID"];

$arSites = array();
$rsSites = CSite::GetList("sort", "asc", array("ACTIVE" => "Y"));
while ($arSite = $rsSites->GetNext())
{
	$arSites["reference_id"][] = $arSite["ID"];
	$arSites["reference"][] = "[".$arSite["ID"]."] ".$arSite["NAME"];
}

$USER_COUNT_MAX = 25;
$USER_COUNT = CUser::GetCount($USER_COUNT_MAX + 1);

$aTabs = array(
	array("DIV" => "edit1", "TAB" => GetMessage("MAIN_TAB"), "ICON" => "group_edit", "TITLE" => GetMessage("MAIN_TAB_TITLE")),
	array("DIV" => "edit2", "TAB" => GetMessage("TAB_2"), "ICON" => "group_edit", "TITLE" => GetMessage('MUG_POLICY_TITLE')),
);
if($ID!=1 || $COPY_ID>0 || (COption::GetOptionString("main", "controller_member", "N") == "Y" && COption::GetOptionString("main", "~controller_limited_admin", "N") == "Y"))
{
	$aTabs[] = array("DIV" => "edit3", "TAB" => GetMessage("TAB_3"), "ICON" => "group_edit", "TITLE" => GetMessage("MODULE_RIGHTS"));
}
$tabControl = new CAdminTabControl("tabControl", $aTabs);

if($_SERVER["REQUEST_METHOD"] == "POST" && (!empty($_POST['save']) || !empty($_POST['apply'])) && $USER->CanDoOperation('edit_groups') && check_bitrix_sessid())
{
	$active = $_POST['ACTIVE'] ?? '';
	if($ID <= 2 && $ID != 0)
		$active = 'Y';

	$group = new CGroup;

	$arGroupPolicy = [];
	foreach (new Policy\RulesCollection() as $key => $value)
	{
		$curVal = $_POST['gp_'.$key] ?? '';
		$curValParent = $_POST['gp_'.$key.'_parent'] ?? '';

		if ($curValParent != 'Y')
			$arGroupPolicy[$key] = $curVal;
	}

	$arFields = [
		'ACTIVE' => $active,
		'C_SORT' => $_POST['C_SORT'] ?? '',
		'NAME' => $_POST['NAME'] ?? '',
		'DESCRIPTION' => $_POST['DESCRIPTION'] ?? '',
		'STRING_ID' => $_POST['STRING_ID'] ?? '',
		'SECURITY_POLICY' => serialize($arGroupPolicy)
	];

	if ($USER_COUNT <= $USER_COUNT_MAX)
	{
		$USER_ID_NUMBER = (int)($_POST['USER_ID_NUMBER'] ?? 0);
		$USER_ID = [];
		$ind = -1;
		for ($i = 0; $i <= $USER_ID_NUMBER; $i++)
		{
			if (isset($_POST['USER_ID_ACT_'.$i]) && $_POST['USER_ID_ACT_'.$i] == 'Y')
			{
				$ind++;
				$USER_ID[$ind]['USER_ID'] = (int)($_POST['USER_ID_'.$i] ?? 0);
				$USER_ID[$ind]['DATE_ACTIVE_FROM'] = $_POST['USER_ID_FROM_'.$i] ?? '';
				$USER_ID[$ind]['DATE_ACTIVE_TO'] = $_POST['USER_ID_TO_'.$i] ?? '';
			}
		}

		if ($ID == 1 && $COPY_ID<=0)
		{
			$ind++;
			$USER_ID[$ind]['USER_ID'] = 1;
			$USER_ID[$ind]['DATE_ACTIVE_FROM'] = false;
			$USER_ID[$ind]['DATE_ACTIVE_TO'] = false;
		}

		$arFields['USER_ID'] = $USER_ID;
	}

	if($ID>0 && $COPY_ID<=0)
	{
		$res = $group->Update($ID, $arFields);
		$new = false;
	}
	else
	{
		$ID = $group->Add($arFields);
		$res = ($ID>0);
		$new = true;
	}

	$strError .= $group->LAST_ERROR;

	if ($strError == '')
	{
		if (intval($ID) != 1 || (COption::GetOptionString("main", "controller_member", "N") == "Y" && COption::GetOptionString("main", "~controller_limited_admin", "N") == "Y"))
		{
			// set per module rights
			$arTasks = [];
			foreach ($arModules as $MID)
			{
				$moduleName = str_replace(".", "_", $MID);
				$taskKey = 'TASKS_'.$moduleName;
				$rightsKey = 'RIGHTS_'.$moduleName;
				$sitesKey = 'SITES_'.$moduleName;
				$st = [];
				if (isset($_POST[$taskKey]))
				{
					$arTasks[$MID] = $_POST[$taskKey];
					$rt = CTask::GetLetter($arTasks[$MID]);
				}
				else
				{
					$rt = [];
					if (isset($_POST[$rightsKey]))
					{
						$rt = $_POST[$rightsKey];
					}
					if (isset($_POST[$sitesKey]))
					{
						$st = $_POST[$sitesKey];
					}

					$APPLICATION->DelGroupRight($MID, [$ID]);
					foreach($arSites["reference_id"] as $site_id_tmp)
					{
						$APPLICATION->DelGroupRight($MID, [$ID], $site_id_tmp);
					}
				}

				if (!empty($rt)	&& is_array($rt))
				{
					foreach ($rt as $i => $right)
					{
						if ($right <> '' && $right != "NOT_REF")
						{
							$APPLICATION->SetGroupRight($MID, $ID, $right, (array_key_exists($i, $st) && $st[$i] <> '' && $st[$i] != "NOT_REF" ? $st[$i] : false));
						}
					}
				}
				elseif (!is_array($rt) && $rt <> '' && $rt != "NOT_REF")
				{
					$APPLICATION->SetGroupRight($MID, $ID, $rt);
				}
			}

			$arTasksModules = CTask::GetTasksInModules(false, false, 'module');
			$nID = COperation::GetIDByName('edit_subordinate_users');
			$nID2 = COperation::GetIDByName('view_subordinate_users');
			$arTaskIds = $arTasksModules['main'];
			$handle_subord = false;
			$l = count($arTaskIds);
			for ($i = 0; $i < $l; $i++)
			{
				if (isset($arTasks['main']) && $arTaskIds[$i]['ID'] == $arTasks['main'])
				{
					$arOpInTask = CTask::GetOperations($arTaskIds[$i]['ID']);
					if (in_array($nID, $arOpInTask) || in_array($nID2, $arOpInTask))
						$handle_subord = true;
					break;
				}
			}
			if ($handle_subord)
			{
				$arSubordinateGroups = $_POST['subordinate_groups'] ?? [];
				CGroup::SetSubordinateGroups($ID, $arSubordinateGroups);
			}
			else
			{
				CGroup::SetSubordinateGroups($ID);
			}

			$old_arTasks = CGroup::GetTasks($ID);
			if (!empty(array_diff($old_arTasks, $arTasks)) || !empty(array_diff($arTasks, $old_arTasks)))
				CGroup::SetTasks($ID, $arTasks);
		}

		if($USER->CanDoOperation('edit_groups') && !empty($_POST['save']))
			LocalRedirect("group_admin.php?lang=".LANGUAGE_ID);
		elseif($USER->CanDoOperation('edit_groups') && !empty($_POST['apply']))
			LocalRedirect($APPLICATION->GetCurPage()."?lang=".LANGUAGE_ID."&ID=".$ID."&".$tabControl->ActiveTabParam());
		elseif($new)
			LocalRedirect($APPLICATION->GetCurPage()."?lang=".LANGUAGE_ID."&ID=".$ID."&".$tabControl->ActiveTabParam());
	}
}

$groupData = [
	'ACTIVE' => 'Y',
	'C_SORT' => '100',
	'TIMESTAMP_X' => '',
	'NAME' => '',
	'STRING_ID' => '',
	'DESCRIPTION' => '',
	'SECURITY_POLICY' => '',
];
$groupUserData = [];

$checkboxes = [
	'ACTIVE' => 1,
];

$z = CGroup::GetByID($ID);
if($group = $z->Fetch())
{
	foreach ($groupData as $key => $value)
	{
		$groupData[$key] = $group[$key] ?? $value;
	}

	if($USER_COUNT <= $USER_COUNT_MAX && $ID <> 2)
	{
		$users = UserGroupTable::getList([
			'filter' => ['=GROUP_ID' => $ID],
		]);
		while ($arUserGroup = $users->fetch())
		{
			$groupUserData[(int)$arUserGroup["USER_ID"]]['DATE_ACTIVE_FROM'] = (string)$arUserGroup["DATE_ACTIVE_FROM"];
			$groupUserData[(int)$arUserGroup["USER_ID"]]['DATE_ACTIVE_TO'] = (string)$arUserGroup["DATE_ACTIVE_TO"];
		}
	}
}
else
{
	$ID = 0;
}

if ($strError <> '')
{
	foreach ($groupData as $key => $value)
	{
		if (isset($_POST[$key]) || isset($checkboxes[$key]))
		{
			$groupData[$key] = $_POST[$key] ?? '';
		}
	}

	$USER_ID_NUMBER = (int)($_POST['USER_ID_NUMBER'] ?? 0);
	$groupUserData = [];
	for ($i = 0; $i <= $USER_ID_NUMBER; $i++)
	{
		if (($_POST['USER_ID_ACT_'.$i] ?? '') == 'Y')
		{
			$userId = (int)($_POST['USER_ID_'.$i] ?? 0);
			$groupUserData[$userId]['DATE_ACTIVE_FROM'] = $_POST['USER_ID_FROM_'.$i] ?? '';
			$groupUserData[$userId]['DATE_ACTIVE_TO'] = $_POST['USER_ID_TO_'.$i] ?? '';
		}
	}
}

if($ID <= 0 || $COPY_ID > 0)
	$APPLICATION->SetTitle(GetMessage("NEW_GROUP_TITLE"));
elseif($USER->CanDoOperation('edit_groups'))
	$APPLICATION->SetTitle(GetMessage("EDIT_GROUP_TITLE", array("#ID#" => $ID)));
else
	$APPLICATION->SetTitle(GetMessage("EDIT_GROUP_TITLE_VIEW", array("#ID#" => $ID)));

require($_SERVER["DOCUMENT_ROOT"].BX_ROOT."/modules/main/include/prolog_admin_after.php");

$aMenu = array(
	array(
		"TEXT"	=> GetMessage("RECORD_LIST"),
		"TITLE"	=> GetMessage("RECORD_LIST_TITLE"),
		"LINK"	=> "/bitrix/admin/group_admin.php?lang=".LANGUAGE_ID."&set_default=Y",
		"ICON"	=> "btn_list"

	)
);

if($USER->CanDoOperation('edit_groups'))
{
	if(intval($ID)>0 && $COPY_ID<=0)
	{
		$aMenu[] = array("SEPARATOR"=>"Y");

		$aMenu[] = array(
			"TEXT"	=> GetMessage("MAIN_NEW_RECORD"),
			"TITLE"	=> GetMessage("MAIN_NEW_RECORD_TITLE"),
			"LINK"	=> "/bitrix/admin/group_edit.php?lang=".LANGUAGE_ID,
			"ICON"	=> "btn_new"
		);
		if($ID>1)
		{
			$aMenu[] = array(
				"TEXT"	=> GetMessage("MAIN_COPY_RECORD"),
				"TITLE"	=> GetMessage("MAIN_COPY_RECORD_TITLE"),
				"LINK"	=> "/bitrix/admin/group_edit.php?lang=".LANGUAGE_ID."&amp;COPY_ID=".$ID,
				"ICON"	=> "btn_copy"
			);
		}

		if($ID>2)
		{
			$aMenu[] = array(
				"TEXT"	=> GetMessage("MAIN_DELETE_RECORD"),
				"TITLE"	=> GetMessage("MAIN_DELETE_RECORD_TITLE"),
				"LINK"	=> "javascript:if(confirm('".CUtil::JSEscape(GetMessage("MAIN_DELETE_RECORD_CONF"))."')) window.location='/bitrix/admin/group_admin.php?ID=".$ID."&action=delete&lang=".LANGUAGE_ID."&".bitrix_sessid_get()."';",
				"ICON"	=> "btn_delete"
			);
		}
	}
}

$context = new CAdminContextMenu($aMenu);
$context->Show();
?>

<?php CAdminMessage::ShowMessage($strError);?>

<form method="POST" action="<?= $APPLICATION->GetCurPage()?>?" name="form1">
<?=bitrix_sessid_post()?>
<input type="hidden" name="lang" value="<?= LANGUAGE_ID?>">
<input type="hidden" name="ID" value="<?= $ID?>">
<?php if($COPY_ID <> ''):?><input type="hidden" name="COPY_ID" value="<?= htmlspecialcharsbx($COPY_ID)?>"><?php endif?>
<?php
$tabControl->Begin();

$tabControl->BeginNextTab();
?>
	<?php if($groupData['TIMESTAMP_X'] <> ''):?>
	<tr>
		<td><?= GetMessage('LAST_UPDATE')?></td>
		<td><?= htmlspecialcharsbx($groupData['TIMESTAMP_X'])?></td>
	</tr>
	<?php endif; ?>
	<?php
	if ($ID > 0 && $ID != 2 && $COPY_ID<=0)
	{
		$dbGroupTmp = CGroup::GetByID($ID, "Y");
		if ($arGroupTmp = $dbGroupTmp->Fetch())
		{
			?>
			<tr>
				<td><?= GetMessage('MAIN_TOTAL_USERS')?></td>
				<td><a href="user_admin.php?lang=<?=LANGUAGE_ID?>&GROUPS_ID[]=<?=$ID?>&apply_filter=Y" title="<?=GetMessage("MAIN_VIEW_USER_GROUPS")?>"><?= intval($arGroupTmp["USERS"]) ?></a></td>
			</tr>
			<?php
		}
	}
	?>
	<?php if($ID>2 || $ID==0):?>
	<tr>
		<td><?= GetMessage('ACTIVE')?></td>
		<td><input type="checkbox" name="ACTIVE" value="Y"<?php if($groupData['ACTIVE']=='Y')echo " checked"?>></td>
	</tr>
	<?php endif;?>
	<tr>
		<td width="40%"><?=GetMessage("MAIN_C_SORT")?></td>
		<td width="60%"><input type="text" name="C_SORT" size="5" maxlength="18" value="<?= htmlspecialcharsbx($groupData['C_SORT'])?>"></td>
	</tr>
	<tr class="adm-detail-required-field">
		<td><?= GetMessage('NAME')?></td>
		<td><input type="text" name="NAME" size="40" maxlength="255" value="<?= htmlspecialcharsbx($groupData['NAME'])?>"></td>
	</tr>
	<tr>
		<td><?= GetMessage('STRING_ID')?></td>
		<td><input type="text" name="STRING_ID" size="40" maxlength="255" value="<?= htmlspecialcharsbx($groupData['STRING_ID'])?>"></td>
	</tr>
	<tr>
		<td class="adm-detail-valign-top"><?= GetMessage('DESCRIPTION')?></td>
		<td><textarea name="DESCRIPTION" cols="30" rows="5"><?= htmlspecialcharsbx($groupData['DESCRIPTION'])?></textarea>
		</td>
	</tr>
	<?php if($USER_COUNT<=$USER_COUNT_MAX && $ID!=2):?>
	<tr class="heading">
		<td colspan="2"><?= GetMessage('USERS');?></td>
	<tr>
		<td colspan="2" align="center">
		<table border="0" cellpadding="0" cellspacing="0" class="internal">
			<tr class="heading">
				<td>&nbsp;</td>
				<td><?= GetMessage("USER_LIST")?></td>
				<td><?=GetMessage('TBL_GROUP_DATE')?></td>
			</tr>
			<script>
			function CatGroupsActivate(obj, id)
			{
				var ed = eval("document.form1.USER_ID_FROM_" + id);
				var ed1 = eval("document.form1.USER_ID_TO_" + id);
				ed.disabled = !obj.checked;
				ed1.disabled = !obj.checked;
			}
			</script>
			<?php
			$ind = -1;
			$dbUsers = CUser::GetList("id", "asc", array("ACTIVE" => "Y"));
			while ($arUsers = $dbUsers->Fetch())
			{
				$ind++;
				?>
					<tr>
						<td>
							<input type="hidden" name="USER_ID_<?=$ind?>" value="<?=$arUsers["ID"] ?>">
							<input type="checkbox" name="USER_ID_ACT_<?=$ind?>" id="USER_ID_ACT_ID_<?=$ind?>" value="Y" <?php
								if (array_key_exists($arUsers["ID"], $groupUserData))
									echo " checked";
								?> OnChange="CatGroupsActivate(this, <?=$ind?>)"></td>
						<td align="left"><label for="USER_ID_ACT_ID_<?=$ind?>">[<a href="/bitrix/admin/user_edit.php?ID=<?=$arUsers["ID"]?>&lang=<?=LANGUAGE_ID?>" title="<?=GetMessage("MAIN_VIEW_USER")?>"><?=$arUsers["ID"]?></a>] (<?=htmlspecialcharsbx($arUsers["LOGIN"])?>) <?=htmlspecialcharsbx($arUsers["NAME"])?> <?=htmlspecialcharsbx($arUsers["LAST_NAME"])?></label></td>
						<td>
							<?=CalendarDate("USER_ID_FROM_".$ind, (array_key_exists($arUsers["ID"], $groupUserData) ? htmlspecialcharsbx($groupUserData[$arUsers["ID"]]['DATE_ACTIVE_FROM']) : ""), "form1", "22", (array_key_exists($arUsers["ID"], $groupUserData) ? " " : " disabled"))?>
							<?=CalendarDate("USER_ID_TO_".$ind, (array_key_exists($arUsers["ID"], $groupUserData) ? htmlspecialcharsbx($groupUserData[$arUsers["ID"]]['DATE_ACTIVE_TO']) : ""), "form1", "22", (array_key_exists($arUsers["ID"], $groupUserData) ? " " : " disabled"))?>
						</td>
					</tr>
				<?php
			}
			?>
		</table><input type="hidden" name="USER_ID_NUMBER" value="<?= $ind ?>"></td>
	</tr>
	<?php endif?>
<?php
$tabControl->BeginNextTab();

$arBXGroupPolicy = [
	'parent' => Policy\RulesCollection::createByPreset(),
	'low' => Policy\RulesCollection::createByPreset(Policy\RulesCollection::PRESET_LOW),
	'middle' => Policy\RulesCollection::createByPreset(Policy\RulesCollection::PRESET_MIDDLE),
	'high' => Policy\RulesCollection::createByPreset(Policy\RulesCollection::PRESET_HIGH),
];
?>
	<tr>
		<td width="40%"><?=GetMessage('MUG_PREDEFINED_FIELD')?>:</td>
		<td width="60%">
			<script>
				var arGroupPolicy = <?= json_encode($arBXGroupPolicy) ?>;
			</script>
			<select name="gp_level" OnChange="gpLevel()">
				<option value=""><?=GetMessage('MUG_SELECT_LEVEL1')?></option>
				<option value="parent"><?=GetMessage('MUG_PREDEFINED_PARENT')?></option>
				<option value="low"><?=GetMessage('MUG_PREDEFINED_LOW')?></option>
				<option value="middle"><?=GetMessage('MUG_PREDEFINED_MIDDLE')?></option>
				<option value="high"><?=GetMessage('MUG_PREDEFINED_HIGH')?></option>
			</select>
		</td>
	</tr>
	<?php
	$arGroupPolicy = unserialize($groupData['SECURITY_POLICY'], ['allowed_classes' => false]);
	if (!is_array($arGroupPolicy))
		$arGroupPolicy = [];

	foreach (new Policy\RulesCollection() as $key => $rule):

		$curVal = $arGroupPolicy[$key] ?? '';
		$curValParent = !array_key_exists($key, $arGroupPolicy);
		if ($strError <> '')
		{
			$curVal = $_POST['gp_'.$key] ?? '';
			$curValParent = (($_POST['gp_'.$key.'_parent'] ?? '') == 'Y');
		}
		?>
		<tr valign="top">
			<td><label for="gp_<?= $key ?>"><?= htmlspecialcharsbx($rule->getTitle()) ?></label>:</td>
			<td>
				<input type="checkbox" name="gp_<?= $key ?>_parent" OnClick="gpChangeParent('<?= $key ?>'); gpSync();" id="id_gp_<?= $key ?>_parent" value="Y"<?php if ($curValParent) echo "checked";?>><label for="id_gp_<?= $key ?>_parent"><?=GetMessage('MUG_GP_PARENT')?></label><br>
				<?php
				$arControl = $rule->getOptions();
				if ($arControl['type'] == 'checkbox'):
				?>
					<input type="checkbox" onclick="gpSync();" id="gp_<?= $key ?>" name="gp_<?= $key ?>" value="Y" <?php if($curVal === 'Y') echo "checked"?> <?php if ($curValParent) echo "disabled";?>>
				<?php
				else:
				?>
					<input type="text" onchange="gpSync();" name="gp_<?= $key ?>" value="<?= htmlspecialcharsbx($curVal) ?>" size="<?= ($arControl['size'] ?? 30)?>" <?php if ($curValParent) echo "disabled";?>>
				<?php
				endif;
				?>
			</td>
		</tr>
	<?php
	endforeach;
	?>

	<?php if (intval($ID)!=1 || $COPY_ID>0 || (COption::GetOptionString("main", "controller_member", "N") == "Y" && COption::GetOptionString("main", "~controller_limited_admin", "N") == "Y")) :?>
	<?php $tabControl->BeginNextTab();?>
	<tr>
		<td width="40%"><?=GetMessage("KERNEL")?></td>
		<td width="60%">
			<script>var arSubordTasks = [];</script>
			<?php
			$arTasksModules = CTask::GetTasksInModules(true,false,'module');
			$arTasks = CGroup::GetTasks($ID);
			$nID = COperation::GetIDByName('edit_subordinate_users');
			$nID2 = COperation::GetIDByName('view_subordinate_users');
			if($strError <> '')
				$v = $_POST['TASKS_main'] ?? false;
			else
				$v = (isset($arTasks['main'])) ? $arTasks['main'] : false;
			echo SelectBoxFromArray("TASKS_main", $arTasksModules['main'], $v, GetMessage("DEFAULT"));

			$show_subord = false;
			$arTaskIds = $arTasksModules['main']['reference_id'];
			$l = count($arTaskIds);
			for ($i=0;$i<$l;$i++)
			{
				$arOpInTask = CTask::GetOperations($arTaskIds[$i]);
				if (in_array($nID, $arOpInTask) || in_array($nID2, $arOpInTask))
				{
					?><script>
					arSubordTasks.push(<?=$arTaskIds[$i]?>);
					</script><?php
					if ($arTaskIds[$i] == $v)
						$show_subord = true;
				}
			}
			?>
			<script>
			document.getElementById('TASKS_main').onchange = function()
			{
				var show = false;
				for (var s = 0; s < arSubordTasks.length; s++)
				{
					if (arSubordTasks[s].toString() == this.value)
					{
						show = true;
						break;
					}
				}
				var row = document.getElementById('__subordinate_groups_tr');
				if (show)
				{
					try{row.style.display = 'table-row';}
					catch(e){row.style.display = 'block';}
				}
				else
					row.style.display = 'none';
			};
			</script>
		</td>
	</tr>
	<tr valign="top" id="__subordinate_groups_tr" <?= $show_subord ? '' : 'style="display:none"';?>>
		<td width="50%"><?=GetMessage('SUBORDINATE_GROUPS');?>:</td>
		<td width="50%">
			<select id="subordinate_groups" name="subordinate_groups[]" multiple size="6">
			<?php
			$arSubordinateGroups = CGroup::GetSubordinateGroups($ID);
			$rsData = CGroup::GetList('', '', array("ACTIVE"=>"Y", "ADMIN"=>"N", "ANONYMOUS"=>"N"));
			while($arRes = $rsData->Fetch())
			{
				$arRes['ID'] = intval($arRes['ID']);
				if ($arRes['ID'] == $ID)
					continue;
				if($strError <> '' && is_array($_POST['subordinate_groups'] ?? null))
				{
					$bSel = (in_array($arRes['ID'], $_POST['subordinate_groups']));
				}
				else
				{
					$bSel = (in_array($arRes['ID'], $arSubordinateGroups));
				}
				?><option value="<?=$arRes['ID']?>"<?= ($bSel? ' selected' : '')?>><?= htmlspecialcharsbx($arRes['NAME']).' ['.$arRes['ID'].']'?></option><?php
			}
			?>
			</select>
			<script>
			function settingsAddRights(a)
			{
				var tbl = BX.findPreviousSibling(a, { 'tag': 'table'});
				tbl = BX.findChild(tbl, {'tag': 'tbody'});

				var tableRow = tbl.rows[tbl.rows.length-1].cloneNode(true);

				tableRow.style.display = "table-row";
				tbl.insertBefore(tableRow, tbl.rows[tbl.rows.length-1]);

				var selRights = BX.findChild(tableRow.cells[1], { 'tag': 'select'}, true);
				selRights.selectedIndex = 0;

				var selSites = BX.findChild(tableRow.cells[0], { 'tag': 'select'}, true);
				selSites.selectedIndex = 0;
			}

			function settingsDeleteRow(el)
			{
				BX.remove(BX.findParent(el, {'tag': 'tr'}));
				return false;
			}

			</script>

		</td>
	</tr>
	<?php
	foreach($arModules as $MID):
		if($MID == "main")
			continue;
		/** @var CModule $module */
		if (($module = CModule::CreateModuleObject($MID))):
			if ($module->MODULE_GROUP_RIGHTS == "Y") :
				$moduleName = str_replace(".", "_", $MID);
	?>
	<tr>
		<td><?=$module->MODULE_NAME.":"?></td>
		<td>
		<?php
			$ar = [];
			if (isset($arTasksModules[$MID]))
			{
				if($strError <> '')
					$v = $_POST['TASKS_'.$moduleName] ?? false;
				else
					$v = (isset($arTasks[$MID])) ? $arTasks[$MID] : false;

				echo SelectBoxFromArray("TASKS_".$moduleName, $arTasksModules[$MID], $v, GetMessage("DEFAULT"));
			}
			else
			{
				?><table><tbody><?php

				if (method_exists($module, "GetModuleRightList"))
					$ar = call_user_func(array($module, "GetModuleRightList"));
				else
					$ar = $APPLICATION->GetDefaultRightList();

				if($strError <> '')
				{
					$k_site = 0;
					if (array_key_exists('SITES_'.$moduleName, $_POST) && is_array($_POST['SITES_'.$moduleName]))
					{
						foreach($_POST['SITES_'.$moduleName] as $k => $site_id_k)
						{
							if ($site_id_k == "")
							{
								$k_site = $k;
								break;
							}
						}
					}

					$v = $_POST['RIGHTS_'.$moduleName][$k_site] ?? false;
				}
				else
				{
					$v = $APPLICATION->GetGroupRight($MID, [$ID], "N", "N");
				}

				?><tr><?php
				$use_padding = false;
				$arRightsUseSites = array("reference_id" => array(), "reference" => array());
				if (
					array_key_exists("use_site", $ar)
					&& is_array($ar["use_site"])
					&& !empty($ar["use_site"])
				)
				{
					foreach ($ar["reference_id"] as $i => $right_tmp)
					{
						if (in_array($right_tmp, $ar["use_site"]))
						{
							$arRightsUseSites["reference_id"][] = $ar["reference_id"][$i];
							$arRightsUseSites["reference"][] = $ar["reference"][$i];
						}
					}

					$use_padding = true;
					?><td style="padding: 3px;"><input type="hidden" name="SITES_<?=$moduleName?>[]" value=""><?php
						echo GetMessage("ALL_SITES");
					?></td><?php
				}

				?><td <?php if ($use_padding):?>style="padding: 3px;"<?php endif;?>><?php
					echo SelectBoxFromArray("RIGHTS_".$moduleName."[]", $ar, htmlspecialcharsbx($v), GetMessage("DEFAULT"));
				?></td>
				<td></td><?php

				?></tr><?php

				if (
					array_key_exists("use_site", $ar)
					&& is_array($ar["use_site"])
					&& !empty($ar["use_site"])
				)
				{
					foreach ($arSites["reference_id"] as $i => $site_id_tmp)
					{
						$site_selected = false;
						if($strError <> '')
						{
							if (array_key_exists('SITES_'.$moduleName, $_POST) && is_array($_POST['SITES_'.$moduleName]))
							{
								$k_site = false;
								foreach($_POST['SITES_'.$moduleName] as $k => $site_id_k)
								{
									if ($site_id_k == $site_id_tmp)
									{
										$k_site = $k;
										$site_selected = $site_id_k;
										break;
									}
								}
							}

							if ($k_site === false)
								$v = false;
							else
								$v = $_POST['RIGHTS_'.$moduleName][$k_site] ?? false;
						}
						else
						{
							$v = $APPLICATION->GetGroupRight($MID, [$ID], "N", "N", $site_id_tmp);
							$site_selected = $site_id_tmp;
						}

						if ($v <> '')
						{
							?><tr>
								<td style="padding: 3px;">
								<?= SelectBoxFromArray("SITES_".$moduleName."[]", $arSites, $site_selected, GetMessage("SITE_SELECT")); ?>
								</td><?php
								?><td style="padding: 3px;"><?php
									echo SelectBoxFromArray("RIGHTS_".$moduleName."[]", $arRightsUseSites, htmlspecialcharsbx($v), GetMessage("DEFAULT"));
								?></td>
								<td style="padding: 3px;"><a href="javascript:void(0)" onClick="settingsDeleteRow(this)"><img src="/bitrix/themes/.default/images/actions/delete_button.gif" border="0" width="20" height="20" alt=""></a></td>
							</tr><?php
						}
					}
					?>
					<tr id="hidden-rights-row" style="display: none;">
						<td style="padding: 3px;"><?= SelectBoxFromArray("SITES_".$moduleName."[]", $arSites, "", GetMessage("SITE_SELECT")); ?></td>
						<td style="padding: 3px;"><?= SelectBoxFromArray("RIGHTS_".$moduleName."[]", $arRightsUseSites, "", GetMessage("DEFAULT"));?></td>
						<td><a href="javascript:void(0)" onClick="settingsDeleteRow(this)"><img src="/bitrix/themes/.default/images/actions/delete_button.gif" border="0" width="20" height="20" alt=""></a></td>
					</tr>
					<?php
				}

				?></tbody></table><?php

			}

		if (
			array_key_exists("use_site", $ar)
			&& is_array($ar["use_site"])
			&& !empty($ar["use_site"])
		)
		{
			?><a href="javascript:void(0)" onclick="settingsAddRights(this)" class="bx-action-href"><?= GetMessage("RIGHTS_ADD")?></a><?php
		}
		?></td>
	</tr>
	<?php
			endif;
		endif;
	endforeach;
	?>
	<?php endif;?>
<?php
$tabControl->Buttons(array("disabled" => !$USER->CanDoOperation('edit_groups'), "back_url"=>"group_admin.php?lang=".LANGUAGE_ID));
$tabControl->End();
?>

</form>
<script>
	gpSync();
</script>

<?php
require($_SERVER["DOCUMENT_ROOT"].BX_ROOT."/modules/main/include/epilog_admin.php");
