<?php

/**
 * Bitrix Framework
 * @package bitrix
 * @subpackage main
 * @copyright 2001-2026 Bitrix
 */

/**
 * @global CUser $USER
 * @global CMain $APPLICATION
 * @global CDatabase $DB
 */

use Bitrix\Main\Application;

require_once __DIR__ . '/../include/prolog_admin_before.php';

if (!$USER->CanDoOperation('edit_ratings'))
{
	$APPLICATION->AuthForm(GetMessage('ACCESS_DENIED'));
}

IncludeModuleLangFile(__FILE__);

$ID = (int)($_REQUEST['ID'] ?? 0);
$message = null;
$bVarsFromForm = false;
$bTypeChange = isset($_POST['action']) && $_POST['action'] == 'type_changed';
$session = Application::getInstance()->getSession();

if ($_SERVER['REQUEST_METHOD'] == 'POST' && (!empty($_POST['save']) || !empty($_POST['apply'])) && check_bitrix_sessid())
{
	$arFields = [
		'ACTIVE' => $_POST['ACTIVE'] ?? 'N',
		'ACTIVATE' => $_POST['ACTIVATE'] ?? 'N',
		'DEACTIVATE' => $_POST['DEACTIVATE'] ?? 'N',
		'NAME' => $_POST['NAME'] ?? '',
		'ENTITY_TYPE_ID' => $_POST['ENTITY_TYPE_ID'] ?? '',
		'CONDITION_NAME' => $_POST['CONDITION_NAME'] ?? '',
		'CONDITION_CONFIG' => $_POST['CONDITION_CONFIG'] ?? '',
	];
	if (isset($_POST['ACTION_NAME']))
	{
		$arFields['ACTION_NAME'] = $_POST['ACTION_NAME'];
		$arFields['ACTION_CONFIG'] = $_POST['ACTION_CONFIG'] ?? '';
	}

	if ($ID > 0)
	{
		$res = CRatingRule::Update($ID, $arFields);
	}
	else
	{
		$ID = CRatingRule::Add($arFields);
		$res = ($ID > 0);
	}

	if ($res)
	{
		if (!empty($_POST['apply']))
		{
			$session['SESS_ADMIN']['RATING_RULE_EDIT_MESSAGE'] = [
				'MESSAGE' => GetMessage('RATING_RULE_EDIT_SUCCESS'),
				'TYPE' => 'OK',
			];
			LocalRedirect('rating_rule_edit.php?ID=' . $ID . '&lang=' . LANGUAGE_ID);
		}
		else
		{
			LocalRedirect(!empty($_REQUEST['addurl']) ? $_REQUEST['addurl'] : 'rating_rule_list.php?lang=' . LANGUAGE_ID);
		}
	}
	else
	{
		if ($e = $APPLICATION->GetException())
		{
			$message = new CAdminMessage(GetMessage('RATING_RULE_EDIT_ERROR'), $e);
		}
		$bVarsFromForm = true;
	}
}

$ratingRuleData = [
	'ACTIVE' => 'Y',
	'ACTIVATE' => 'N',
	'DEACTIVATE' => 'N',
	'NAME' => GetMessage('RATING_RULE_DEF_NAME'),
	'ENTITY_TYPE_ID' => 'USER',
	'CONDITION_NAME' => 'RATING',
	'CONDITION_CONFIG' => [],
	'ACTION_NAME' => 'ADD_TO_GROUP',
	'ACTION_CONFIG' => [],
];

$checkboxes = [
	'ACTIVE' => 1,
	'ACTIVATE' => 1,
	'DEACTIVATE' => 1,
];

$arrayFields = [
	'CONDITION_CONFIG' => 1,
	'ACTION_CONFIG' => 1,
];

if ($ID > 0 && !$bTypeChange)
{
	$ratingRule = CRatingRule::GetByID($ID);
	$ratingRuleRow = $ratingRule->Fetch();
	if ($ratingRuleRow)
	{
		foreach ($ratingRuleData as $key => $value)
		{
			$ratingRuleData[$key] = $ratingRuleRow[$key] ?? $value;
		}

		$ratingRuleData['CONDITION_CONFIG'] = unserialize($ratingRuleData['CONDITION_CONFIG'], ['allowed_classes' => false]);
		if (!is_array($ratingRuleData['CONDITION_CONFIG']))
		{
			$ratingRuleData['CONDITION_CONFIG'] = [];
		}

		$ratingRuleData['ACTION_CONFIG'] = unserialize($ratingRuleData['ACTION_CONFIG'], ['allowed_classes' => false]);
		if (!is_array($ratingRuleData['ACTION_CONFIG']))
		{
			$ratingRuleData['ACTION_CONFIG'] = [];
		}
	}
	else
	{
		$ID = 0;
	}
}

if ($bVarsFromForm || $bTypeChange)
{
	foreach ($ratingRuleData as $key => $value)
	{
		if (isset($_POST[$key]) || isset($checkboxes[$key]))
		{
			if (isset($arrayFields[$key]))
			{
				$ratingRuleData[$key] = is_array($_POST[$key] ?? null) ? $_POST[$key] : [];
			}
			elseif (isset($checkboxes[$key]))
			{
				$ratingRuleData[$key] = $_POST[$key] ?? 'N';
			}
			else
			{
				$ratingRuleData[$key] = $_POST[$key];
			}
		}
	}
}

$sDocTitle = $ID > 0
	? GetMessage('MAIN_RATING_RULE_EDIT_RECORD', ['#ID#' => $ID])
	: GetMessage('MAIN_RATING_RULE_NEW_RECORD');
$APPLICATION->SetTitle($sDocTitle);

require $_SERVER['DOCUMENT_ROOT'] . BX_ROOT . '/modules/main/include/prolog_admin_after.php';

$aMenu = [
	[
		'TEXT' => GetMessage('RATING_RULE_LIST'),
		'TITLE' => GetMessage('RATING_RULE_LIST_TITLE'),
		'LINK' => 'rating_rule_list.php?lang=' . LANGUAGE_ID,
		'ICON' => 'btn_list',
	],
];
if ($ID > 0)
{
	$aMenu[] = ['SEPARATOR' => 'Y'];
	$aMenu[] = [
		'TEXT' => GetMessage('RATING_RULE_EDIT_ADD'),
		'TITLE' => GetMessage('RATING_RULE_EDIT_ADD_TITLE'),
		'LINK' => 'rating_rule_edit.php?lang=' . LANGUAGE_ID,
		'ICON' => 'btn_new',
	];
	$aMenu[] = [
		'TEXT' => GetMessage('RATING_RULE_EDIT_DEL'),
		'TITLE' => GetMessage('RATING_RULE_EDIT_DEL_TITLE'),
		'LINK' => "javascript:if(confirm('" . GetMessage('RATING_RULE_EDIT_DEL_CONF') . "')) window.location='rating_rule_list.php?ID=" . $ID . '&action=delete&lang=' . LANGUAGE_ID . '&' . bitrix_sessid_get() . "';",
		'ICON' => 'btn_delete',
	];
}
$context = new CAdminContextMenu($aMenu);
$context->Show();

$ratingRuleEditMessage = $session['SESS_ADMIN']['RATING_RULE_EDIT_MESSAGE'] ?? null;
if (is_array($ratingRuleEditMessage))
{
	CAdminMessage::ShowMessage($ratingRuleEditMessage);
	$session['SESS_ADMIN']['RATING_RULE_EDIT_MESSAGE'] = false;
}

if ($message)
{
	echo $message->Show();
}

$aTabs = [
	[
		'DIV' => 'edit1',
		'TAB' => GetMessage('RATING_RULE_EDIT_TAB_MAIN'),
		'TITLE' => GetMessage('RATING_RULE_EDIT_TAB_MAIN_TITLE'),
	],
];

$tabControl = new CAdminForm('rating_rule', $aTabs, true, true);
$tabControl->BeginEpilogContent();
?>
<?= bitrix_sessid_post() ?>
	<input type="hidden" name="ID" value="<?= $ID ?>">
	<input type="hidden" name="lang" value="<?= LANGUAGE_ID ?>">
	<input type="hidden" name="action" value="" id="action">
<?php if (!empty($_REQUEST['addurl'])): ?>
	<input type="hidden" name="addurl" value="<?= htmlspecialcharsbx($_REQUEST['addurl']) ?>">
<?php endif ?>
<?php
$tabControl->EndEpilogContent();
$tabControl->Begin();

$tabControl->BeginNextFormTab();

$tabControl->AddEditField('NAME', GetMessage('RATING_RULE_EDIT_FRM_NAME'), true, ['size' => 54, 'maxlength' => 255], $ratingRuleData['NAME']);

$tabControl->BeginCustomField('ACTIVE', GetMessage('RATING_RULE_EDIT_FRM_ACTIVE'), false);
?>
	<tr>
		<td><?= GetMessage('RATING_RULE_EDIT_FRM_ACTIVE') ?></td>
		<td><?= InputType('checkbox', 'ACTIVE', 'Y', $ratingRuleData['ACTIVE']) ?></td>
	</tr>
<?php
$tabControl->EndCustomField('ACTIVE');

$tabControl->BeginCustomField('ENTITY_TYPE_ID', GetMessage('RATING_RULE_EDIT_FRM_TYPE_ID'), true);
$arObjects = CRatingRule::GetRatingRuleObjects();
?>
	<tr style="<?= count($arObjects) > 1 ? '' : 'display:none' ?>" class="adm-detail-required-field">
		<td><?= GetMessage('RATING_RULE_EDIT_FRM_TYPE_ID') ?></td>
		<td><?= SelectBoxFromArray('ENTITY_TYPE_ID', ['reference_id' => $arObjects, 'reference' => $arObjects], $ratingRuleData['ENTITY_TYPE_ID'], '', 'onChange="jsTypeChanged(\'rating_rule_form\')"'); ?></td>
	</tr>
<?php
$tabControl->EndCustomField('ENTITY_TYPE_ID');

$tabControl->AddSection('CAT_HOW_ACTIVATE', GetMessage('RATING_RULE_EDIT_CAT_HOW_ACTIVATE'));

$tabControl->BeginCustomField('CONDITION_NAME', GetMessage('RATING_RULE_EDIT_FRM_CONDITION_NAME'), true);
$arRatingRuleConfigs = CRatingRule::GetRatingRuleConfigs($ratingRuleData['ENTITY_TYPE_ID']);
$arConditionName = [];
foreach ($arRatingRuleConfigs['CONDITION_CONFIG'] as $configId => $arConfig)
{
	$arConditionName['reference'][] = $arConfig['NAME'];
	$arConditionName['reference_id'][] = $arConfig['ID'];
}
$arCurrentCondition = $arRatingRuleConfigs['CONDITION_CONFIG'][$ratingRuleData['CONDITION_NAME']] ?? [];
$conditionCount = count($arCurrentCondition['FIELDS'] ?? []);
?>
	<tr>
		<td colspan="2">
			<table cellpadding="2" cellspacing="0" border="0" width="100%" class="edit-table">
				<tr valign="top" class="adm-detail-required-field">
					<td class="field-name" style="vertical-align:middle;" width="40%">
						<?= GetMessage('RATING_RULE_EDIT_FRM_CONDITION_NAME') ?>:
					</td>
					<td>
						<?= SelectBoxFromArray('CONDITION_NAME', $arConditionName, $ratingRuleData['CONDITION_NAME'], '', 'onChange="jsTypeChanged(\'rating_rule_form\')"'); ?>
					</td>
					<td style="font-size:1em; padding-left: 15px" width="200" rowspan="<?= $conditionCount + 1 ?>">
						<?php if (isset($arCurrentCondition['DESC'])): ?>
							<p style="margin-top:0"><?= $arCurrentCondition['DESC'] ?></p>
						<?php endif ?>
					</td>
				</tr>
				<?php
				for ($i = 0; $i < $conditionCount; $i++)
				{
					$fieldValue = '';
					if (isset($arCurrentCondition['FIELDS'][$i]['ID']))
					{
						$fieldValue = $ratingRuleData['CONDITION_CONFIG'][$arCurrentCondition['ID']][$arCurrentCondition['FIELDS'][$i]['ID']] ?? $arCurrentCondition['FIELDS'][$i]['DEFAULT'] ?? '';
					}

					if (isset($arCurrentCondition['FIELDS'][$i]['TYPE']) && $arCurrentCondition['FIELDS'][$i]['TYPE'] == 'SELECT_CLASS')
					{
						$arSelect = [];
						$arFieldParams = [];
						foreach ($arCurrentCondition['FIELDS'][$i]['PARAMS'] as $key => $value)
						{
							$arFieldParams[$key] = &$arCurrentCondition['FIELDS'][$i]['PARAMS'][$key];
						}

						$res = call_user_func_array([$arCurrentCondition['FIELDS'][$i]['CLASS'], $arCurrentCondition['FIELDS'][$i]['METHOD']], $arFieldParams);
						while ($row = $res->Fetch())
						{
							$arSelect['reference'][] = '[' . $row[$arCurrentCondition['FIELDS'][$i]['FIELD_ID']] . '] ' . $row[$arCurrentCondition['FIELDS'][$i]['FIELD_VALUE']];
							$arSelect['reference_id'][] = $row[$arCurrentCondition['FIELDS'][$i]['FIELD_ID']];
						}
						?>
						<tr valign="top">
							<td class="field-name" style="vertical-align:middle"><label><?= $arCurrentCondition['FIELDS'][$i]['NAME'] ?>:</label></td>
							<td width="25%"><?= SelectBoxFromArray('CONDITION_CONFIG[' . $arCurrentCondition['ID'] . '][' . $arCurrentCondition['FIELDS'][$i]['ID'] . ']', $arSelect, $fieldValue); ?></td>
						</tr>
						<?php
					}
					elseif (isset($arCurrentCondition['FIELDS'][$i]['TYPE']) && $arCurrentCondition['FIELDS'][$i]['TYPE'] == 'SELECT_ARRAY')
					{
						$arSelect = [];
						foreach ($arCurrentCondition['FIELDS'][$i]['PARAMS'] as $key => $value)
						{
							$arSelect['reference'][] = $value;
							$arSelect['reference_id'][] = $key;
						}
						?>
						<tr valign="top">
							<td class="field-name" style="vertical-align:middle"><label><?= $arCurrentCondition['FIELDS'][$i]['NAME'] ?>:</label></td>
							<td width="25%"><?= SelectBoxFromArray('CONDITION_CONFIG[' . $arCurrentCondition['ID'] . '][' . $arCurrentCondition['FIELDS'][$i]['ID'] . ']', $arSelect, $fieldValue, ''); ?></td>
						</tr>
						<?php
					}
					elseif (isset($arCurrentCondition['FIELDS'][$i]['TYPE']) && $arCurrentCondition['FIELDS'][$i]['TYPE'] == 'SELECT_ARRAY_WITH_INPUT')
					{
						$fieldValueInput = $ratingRuleData['CONDITION_CONFIG'][$arCurrentCondition['ID']][$arCurrentCondition['FIELDS'][$i]['ID_INPUT']] ?? $arCurrentCondition['FIELDS'][$i]['DEFAULT_INPUT'];

						$arSelect = [];
						foreach ($arCurrentCondition['FIELDS'][$i]['PARAMS'] as $key => $value)
						{
							$arSelect['reference'][] = $value;
							$arSelect['reference_id'][] = $key;
						}
						?>
						<tr valign="top">
							<td class="field-name" style="vertical-align:middle"><label><?= $arCurrentCondition['FIELDS'][$i]['NAME'] ?>:</label></td>
							<td width="25%">
								<?= SelectBoxFromArray('CONDITION_CONFIG[' . $arCurrentCondition['ID'] . '][' . $arCurrentCondition['FIELDS'][$i]['ID'] . ']', $arSelect, $fieldValue, ''); ?>
								<input type="text" name="CONDITION_CONFIG[<?= $arCurrentCondition['ID'] ?>][<?= $arCurrentCondition['FIELDS'][$i]['ID_INPUT'] ?>]" value="<?= htmlspecialcharsbx($fieldValueInput) ?>" style="width:45px;">
							</td>
						</tr>
						<?php
					}
					elseif (isset($arCurrentCondition['FIELDS'][$i]['TYPE']) && $arCurrentCondition['FIELDS'][$i]['TYPE'] == 'INPUT_INTERVAL')
					{
						$fieldValue2 = $ratingRuleData['CONDITION_CONFIG'][$arCurrentCondition['ID']][$arCurrentCondition['FIELDS'][$i]['ID_2']] ?? $arCurrentCondition['FIELDS'][$i]['DEFAULT_2'];
						?>
						<tr valign="top">
							<td class="field-name" style="vertical-align:middle"><label><?= $arCurrentCondition['FIELDS'][$i]['NAME'] ?>:</label></td>
							<td width="25%" style="vertical-align:middle">
								<?= GetMessage('PP_USER_CONDITION_RATING_INTERVAL_FROM') ?> <input type="text" name="CONDITION_CONFIG[<?= $arCurrentCondition['ID'] ?>][<?= $arCurrentCondition['FIELDS'][$i]['ID'] ?>]" value="<?= htmlspecialcharsbx($fieldValue) ?>" style="width:45px;">
								<?= GetMessage('PP_USER_CONDITION_RATING_INTERVAL_TO') ?> <input type="text" name="CONDITION_CONFIG[<?= $arCurrentCondition['ID'] ?>][<?= $arCurrentCondition['FIELDS'][$i]['ID_2'] ?>]" value="<?= htmlspecialcharsbx($fieldValue2) ?>" style="width:45px;">
							</td>
						</tr>
						<?php
					}
					elseif (isset($arCurrentCondition['FIELDS'][$i]['TYPE']) && $arCurrentCondition['FIELDS'][$i]['TYPE'] == 'SEPARATOR')
					{
						?>
						<tr valign="top" class="heading">
							<td colspan="3"><?= $arCurrentCondition['FIELDS'][$i]['NAME'] ?></td>
						</tr>
						<?php
					}
					elseif (isset($arCurrentCondition['FIELDS'][$i]['TYPE']) && $arCurrentCondition['FIELDS'][$i]['TYPE'] == 'TEXT')
					{
						?>
						<tr valign="top">
							<td colspan="3" style="text-align:center"><?= $arCurrentCondition['FIELDS'][$i]['NAME'] ?></td>
						</tr>
						<?php
					}
					else
					{
						?>
						<tr valign="top">
							<td class="field-name" style="vertical-align:middle"><label><?= $arCurrentCondition['FIELDS'][$i]['NAME'] ?>:</label></td>
							<td width="25%" style="vertical-align:middle"><input type="text" name="CONDITION_CONFIG[<?= $arCurrentCondition['ID'] ?>][<?= $arCurrentCondition['FIELDS'][$i]['ID'] ?>]" size="<?= (int)$arCurrentCondition['FIELDS'][$i]['SIZE'] ?>" value="<?= htmlspecialcharsbx($fieldValue) ?>"> <?= $arCurrentCondition['FIELDS'][$i]['NAME_DESC'] ?? '' ?></td>
						</tr>
						<?php
					}
				}
				?>
			</table>
		</td>
	</tr>
<?php
$tabControl->EndCustomField('CONDITION_NAME');

if (!isset($arCurrentCondition['HIDE_ACTION']) || !$arCurrentCondition['HIDE_ACTION'])
{
	$tabControl->AddSection('CAT_WHAT_DO', GetMessage('RATING_RULE_EDIT_CAT_WHAT_DO'));

	$tabControl->BeginCustomField('ACTION_NAME', GetMessage('RATING_RULE_EDIT_FRM_ACTION_NAME'), true);
	$arActionName = [];
	foreach ($arRatingRuleConfigs['ACTION_CONFIG'] as $configId => $arConfig)
	{
		$arActionName['reference'][] = $arConfig['NAME'];
		$arActionName['reference_id'][] = $arConfig['ID'];
	}
	$arCurrentAction = $arRatingRuleConfigs['ACTION_CONFIG'][$ratingRuleData['ACTION_NAME']] ?? [];
	if ($ID == 0 && empty($_POST))
	{
		$ratingRuleData['ACTIVATE'] = $arCurrentAction['ACTIVATE_DEFAULT'] ?? $ratingRuleData['ACTIVATE'];
		$ratingRuleData['DEACTIVATE'] = $arCurrentAction['DEACTIVATE_DEFAULT'] ?? $ratingRuleData['DEACTIVATE'];
	}
	$actionCount = count($arCurrentAction['FIELDS'] ?? []);
	?>
	<tr>
		<td colspan="2">
			<table cellpadding="2" cellspacing="0" border="0" width="100%" class="edit-table">
				<tr valign="top" class="adm-detail-required-field">
					<td class="field-name" style="vertical-align:middle; text-align:right" width="40%">
						<?= GetMessage('RATING_RULE_EDIT_FRM_ACTION_NAME') ?>:
					</td>
					<td>
						<?= SelectBoxFromArray('ACTION_NAME', $arActionName, $ratingRuleData['ACTION_NAME'], '', 'style="width: 300px" onChange="jsTypeChanged(\'rating_rule_form\')"'); ?>
					</td>
					<td style="font-size:1em; padding-left: 15px" rowspan="<?= $actionCount + 1 ?>">
						<?php if (isset($arCurrentAction['DESC'])): ?>
							<p style="margin-top:0"><?= $arCurrentAction['DESC'] ?></p>
						<?php else: ?>
							<p style="margin-top:0"><?= GetMessage('RATING_RULE_EDIT_FRM_ACTION_DESC') ?></p>
						<?php endif ?>
					</td>
				</tr>
				<?php
				for ($i = 0; $i < $actionCount; $i++)
				{
					$fieldValue = '';
					if (isset($arCurrentAction['FIELDS'][$i]['ID']))
					{
						$fieldValue = $ratingRuleData['ACTION_CONFIG'][$arCurrentAction['ID']][$arCurrentAction['FIELDS'][$i]['ID']] ?? $arCurrentAction['FIELDS'][$i]['DEFAULT'] ?? '';
					}

					if (isset($arCurrentAction['FIELDS'][$i]['TYPE']) && $arCurrentAction['FIELDS'][$i]['TYPE'] == 'SELECT_CLASS')
					{
						$arSelect = [];
						$arFieldParams = [];
						foreach ($arCurrentAction['FIELDS'][$i]['PARAMS'] as $key => $value)
						{
							$arFieldParams[$key] = &$arCurrentAction['FIELDS'][$i]['PARAMS'][$key];
						}
						$res = call_user_func_array([$arCurrentAction['FIELDS'][$i]['CLASS'], $arCurrentAction['FIELDS'][$i]['METHOD']], $arFieldParams);
						while ($row = $res->Fetch())
						{
							$arSelect['reference'][] = $row[$arCurrentAction['FIELDS'][$i]['FIELD_VALUE']];
							$arSelect['reference_id'][] = $row[$arCurrentAction['FIELDS'][$i]['FIELD_ID']];
						}
						?>
						<tr valign="top">
							<td class="field-name" style="vertical-align:middle"><label><?= $arCurrentAction['FIELDS'][$i]['NAME'] ?>:</label></td>
							<td width="25%"><?= SelectBoxFromArray('ACTION_CONFIG[' . $arCurrentAction['ID'] . '][' . $arCurrentAction['FIELDS'][$i]['ID'] . ']', $arSelect, $fieldValue, '', 'style="width: 300px"'); ?></td>
						</tr>
						<?php
					}
					elseif (isset($arCurrentAction['FIELDS'][$i]['TYPE']) && $arCurrentAction['FIELDS'][$i]['TYPE'] == 'SELECT_CLASS_ARRAY')
					{
						$arSelect = [];
						$arFieldParams = [];
						foreach ($arCurrentAction['FIELDS'][$i]['PARAMS'] as $key => $value)
						{
							$arFieldParams[$key] = &$arCurrentAction['FIELDS'][$i]['PARAMS'][$key];
						}
						$array = call_user_func_array([$arCurrentAction['FIELDS'][$i]['CLASS'], $arCurrentAction['FIELDS'][$i]['METHOD']], $arFieldParams);
						foreach ($array as $key => $value)
						{
							$arSelect['reference'][] = $value;
							$arSelect['reference_id'][] = $key;
						}
						?>
						<tr valign="top">
							<td class="field-name" style="vertical-align:middle"><label><?= $arCurrentAction['FIELDS'][$i]['NAME'] ?>:</label></td>
							<td width="25%"><?= SelectBoxFromArray('ACTION_CONFIG[' . $arCurrentAction['ID'] . '][' . $arCurrentAction['FIELDS'][$i]['ID'] . ']', $arSelect, $fieldValue, '', 'style="width: 300px"'); ?></td>
						</tr>
						<?php
					}
					elseif (isset($arCurrentAction['FIELDS'][$i]['TYPE']) && $arCurrentAction['FIELDS'][$i]['TYPE'] == 'SELECT_ARRAY')
					{
						$arSelect = [];
						foreach ($arCurrentAction['FIELDS'][$i]['PARAMS'] as $key => $value)
						{
							$arSelect['reference'][] = $value;
							$arSelect['reference_id'][] = $key;
						}
						?>
						<tr valign="top">
							<td class="field-name" style="vertical-align:middle"><label><?= $arCurrentAction['FIELDS'][$i]['NAME'] ?>:</label></td>
							<td width="25%"><?= SelectBoxFromArray('ACTION_CONFIG[' . $arCurrentAction['ID'] . '][' . $arCurrentAction['FIELDS'][$i]['ID'] . ']', $arSelect, $fieldValue, ''); ?></td>
						</tr>
						<?php
					}
					elseif (isset($arCurrentAction['FIELDS'][$i]['TYPE']) && $arCurrentAction['FIELDS'][$i]['TYPE'] == 'SELECT_ARRAY_WITH_INPUT')
					{
						$fieldValueInput = $ratingRuleData['ACTION_CONFIG'][$arCurrentAction['ID']][$arCurrentAction['FIELDS'][$i]['ID_INPUT']] ?? $arCurrentAction['FIELDS'][$i]['DEFAULT_INPUT'];

						$arSelect = [];
						foreach ($arCurrentCondition['FIELDS'][$i]['PARAMS'] as $key => $value)
						{
							$arSelect['reference'][] = $value;
							$arSelect['reference_id'][] = $key;
						}
						?>
						<tr valign="top">
							<td class="field-name" style="vertical-align:middle"><label><?= $arCurrentAction['FIELDS'][$i]['NAME'] ?>:</label></td>
							<td width="25%">
								<?= SelectBoxFromArray('CONDITION_CONFIG[' . $arCurrentAction['ID'] . '][' . $arCurrentAction['FIELDS'][$i]['ID'] . ']', $arSelect, $fieldValue, ''); ?>
								<input type="text" name="CONDITION_CONFIG[<?= $arCurrentAction['ID'] ?>][<?= $arCurrentAction['FIELDS'][$i]['ID_INPUT'] ?>]" value="<?= htmlspecialcharsbx($fieldValueInput) ?>" style="width:45px;">
							</td>
						</tr>
						<?php
					}
					elseif (isset($arCurrentAction['FIELDS'][$i]['TYPE']) && $arCurrentAction['FIELDS'][$i]['TYPE'] == 'TEXTAREA')
					{
						?>
						<tr valign="top">
							<td class="field-name" style="vertical-align:middle"><label><?= $arCurrentAction['FIELDS'][$i]['NAME'] ?>:</label></td>
							<td width="25%"><textarea name="ACTION_CONFIG[<?= $arCurrentAction['ID'] ?>][<?= $arCurrentAction['FIELDS'][$i]['ID'] ?>]" wrap="OFF" rows="10" cols="34"><?= htmlspecialcharsbx($fieldValue) ?></textarea></td>
						</tr>
						<?php
					}
					else
					{
						?>
						<tr valign="top">
							<td class="field-name" style="vertical-align:middle"><label><?= $arCurrentAction['FIELDS'][$i]['NAME'] ?>:</label></td>
							<td width="25%"><input type="text" name="ACTION_CONFIG[<?= $arCurrentAction['ID'] ?>][<?= $arCurrentAction['FIELDS'][$i]['ID'] ?>]" value="<?= htmlspecialcharsbx($fieldValue) ?>"></td>
						</tr>
						<?php
					}
				}
				?>
			</table>
		</td>
	</tr>
	<?php
	$tabControl->EndCustomField('ACTION_NAME');
}
$tabControl->Buttons([
	'disabled' => false,
	'back_url' => !empty($_REQUEST['addurl']) ? $_REQUEST['addurl'] : 'rating_rule_list.php?lang=' . LANGUAGE_ID,
]);
$tabControl->Show();
$tabControl->ShowWarnings($tabControl->GetName(), $message);
?>
<script>
function jsTypeChanged(form_id)
{
	var _form = document.forms[form_id];
	var _flag = document.getElementById('action');
	if (_form)
	{
		_flag.value = 'type_changed';
		_form.submit();
	}
}
</script>
<style type="text/css">.field-name { text-align:right; padding-top: 10px; vertical-align: top!important }</style>
<?php
require_once $_SERVER['DOCUMENT_ROOT'] . BX_ROOT . '/modules/main/include/epilog_admin.php';
