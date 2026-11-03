<?php
require_once $_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/main/include/prolog_admin_before.php';
require_once $_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/search/prolog.php';
IncludeModuleLangFile(__FILE__);
/** @var CMain $APPLICATION */
global $APPLICATION;
/** @var CAdminMessage|null $message */
/** @var \Bitrix\Main\HttpRequest $request */
$request = \Bitrix\Main\Context::getCurrent()->getRequest();

$searchDB = CDatabase::GetModuleConnection('search');

$POST_RIGHT = CMain::GetGroupRight('search');
if ($POST_RIGHT == 'D')
{
	$APPLICATION->AuthForm(GetMessage('ACCESS_DENIED'));
}

$ID = $request['ID'];
$FIELD_ID = $request['FIELD_ID'];
$SITE_ID = $request['SITE_ID'];
$MODULE_ID = $request['MODULE_ID'];
$PARAM = $request['PARAM'];
$PARAM1 = $request['PARAM1'];
$PARAM2 = $request['PARAM2'];
$ITEM_ID = $request['ITEM_ID'];
$RANK = $request['RANK'];

if ($request['get_select'] === 'Y')
{
	if (intval($FIELD_ID) > 0)
	{
		$FIELD_NAME = 'FIELDS[' . intval($FIELD_ID) . '][PARAM1]';
	}
	else
	{
		$FIELD_NAME = htmlspecialcharsbx($FIELD_ID);
	}
	$arOptions = [];
	$strAttributes = '';
	if ($PARAM == '1' && $MODULE_ID == 'iblock' && CModule::IncludeModule('iblock'))
	{
		$rs = CIBlockType::GetList(['sort' => 'asc'], ['ACTIVE' => 'Y']);
		while ($ar = $rs->Fetch())
		{
			if ($arIBType = CIBlockType::GetByIDLang($ar['ID'], LANGUAGE_ID))
			{
				$arOptions[$ar['ID']] = '[' . $ar['ID'] . '] ' . $arIBType['~NAME'];
			}
		}
		$strControl = 'select';
		if (intval($ID) > 0)
		{
			$strAttributes = " OnChange=\"BoxUpdateNew('param1', " . intval($ID) . ')" ';
		}
		else
		{
			$strAttributes = " OnChange=\"BoxUpdateNew('param1')\" ";
		}
	}
	elseif ($PARAM == '1' && $MODULE_ID == 'forum' && CModule::IncludeModule('forum'))
	{
		$rs = CForumNew::GetList(['sort' => 'asc'], ['LID' => $SITE_ID]);
		while ($ar = $rs->Fetch())
		{
			$arOptions[$ar['ID']] = '[' . $ar['ID'] . '] ' . $ar['NAME'];
		}
		$strControl = 'select';
	}
	elseif ($PARAM == '2' && $PARAM1 != '' && $MODULE_ID == 'iblock' && CModule::IncludeModule('iblock'))
	{
		$rs = CIBlock::GetList(['SORT' => 'ASC'],['TYPE' => $PARAM1,'LID' => $SITE_ID]);
		while ($ar = $rs->Fetch())
		{
			$arOptions[$ar['ID']] = '[' . $ar['ID'] . '] ' . $ar['NAME'];
		}
		$strControl = 'select';
	}
	elseif ($PARAM == '2' && $MODULE_ID == 'forum' && CModule::IncludeModule('forum'))
	{
		$strControl = 'input';
	}
	else
	{
		$strControl = 'hidden';
	}

	switch ($strControl)
	{
		case 'select':
			?>
			<select name="<?=$FIELD_NAME?>" id="<?=$FIELD_NAME?>" <?=$strAttributes?>>
			<option value=""><?=GetMessage('customrank_edit_no')?></option>
			<?php foreach ($arOptions as $key => $value):?>
				<option value="<?=htmlspecialcharsbx($key)?>"<?=$key == $PARAM1 ? ' selected' : ''?>><?=htmlspecialcharsbx($value)?></option>
			<?php endforeach;?>
			</select>
			<?php
			break;
		case 'input':
			?><input type="text" size="15" name="<?=$FIELD_NAME?>" id="<?=$FIELD_NAME?>" value="<?=htmlspecialcharsbx($PARAM2)?>"><?php
			break;
		case 'hidden':
			?>&nbsp;<input type="hidden" name="<?=$FIELD_NAME?>" id="<?=$FIELD_NAME?>" value=""><?php
			break;
	}
	require $_SERVER['DOCUMENT_ROOT'] . BX_ROOT . '/modules/main/include/epilog_admin_js.php';
	die();
}

$aTabs = [
	[
		'DIV' => 'edit1',
		'TAB' => GetMessage('customrank_edit_rule'),
		'ICON' => 'main_user_edit',
		'TITLE' => GetMessage('customrank_edit_rule_title'),
	],
];
$tabControl = new CAdminTabControl('tabControl', $aTabs, true, true);

$ID = intval($ID);		// Id of the edited record
switch ($MODULE_ID)
{
	case 'iblock':
		$ITEM_ID = $ITEM_ID['KEY'];
		break;
	case 'forum':
		$ITEM_ID = $ITEM_ID['FORUM'];
		break;
	case 'main':
		$PARAM1 = '';
		$PARAM2 = '';
		$ITEM_ID = $ITEM_ID['MAIN'];
		break;
	default:
		$PARAM1 = '';
		$PARAM2 = '';
		$ITEM_ID = $ITEM_ID['MAIN'];
		break;
}
$strError = '';
$bVarsFromForm = false;

if (
	$request->isPost()
	&& (
		(string)$request['save'] !== ''
		|| (string)$request['apply'] !== ''
	)
	&& $POST_RIGHT == 'W'
	&& check_bitrix_sessid()
)
{
	$cCustomRank = new CSearchCustomRank;
	$arFields = [
		'SITE_ID' => $SITE_ID,
		'MODULE_ID' => $MODULE_ID,
		'PARAM1' => $PARAM1,
		'PARAM2' => $PARAM2,
		'ITEM_ID' => ($MODULE_ID == 'main' && $ITEM_ID != '' ? $SITE_ID . '|' . $ITEM_ID : $ITEM_ID),
		'RANK' => $RANK
	];

	if ($ID > 0)
	{
		$res = $cCustomRank->Update($ID, $arFields);
	}
	else
	{
		$ID = $cCustomRank->Add($arFields);
		$res = ($ID > 0);
	}

	if ($res)
	{
		if ((string)$request['apply'] !== '')
		{
			LocalRedirect('search_customrank_edit.php?ID=' . $ID . '&lang=' . LANGUAGE_ID . '&' . $tabControl->ActiveTabParam());
		}
		else
		{
			LocalRedirect('search_customrank_admin.php?lang=' . LANGUAGE_ID . '&' . $tabControl->ActiveTabParam());
		}
	}
	else
	{
		$strError = $cCustomRank->LAST_ERROR;
		$bVarsFromForm = true;
	}
}

//Edit/Add part
ClearVars();
$customRankData = [
	'MODULE_ID' => 'main',
	'RANK' => 0,
	'SITE_ID' => '',
	'PARAM1' => '',
	'PARAM2' => '',
	'ITEM_ID' => '',
];

if ($ID > 0)
{
	$customrank = CSearchCustomRank::GetByID($ID)->Fetch();
	if (!$customrank)
	{
		$ID = 0;
	}
	elseif ($customrank['MODULE_ID'] == 'main')
	{
		list($site, $url) = explode('|', $customrank['ITEM_ID'], 2);
		$customrank['ITEM_ID'] = $url;
	}

	if ($customrank)
	{
		$customRankData = $customrank;
	}
}

if ($bVarsFromForm)
{
	foreach ($customRankData as $key => $value)
	{
		if (isset($_POST[$key]))
		{
			$customRankData[$key] = $_POST[$key];
		}
	}
}

$APPLICATION->SetTitle(($ID > 0 ? GetMessage('customrank_edit_edit_rule') . $ID : GetMessage('customrank_edit_add_rule')));

require $_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/main/include/prolog_admin_after.php';

if (is_object($message))
{
	echo $message->Show();
}

$aMenu = [
	[
		'TEXT' => GetMessage('customrank_edit_list_rule'),
		'TITLE' => GetMessage('customrank_edit_list_rule_title'),
		'LINK' => 'search_customrank_admin.php?lang=' . LANGUAGE_ID,
		'ICON' => 'btn_list',
	]
];
if ($ID > 0)
{
	$aMenu[] = ['SEPARATOR' => 'Y'];
	$aMenu[] = [
		'TEXT' => GetMessage('customrank_edit_add_new'),
		'TITLE' => GetMessage('customrank_edit_add_new_title'),
		'LINK' => 'search_customrank_edit.php?lang=' . LANGUAGE_ID,
		'ICON' => 'btn_new',
	];
	$aMenu[] = [
		'TEXT' => GetMessage('customrank_edit_delete'),
		'TITLE' => GetMessage('customrank_edit_delete_title'),
		'LINK' => "javascript:if(confirm('" . addslashes(GetMessage('customrank_edit_delete_conf')) . "'))window.location='search_customrank_admin.php?ID=" . $ID . '&action=delete&lang=' . LANGUAGE_ID . '&' . bitrix_sessid_get() . "';",
		'ICON' => 'btn_delete',
	];
}
$context = new CAdminContextMenu($aMenu);
$context->Show();
?>

<?php CAdminMessage::ShowMessage($strError);?>

<script>
function ParamUpdate()
{
	var module_id = document.getElementById('MODULE_ID').value;
	document.getElementById('main_item_id').style.display="none";
	document.getElementById('iblock_item_id').style.display="none";
	document.getElementById('forum_item_id').style.display="none";
	switch(module_id)
	{
		case 'main':
			document.getElementById('param1_label').innerHTML='<?=addslashes(GetMessage('customrank_edit_param1'))?>';
			document.getElementById('param2_label').innerHTML='<?=addslashes(GetMessage('customrank_edit_param2'))?>';
			document.getElementById('item_id_label').innerHTML='<?=addslashes(GetMessage('customrank_edit_param3_main'))?>';
			document.getElementById('main_item_id').style.display="block";
			break;
		case 'iblock':
			document.getElementById('param1_label').innerHTML='<?=addslashes(GetMessage('customrank_edit_param1_iblock'))?>';
			document.getElementById('param2_label').innerHTML='<?=addslashes(GetMessage('customrank_edit_param2_iblock'))?>';
			document.getElementById('item_id_label').innerHTML='<?=addslashes(GetMessage('customrank_edit_param3_iblock'))?>';
			document.getElementById('iblock_item_id').style.display="block";
			break;
		case 'forum':
			document.getElementById('param1_label').innerHTML='<?=addslashes(GetMessage('customrank_edit_param1_forum'))?>';
			document.getElementById('param2_label').innerHTML='<?=addslashes(GetMessage('customrank_edit_param2_forum'))?>';
			document.getElementById('item_id_label').innerHTML='<?=addslashes(GetMessage('customrank_edit_param3_forum'))?>';
			document.getElementById('forum_item_id').style.display="block";
			break;
		default:
			document.getElementById('param1_label').innerHTML='<?=addslashes(GetMessage('customrank_edit_param1'))?>';
			document.getElementById('param2_label').innerHTML='<?=addslashes(GetMessage('customrank_edit_param2'))?>';
			document.getElementById('item_id_label').innerHTML='<?=addslashes(GetMessage('customrank_edit_param3'))?>';
			document.getElementById('main_item_id').style.display="block";
			break;
	}
}
var processing = false;
function GetAdminDiv(id, url, is_first, is_last)
{
	processing = true;
	CHttpRequest.Action = function(result)
	{
		if(is_last)
			CloseWaitWindow();
		document.getElementById(id).innerHTML = result;
		processing = false;
	}
	if(is_first)
		ShowWaitWindow();
	CHttpRequest.Send(url);
}
function BoxUpdateParam1()
{
	GetAdminDiv('param1_result_div'
		,'search_customrank_edit.php?get_select=Y'
		+'&'+'PARAM=1'
		+'&'+'FIELD_ID=PARAM1'
		+'&'+'SITE_ID='+encodeURIComponent(document.getElementById('SITE_ID').value)
		+'&'+'MODULE_ID='+encodeURIComponent(document.getElementById('MODULE_ID').value)
		+'&'+'PARAM1='+encodeURIComponent(document.getElementById('PARAM1').value)
	,true, false);
	ParamUpdate();
}
function BoxUpdateParam2()
{
	GetAdminDiv('param2_result_div'
		,'search_customrank_edit.php?get_select=Y'
		+'&'+'PARAM=2'
		+'&'+'FIELD_ID=PARAM2'
		+'&'+'SITE_ID='+encodeURIComponent(document.getElementById('SITE_ID').value)
		+'&'+'MODULE_ID='+encodeURIComponent(document.getElementById('MODULE_ID').value)
		+'&'+'PARAM1='+encodeURIComponent(document.getElementById('PARAM1').value)
		+'&'+'PARAM2='+encodeURIComponent(document.getElementById('PARAM2').value)
	,false, true);
	ParamUpdate();
}
function BoxUpdateNew(step)
{
	if(step=='param1')
	{
		BoxUpdateParam1();
		setTimeout("BoxUpdateNew('param2')", 500);
	}
	if(step=='param2')
	{
		if(processing)
			setTimeout("BoxUpdateNew('param2')", 500);
		else
			BoxUpdateParam2();
	}
}
</script>

<IFRAME name=hiddenframeX1 src="" width=0 height=0 style="width:0px; height:0px; border:0px;"></IFRAME>

<form method="POST" Action="<?php echo $APPLICATION->GetCurPage()?>" ENCTYPE="multipart/form-data" name="post_form" id="tbl_search">
<?php
$tabControl->Begin();
$tabControl->BeginNextTab();
?>
	<tr>
		<td width="40%"><?=GetMessage('customrank_edit_site')?></td>
		<td width="60%"><?php echo CLang::SelectBox('SITE_ID', $customRankData['SITE_ID'], '', "BoxUpdateNew('param1')", ' id="SITE_ID"');?></td>
	</tr>
	<tr>
		<td><?=GetMessage('customrank_edit_module')?></td>
		<td>
		<select name="MODULE_ID" id="MODULE_ID" OnChange="BoxUpdateNew('param1')">
		<option value="main"<?=$customRankData['MODULE_ID'] === 'main' ? ' selected' : ''?>><?=GetMessage('customrank_edit_files')?></option>
		<?php foreach (CSearchParameters::GetModulesList() as $module_id => $module_name):?>
			<option value="<?php echo $module_id?>"<?=$customRankData['MODULE_ID'] == $module_id ? ' selected' : ''?>><?php echo htmlspecialcharsbx($module_name)?></option>
		<?php endforeach;?>
		</select>
		</td>
	</tr>
	<tr>
		<td><span id="param1_label"><?=GetMessage('customrank_edit_param1')?></span></td>
		<td>
		<div id="param1_result_div">
		<?php if ($customRankData['MODULE_ID'] === 'iblock' && CModule::IncludeModule('iblock')):?>
			<select name="PARAM1" id="PARAM1" OnChange="BoxUpdateNew('param1')">
			<option value=""><?=GetMessage('customrank_edit_no')?></option>
			<?php
			$rsType = CIBlockType::GetList(['sort' => 'asc'], ['ACTIVE' => 'Y']);
			while ($arr = $rsType->GetNext())
			{
				if ($ar = CIBlockType::GetByIDLang($arr['ID'], LANGUAGE_ID)):?>
				<option value="<?php echo $arr['ID']?>"<?=$arr['ID'] == $customRankData['PARAM1'] ? ' selected' : ''?>><?php echo '[' . $arr['ID'] . '] ' . $ar['NAME']?></option>
				<?php endif;
			}
		?>
			</select>
		<?php elseif ($customRankData['MODULE_ID'] === 'forum' && CModule::IncludeModule('forum')):?>
			<select name="PARAM1" id="PARAM1" OnChange="BoxUpdateNew('param1')">
			<option value=""><?=GetMessage('customrank_edit_no')?></option>
		<?php
			$rsForum = CForumNew::GetList(['sort' => 'asc'], ['LID' => $customRankData['SITE_ID']]);
			while ($arForum = $rsForum->Fetch())
			{
				$arForum['ID'] = intval($arForum['ID']);
			?>
				<option value="<?=$arForum['ID']?>"<?=$arForum['ID'] == $customRankData['PARAM1'] ? ' selected' : ''?>><?='[' . $arForum['ID'] . '] ' . htmlspecialcharsbx($arForum['NAME'])?></option>
			<?php }
		?>
			</select>
		<?php else:?>
			&nbsp;<input type="hidden" name="PARAM1" id="PARAM1" value="">
		<?php endif;?>
		</div>
		</td>
	</tr>
	<tr>
		<td><span id="param2_label"><?=GetMessage('customrank_edit_param2')?></span></font></td>
		<td>
		<div id="param2_result_div">
		<?php if ($customRankData['MODULE_ID'] === 'iblock' && $customRankData['PARAM1'] !== '' && CModule::IncludeModule('iblock')):?>
			<select name="PARAM2" id="PARAM2" OnChange="BoxUpdateNew('param1')">
			<option value=""><?=GetMessage('customrank_edit_no')?></option>
			<?php
			$rsIBlock = CIBlock::GetList(['SORT' => 'ASC'],['TYPE' => $customRankData['PARAM1'],'LID' => $customRankData['SITE_ID']]);
			while ($arIBlock = $rsIBlock->Fetch())
			{
				$arIBlock['ID'] = intval($arIBlock['ID']);
			?>
				<option value="<?=$arIBlock['ID']?>"<?=$arIBlock['ID'] == $customRankData['PARAM2'] ? ' selected' : ''?>><?='[' . $arIBlock['ID'] . '] ' . htmlspecialcharsbx($arIBlock['NAME'])?></option>
			<?php }
			?>
			</select>
		<?php elseif ($customRankData['MODULE_ID'] === 'forum' && CModule::IncludeModule('forum')):?>
			<input name="PARAM2" id="PARAM2" value="<?=htmlspecialcharsbx($customRankData['PARAM2'])?>" size="15" type="text">
		<?php else:?>
			&nbsp;<input type="hidden" name="PARAM2" id="PARAM2" value="">
		<?php endif;?>
		</select>
		</div>
		</td>
	</tr>
	<tr>
		<td><span id="item_id_label"><?=GetMessage('customrank_edit_param3')?></span></td>
		<td>
		<div id="iblock_item_id" style="display:<?=$customRankData['MODULE_ID'] === 'iblock' ? 'block' : 'none'?>">
		<input name="ITEM_ID[KEY]" id="ITEM_ID[KEY]" value="<?=htmlspecialcharsbx($customRankData['ITEM_ID'])?>" size="10" type="text">
		<input type="button" value="..." id="ITEM_ID_CHOOSE" onClick="jsUtils.OpenWindow('iblock_element_search.php?lang=<?=LANGUAGE_ID?>&amp;IBLOCK_ID='+document.getElementById('PARAM2').value+'&amp;n=ITEM_ID&amp;k=KEY', 600, 500);">
		&nbsp;<span id="sp_<?=md5('ITEM_ID')?>_<?='KEY'?>" class="tablebodytext">
		<?php
		if ($customRankData['MODULE_ID'] === 'iblock' && $customRankData['PARAM1'] !== '' && $customRankData['PARAM2'] !== '' && $customRankData['ITEM_ID'] !== '')
		{
			echo CSearchCustomRank::__GetParam(LANGUAGE_ID, $customRankData['SITE_ID'], $customRankData['MODULE_ID'], $customRankData['PARAM1'], $customRankData['PARAM2'], $customRankData['ITEM_ID']);
		}
		?>
		</span>
		</div>
		<div id="main_item_id" style="display:<?=$customRankData['MODULE_ID'] === 'main' ? 'block' : 'none'?>">
		<input name="ITEM_ID[MAIN]" id="ITEM_ID[MAIN]" value="<?=htmlspecialcharsbx($customRankData['ITEM_ID'])?>" size="40" type="text">
		</div>
		<div id="forum_item_id" style="display:<?=$customRankData['MODULE_ID'] === 'forum' ? 'block' : 'none'?>">
		<input name="ITEM_ID[FORUM]" id="ITEM_ID[FORUM]" value="<?=htmlspecialcharsbx($customRankData['ITEM_ID'])?>" size="15" type="text">
		</div>
		</td>

	</tr>
	<tr>
		<td><?=GetMessage('customrank_edit_sort')?></td>
		<td>
		<input name="RANK" id="RANK" value="<?=htmlspecialcharsbx($customRankData['RANK'])?>" size="10" type="text">
		</td>

	</tr>
<?php
$tabControl->Buttons(
	[
		'disabled' => ($POST_RIGHT < 'W'),
		'back_url' => 'search_customrank_admin.php?lang=' . LANGUAGE_ID,

	]
);
?>
<?php echo bitrix_sessid_post();?>
<input type="hidden" name="lang" value="<?=LANGUAGE_ID?>">
<?php if ($ID > 0):?>
	<input type="hidden" name="ID" value="<?=$ID?>">
<?php endif;?>
<?php
$tabControl->End();
?>
</form>

<script>
	ParamUpdate();
</script>
<?php require $_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/main/include/epilog_admin.php';
