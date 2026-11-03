<?php
/**
 * @global CUser $USER
 * @global CMain $APPLICATION
 * @global CDatabase $DB
 * @var string $module_id Defined in module/options.php
 */

IncludeModuleLangFile(__FILE__);

$MODULE_RIGHT = $APPLICATION->GetGroupRight($module_id);

$md = CModule::CreateModuleObject($module_id);

$arFilter = Array("ACTIVE"=>"Y");
if($md->SHOW_SUPER_ADMIN_GROUP_RIGHTS != "Y")
	$arFilter["ADMIN"] = "N";

$arGROUPS = array();
$z = CGroup::GetList("sort", "asc", $arFilter);
while($zr = $z->Fetch())
{
	$ar = array();
	$ar["ID"] = intval($zr["ID"]);
	$ar["NAME"] = htmlspecialcharsbx($zr["NAME"]);
	$ar["~NAME"] = $zr["NAME"];
	$arGROUPS[] = $ar;
}

if (!function_exists("__GroupRightsShowRow"))
{
	function __GroupRightsShowRowDefault($module_id, $ar, $arSites, $arRightsUseSites, $site_id_tmp)
	{
		$GROUP_DEFAULT_RIGHT = COption::GetOptionString($module_id, "GROUP_DEFAULT_RIGHT", false, ($site_id_tmp <> '' ? $site_id_tmp : ""), ($site_id_tmp <> ''));
		if (!$GROUP_DEFAULT_RIGHT)
		{
			if ($site_id_tmp == '')
				$GROUP_DEFAULT_RIGHT = "D";
			else
				return;
		}

		$titleCol = bitrix_sessid_post()."<b>".GetMessage("MAIN_BY_DEFAULT")."</b>";

		__GroupRightsShowRow(
			$titleCol, false, 0, $ar, $GROUP_DEFAULT_RIGHT, $site_id_tmp, $arRightsUseSites, $arSites, false,
			GetMessage("group_rights_default")
		);

	}

	//the phrases naming the controls are newer than the locales of the product, and an attribute holding
	//an empty name is worse than no attribute at all: it suppresses the other sources of the name and
	//leaves the control nameless. So nothing is printed until the phrase of the column has arrived, and
	//a subject alone is never printed either: it names a row and says nothing about the column
	function __GroupRightsNameAttribute($attribute, $messageId, $rowSubject = '')
	{
		$label = GetMessage($messageId);
		if ($label == '')
		{
			return '';
		}

		//the name goes into an attribute value, so it is escaped here: subjects arrive as plain text
		$name = htmlspecialcharsbx($rowSubject <> '' ? $label.': '.$rowSubject : $label);

		return ' '.$attribute.'="'.$name.'"';
	}

	//the array of the sites is built by the page including the block, and SelectBoxFromArray(), which
	//used to print this select, answered either spelling of the keys and an array carrying neither
	function __GroupRightsSiteReference($arSites, $key)
	{
		foreach ([$key, strtoupper($key)] as $name)
		{
			if (isset($arSites[$name]) && is_array($arSites[$name]))
			{
				return $arSites[$name];
			}
		}

		return [];
	}

	function __GroupRightsSiteSelect($arSites, $site_id_tmp, $rowSubject = '')
	{
		$box = '<select class="typeselect" style="width: 150px;" name="SITES[]"'.
			__GroupRightsNameAttribute("aria-label", "group_rights_site_label", $rowSubject).'>'.
			'<option value="">'.GetMessage("group_rights_sites_all").'</option>';

		$siteNames = __GroupRightsSiteReference($arSites, "reference");
		$siteIds = __GroupRightsSiteReference($arSites, "reference_id");

		foreach ($siteNames as $i => $siteName)
		{
			if (!isset($siteIds[$i]))
			{
				continue;
			}

			$box .= '<option value="'.htmlspecialcharsbx($siteIds[$i]).'"'.
				(strcasecmp($siteIds[$i], (string)$site_id_tmp) == 0 ? ' selected' : '').'>'.
				htmlspecialcharsbx($siteName).'</option>';
		}

		return $box.'</select>';
	}

	//a row is printed once per site of the portal, so on a portal of several sites the site is the only
	//thing telling the rows of one group apart; the subject reaches the attribute as plain text and is
	//escaped where the attribute is built, so the raw spelling of the name of the site is what travels
	function __GroupRightsRowSubject($rowSubject, $arSites, $site_id_tmp)
	{
		if ($rowSubject == '' || $site_id_tmp == '')
		{
			return $rowSubject;
		}

		$siteIds = __GroupRightsSiteReference($arSites, "reference_id");
		$siteNames = __GroupRightsSiteReference($arSites, "~reference");
		$i = array_search($site_id_tmp, $siteIds, true);

		return $rowSubject.', '.($i !== false && isset($siteNames[$i]) ? $siteNames[$i] : $site_id_tmp);
	}

	function __GetGroupRight($module_id, $groupID, $site_id_tmp, $arSites, $arGROUPS)
	{
		global $APPLICATION;

		static $arRightsAll = array();
		static $bInit = false;

		if (!$bInit)
		{
			$arGroupId = array();
			foreach($arGROUPS as $valueTmp)
			{
				if (
					isset($valueTmp["ID"])
					&& !is_array($valueTmp["ID"])
					&& intval($valueTmp["ID"]) > 0
				)
				{
					$arGroupId[] = $valueTmp["ID"];
				}
			}

			if (!empty($arGroupId))
			{
				$arRightsAll = $APPLICATION->GetUserRightArray($module_id, $arGroupId);
			}

			$bInit = true;
		}

		if (!$site_id_tmp)
		{
			$site_id_tmp = "common";
		}

		$res = '';
		if (
			isset($arRightsAll[$site_id_tmp])
			&& isset($arRightsAll[$site_id_tmp][$groupID])
		)
		{
			$res = $arRightsAll[$site_id_tmp][$groupID];
		}

		return $res;
	}

	function __GroupRightsShowRowGroup($module_id, $ar, $value, $arSites, $arRightsUseSites, $site_id_tmp, $arGROUPS)
	{
		global $md;

		$v = __GetGroupRight($module_id, $value["ID"], $site_id_tmp, $arSites, $arGROUPS);

		if($v == '')
		{
			return;
		}

		$titleCol = $value["NAME"]." [<a title=\"".GetMessage("MAIN_USER_GROUP_TITLE")."\" href=\"/bitrix/admin/group_edit.php?ID=".$value["ID"]."&amp;lang=".LANGUAGE_ID."\">".$value["ID"]."</a>]:".(($value["ID"]==1 && $md->SHOW_SUPER_ADMIN_GROUP_RIGHTS=="Y") ? "<br><small>".GetMessage("MAIN_SUPER_ADMIN_RIGHTS_COMMENT")."</small>" : "");

		__GroupRightsShowRow(
			$titleCol, $value["ID"], $value["ID"], $ar, $v, $site_id_tmp, $arRightsUseSites, $arSites, true,
			$value["~NAME"].' ['.intval($value["ID"]).']'
		);
	}

	function __GroupRightsShowRow($titleCol, $groupID, $group_id, $ar, $v, $site_id_tmp, $arRightsUseSites, $arSites, $useDefault = true, $rowSubject = '')
	{
		$rowSubject = __GroupRightsRowSubject($rowSubject, $arSites, $site_id_tmp);
		?><tr>
			<td width="40%"><?=$titleCol?></td>
			<td width="40%"><?php
			echo '<input type="hidden" name="GROUPS[]" value="'.$group_id.'">';

			$strReturnBox = '<select class="typeselect" name="RIGHTS[]"'.
				__GroupRightsNameAttribute("aria-label", "group_rights_right_label", $rowSubject).
				' onchange="__GroupRightsChangeSite(this)" >';

			$ref = $ar["reference"];
			$ref_id = $ar["reference_id"];
			if(!is_array($ref))
				$ref = $ar["REFERENCE"];
			if(!is_array($ref_id))
				$ref_id = $ar["REFERENCE_ID"];

			if ($useDefault)
				$strReturnBox .= '<option value="">'.GetMessage("MAIN_DEFAULT").'</option>';

			for($i=0,$n=count($ref); $i<$n; $i++)
			{
				$strReturnBox .= '<option';
				if(strcasecmp($ref_id[$i], htmlspecialcharsbx($v)) == 0)
					$strReturnBox .= ' selected';
				$strReturnBox .= ' value="'.htmlspecialcharsbx($ref_id[$i]).'">'.htmlspecialcharsbx($ref[$i]).'</option>';
			}

			echo $strReturnBox.'</select>';
			?></td><td width="20%"><span style="display: <?=(in_array($v, $arRightsUseSites) ? "inline-block" : "none")?>;"><?php
				echo __GroupRightsSiteSelect($arSites, $site_id_tmp, $rowSubject);
			?></span></td>
			<td width="0%"><a href="javascript:void(0)"
				role="button"
				class="adm-group-rights-delete"<?=__GroupRightsNameAttribute("title", "group_rights_delete")?>
				onClick="__GroupRightsDeleteRow(this)"
				onKeyDown="if (event.key === ' ') { event.preventDefault(); this.click(); }"><img
					src="/bitrix/themes/.default/images/actions/delete_button.gif"
					border="0" width="20" height="20"
					alt=""></a></td>
		</tr><?php
	}

}

if ($MODULE_RIGHT!="D") :

$arSites = array(
		"reference_id" => array(),
		"reference" => array()
	);

$rsSites = CSite::GetList("sort", "asc", Array("ACTIVE" => "Y"));
while ($arSite = $rsSites->GetNext())
{
	$arSites["reference_id"][] = $arSite["ID"];
	$arSites["reference"][] = "[".$arSite["ID"]."] ".$arSite["NAME"];
	//GetNext() escapes NAME and keeps the raw spelling under the tilde; the names of the rows are plain
	//text, so they are built from the latter
	$arSites["~reference"][] = "[".$arSite["ID"]."] ".$arSite["~NAME"];
}

if (method_exists($md, "GetModuleRightList"))
	$ar = call_user_func(array($md, "GetModuleRightList"));
else
	$ar = $APPLICATION->GetDefaultRightList();


$arRightsUseSites = array();

echo "<script>\n".
	"var arRightsUseSites = new Array();\n";

if (array_key_exists("use_site", $ar))
{
	foreach ($ar["use_site"] as $reference_id)
	{
		$arRightsUseSites[] = $reference_id;
		echo "arRightsUseSites[arRightsUseSites.length] = '".$reference_id."';\n";
	}
}

echo "</script>\n";

echo "<script>\n".
	"if ('__GroupRightsChangeSite' != typeof window.noFunc) { \n".
		"function __GroupRightsChangeSite(el)\n".
		"{\n".
			"var number = el.selectedIndex;\n".
			"if(BX.util.in_array(el.options[number].value, arRightsUseSites)) { \n".
				"BX(el).parentNode.nextSibling.firstChild.style.display = 'block';\n".
			"}\n".
			"else { \n".
				"BX(el).parentNode.nextSibling.firstChild.style.display = 'none';\n".
			"}\n".
		"}\n".
	"}\n".

	"if ('__GroupRightsDeleteRow' != typeof window.noFunc) { \n".
		//the row holds the focus while it is being removed, so the focus is handed over before BX.remove
		"function __GroupRightsDeleteRow(el)\n".
		"{\n".
			"var row = BX.findParent(el, {'tag': 'tr'});\n".
			"if (!row) { \n".
				"return false;\n".
			"}\n".
			"var target = null;\n".
			"for (var next = row.nextElementSibling; next && !target; next = next.nextElementSibling) { \n".
				"target = next.querySelector('.adm-group-rights-delete');\n".
			"}\n".
			"for (var prev = row.previousElementSibling; prev && !target; prev = prev.previousElementSibling) { \n".
				"target = prev.querySelector('.adm-group-rights-delete');\n".
			"}\n".
			"if (!target) { \n".
				"var table = BX.findParent(row, {'tag': 'table'});\n".
				"target = table ? table.querySelector('.adm-group-rights-add') : null;\n".
			"}\n".
			"if (target) { \n".
				"target.focus();\n".
			"}\n".
			"BX.remove(row);\n".
			"return false;\n".
		"}\n".
	"}\n".
	"</script>\n";

if ($_SERVER['REQUEST_METHOD'] == "POST" && !empty($_POST['Update']) && $MODULE_RIGHT=="W" && check_bitrix_sessid())
{
	if (!empty($_POST['GROUPS']) && is_array($_POST['GROUPS']))
	{
// echo "Remove all options<br>";
		COption::RemoveOption($module_id, "GROUP_DEFAULT_RIGHT");
// echo "Delete group rights for all sites<br>";
		$APPLICATION->DelGroupRight($module_id, array(), false);
		foreach($arSites["reference_id"] as $site_id_tmp)
		{
// echo "Delete group rights for site ".$site_id_tmp."<br>";
			$APPLICATION->DelGroupRight($module_id, array(), $site_id_tmp);
		}

		$RIGHTS = $_POST['RIGHTS'] ?? [];
		$SITES = $_POST['SITES'] ?? [];

		foreach($_POST['GROUPS'] as $i => $group_id)
		{
			if ($group_id == '')
				continue;

			if (
				!array_key_exists($i, $RIGHTS)
				|| $RIGHTS[$i] == ''
			)
				continue;

			if (intval($group_id) == 0)
			{
				if (
					!in_array($RIGHTS[$i], $arRightsUseSites)
					|| $SITES[$i] == ''
				)
				{
// echo "Set Default for all sites: ". $RIGHTS[$i]."<br>";
					COption::SetOptionString($module_id, "GROUP_DEFAULT_RIGHT", $RIGHTS[$i], "Right for groups by default", "");
				}
				else
				{
// echo "Set Default for site ".$SITES[$i].": ".$RIGHTS[$i]."<br>";
					COption::SetOptionString($module_id, "GROUP_DEFAULT_RIGHT", $RIGHTS[$i], "Right for groups by default for site ".$SITES[$i], $SITES[$i]);

				}
			}
			else
			{
				if (
					!in_array($RIGHTS[$i], $arRightsUseSites)
					|| $SITES[$i] == ''
				)
				{
// echo "Set Right for group ".$group_id." all sites: ".$RIGHTS[$i]."<br>";
					$APPLICATION->SetGroupRight($module_id, $group_id, $RIGHTS[$i], false);

				}
				else
				{
// echo "Set Right for group ".$group_id." ".$SITES[$i].": ".$RIGHTS[$i]."<br>";
					$APPLICATION->SetGroupRight($module_id, $group_id, $RIGHTS[$i], $SITES[$i]);
				}
			}
		}
	}
}

__GroupRightsShowRowDefault($module_id, $ar, $arSites, $arRightsUseSites, "");
foreach ($arSites["reference_id"] as $site_id_tmp)
{
	__GroupRightsShowRowDefault($module_id, $ar, $arSites, $arRightsUseSites, $site_id_tmp);
}

foreach($arGROUPS as $value)
{
	__GroupRightsShowRowGroup($module_id, $ar, $value, $arSites, $arRightsUseSites, false, $arGROUPS);
	foreach ($arSites["reference_id"] as $site_id_tmp)
	{
		__GroupRightsShowRowGroup($module_id, $ar, $value, $arSites, $arRightsUseSites, $site_id_tmp, $arGROUPS);
	}
}
?><tr>
	<td><select style="width:300px" onchange="settingsSetGroupID(this)" name="GROUPS[]"<?=__GroupRightsNameAttribute("aria-label", "group_rights_group_label")?>>
		<option value=""><?= GetMessage("group_rights_select")?></option>
		<option value="0"><?= GetMessage("group_rights_default")?></option>
		<?php
		foreach($arGROUPS as $group):
			?>
			<option value="<?=$group["ID"]?>"><?=$group["NAME"]." [".$group["ID"]."]"?></option>
			<?php
		endforeach;
		?>
	</select></td>
	<td><?php
		$strReturnBox = '<select class="typeselect" name="RIGHTS[]"'.
			__GroupRightsNameAttribute("aria-label", "group_rights_right_label").'>';

		$ref = $ar["reference"];
		$ref_id = $ar["reference_id"];
		if(!is_array($ref))
			$ref = $ar["REFERENCE"];
		if(!is_array($ref_id))
			$ref_id = $ar["REFERENCE_ID"];

		if (isset($useDefault) && $useDefault)
		{
			$strReturnBox .= '<option value="">' . GetMessage("MAIN_DEFAULT") . '</option>';
		}

		for($i=0,$n=count($ref); $i<$n; $i++)
			$strReturnBox .= '<option value="'.htmlspecialcharsbx($ref_id[$i]).'">'.htmlspecialcharsbx($ref[$i]).'</option>';

		echo $strReturnBox.'</select>';
	?></td>
	<td width="20%"><span style="display: none;"><?php
		echo __GroupRightsSiteSelect($arSites, "");
	?></span></td>
	<td width="0%"></td>
</tr>
<tr>
	<td></td>
	<td style="padding-bottom:10px;">
<script>

//the table of the tab the block is printed into is a form layout, not tabular data; it is addressed
//by the class of its own so that a table of a module around the block keeps its semantics
(function(script)
{
	if (!script)
	{
		return;
	}

	var table = script.closest("table.adm-detail-content-table");
	if (table)
	{
		table.setAttribute("role", "presentation");
	}
})(document.currentScript);

//a row added on the page is a copy of the row that adds one, the names of its controls included, so
//the rows repeat the name of their column and nothing else; the chosen group is the subject that tells
//them apart, the very one the server prints into the rows it renders
function __GroupRightsNameControl(control, subject)
{
	if (!control)
	{
		return;
	}

	if (typeof control.dataset.rightsColumn === 'undefined')
	{
		control.dataset.rightsColumn = control.getAttribute('aria-label') || '';
	}

	var column = control.dataset.rightsColumn;
	if (column === '')
	{
		//the server printed no name for the column, so there is no name to keep the subject in either:
		//an attribute holding a subject alone, or nothing at all, would only leave the control nameless
		control.removeAttribute('aria-label');
		return;
	}

	control.setAttribute('aria-label', subject === '' ? column : column + ': ' + subject);
}

function __GroupRightsNameRowControls(tableRow)
{
	//a selector of a group is what a row added on the page has and a row printed by the server has not:
	//the latter carries its subject from the server and must keep it
	var selGroup = BX.findChild(tableRow.cells[0], { 'tag': 'select'}, true);
	if (!selGroup)
	{
		return;
	}

	var subject = selGroup.value !== '' ? selGroup.options[selGroup.selectedIndex].text : '';

	__GroupRightsNameControl(BX.findChild(tableRow.cells[1], { 'tag': 'select'}, true), subject);
	__GroupRightsNameControl(BX.findChild(tableRow.cells[2], { 'tag': 'select'}, true), subject);
}

function settingsSetGroupID(el)
{
	var tableRow = BX.findParent(el, { 'tag': 'tr'});
	var sel = BX.findChild(tableRow.cells[1], "select", true);
	var selGroup = BX.findChild(tableRow.cells[0], {'tag': 'select'}, true);
	var selSite = BX.findChild(tableRow.cells[2], {'tag': 'select'}, true);
	var number = selGroup.selectedIndex;

	__GroupRightsNameRowControls(tableRow);

	RightsRowNew = new BX.CRightsRowNew({'row': tableRow});
	BX.bind(sel, "change", BX.delegate(RightsRowNew.ChangeSite, RightsRowNew));
}

function settingsAddRights(a)
{
	var row = BX.findParent(a, { 'tag': 'tr'});
	var tbl = row.parentNode;

	var tableRow = tbl.rows[row.rowIndex-1].cloneNode(true);
	tbl.insertBefore(tableRow, row);

	var selRights = BX.findChild(tableRow.cells[1], { 'tag': 'select'}, true);
	selRights.selectedIndex = 0;

	selGroups = BX.findChild(tableRow.cells[0], { 'tag': 'select'}, true);
	selGroups.selectedIndex = 0;

	selSites = BX.findChild(tableRow.cells[2], { 'tag': 'select'}, true);
	selSites.selectedIndex = 0;

	selSiteSpan = BX.findChild(tableRow.cells[2], { 'tag': 'span'}, true);
	selSiteSpan.style.display = "none";

	//the row is cloned from one that may already carry a group, and the selectors above are reset: the
	//names go back with them, otherwise the new row is announced under the group of the row it came from
	__GroupRightsNameRowControls(tableRow);

	RightsRowNew = new BX.CRightsRowNew({'row': tableRow});

	BX.bind(selRights, "change", BX.delegate(RightsRowNew.ChangeSite, RightsRowNew));

	selGroups.focus();
}

BX.CRightsRowNew = function(arParams)
{
	this.row = arParams.row;
}

BX.CRightsRowNew.prototype.settingsSetGroupID = function()
{
	var tr = this.row;
	var selGroup = BX.findChild(tr.cells[0], { 'tag': 'select'}, true);
	var selSite = BX.findChild(tr.cells[2], { 'tag': 'select'}, true);
	var selRights = BX.findChild(tr.cells[1], { 'tag': 'select'}, true);

	BX.bind(selRights, "change", BX.delegate(this.ChangeSite, this));
}

BX.CRightsRowNew.prototype.ChangeSite = function()
{
	var tr = this.row;
	var selSiteSpan = BX.findChild(tr.cells[2], { 'tag': 'span'}, true);
	var selRights = BX.findChild(tr.cells[1], { 'tag': 'select'}, true);
	var number = selRights.selectedIndex;

	if(BX.util.in_array(selRights.options[number].value, arRightsUseSites))
		selSiteSpan.style.display = 'block';
	else
		selSiteSpan.style.display = 'none';
}

</script>
		<a href="javascript:void(0)" onclick="settingsAddRights(this)" hidefocus="true" class="adm-btn adm-group-rights-add"><?= GetMessage("group_rights_add")?></a>
	</td>
	<td></td>
	<td></td>
</tr>

<?php endif;?>
