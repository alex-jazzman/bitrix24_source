<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

/** @var array $arParams */
/** @var array $arResult */

use \Bitrix\Landing\Manager;
use \Bitrix\Main\Localization\Loc;

Loc::loadMessages(__FILE__);
Manager::setPageTitle(Loc::getMessage('LANDING_TPL_TITLE_EDIT'));

\Bitrix\Main\UI\Extension::load('ui.design-tokens');
\Bitrix\Main\UI\Extension::load("ui.hint");
$this->addExternalCss('/bitrix/css/main/table/style.css');

// show errors
$hasErrors = (bool)$arResult['ERRORS'];
if ($hasErrors)
{
	?><div class="landing-message-label error" id="landing-role-edit-error" role="alert" tabindex="-1" data-testid="role-edit-error"><?
	foreach ($arResult['ERRORS'] as $error)
	{
		echo \htmlspecialcharsbx($error) . '<br/>';
	}
	?></div><?
}
// a fatal error leaves the rest of arResult unfilled, so nothing below may be read
if ($arResult['FATAL'])
{
	return;
}

if ($arResult['EXTENDED'])
{
	?>
	<form action="<?=POST_FORM_ACTION_URI;?>" method="post" data-testid="role-edit-mode-form">
		<?= bitrix_sessid_post();?>
		<input type="hidden" name="action" value="mode"/>
		<p><?=Loc::getMessage('LANDING_TPL_EXTENDED_MODE');?></p>
		<button type="submit" class="ui-btn ui-btn-success" data-testid="role-edit-mode-switch-btn" value="<?=Loc::getMessage(
			'LANDING_TPL_BUTTON_MODE_TO_ROLE'
		);?>">
			<?=Loc::getMessage('LANDING_TPL_BUTTON_MODE_TO_ROLE');?>
		</button>
	</form>
	<?
	return;
}

$context = \Bitrix\Main\Application::getInstance()->getContext();
$request = $context->getRequest();
$row = $arResult['ROLE'];
$reverseDefaultCodes = ['admin'];
$reverseActionsCodes = ['unexportable', 'knowledge_unexportable'];

// a phrase of an attribute is encoded before the values go in: the values are encoded already
$attrPhrase = function($phraseCode, array $replace = [])
{
	$phrase = \htmlspecialcharsbx((string)Loc::getMessage($phraseCode));

	return $replace
		? \str_replace(array_keys($replace), array_values($replace), $phrase)
		: $phrase;
};

// function for draw one tr (one site)
// $title is already escaped: both call points below pass a value run through htmlspecialcharsbx
$drawTr = function($siteId, array $selectedId = [], $title = '') use($arResult, $arParams, $attrPhrase)
{
	static $count = 0;

	$html = '';
	if ($count == 0)
	{
		$count = count($arResult['TASKS']);
	}

	foreach (array_values($arResult['TASKS']) as $i => $right)
	{
		$code = $right['NAME'];
		if ($code == $arResult['TASK_DENIED_CODE'])
		{
			continue;
		}
		if ($code == 'public' && $arParams['TYPE'] == 'KNOWLEDGE')
		{
			continue;
		}
		$notSelected = !in_array($code, $selectedId) ? ' selected="selected"' : '';
		$right['TITLE'] = \htmlspecialcharsbx($right['TITLE']);
		$html .= '
			<tr class="tr-first landing-rightsblock-' . $siteId . (!$html ? ' landing-rightsblock-content' : '') . '">
				<td class="table-blue-td-name">
					' . (!$html ? '<a name="site' . $siteId . '"></a>' . $title : '') . '
				</td>
				<td class="table-blue-td-param">
					<label for="landing-operation-' . $siteId . '-' . $code . '">
						' .$right['TITLE'] . '
					</label>
				</td>
				<td class="table-blue-td-select table-blue-td-select-landing">
					<select class="table-blue-select" name="fields[RIGHTS][' . $siteId . '][]"' .
						' id="landing-operation-' . $siteId . '-' . $code . '"' .
						' aria-label="' . $attrPhrase('LANDING_TPL_ARIA_RIGHT_SELECT', [
							'#SITE#' => $title,
							'#RIGHT#' => $right['TITLE'],
						]) . '"' .
						' data-testid="role-edit-right-select">
						<option value="' . $code . '">' . Loc::getMessage('LANDING_TPL_RIGHT_ALLOW') . '</option>
						<option value="" ' . $notSelected . '>' . Loc::getMessage('LANDING_TPL_RIGHT_DISALLOW') . '</option>
					</select>
				</td>
				<td class="table-blue-td-select-remove">
					' . (
						($i == $count-1 && $siteId > 0)
						? '<button type="button" class="landing-rightsblock-remove bitrix24-metrika" data-metrika24="role_site_delete" data-id="' . $siteId . '"' .
							' aria-label="' . $attrPhrase('LANDING_TPL_ARIA_REMOVE_SITE_RIGHTS', ['#SITE#' => $title]) . '"' .
							' data-testid="role-edit-site-remove-btn">
								' . Loc::getMessage('LANDING_TPL_BUTTON_DEL_RIGHT') . '
							</button>'
						: ''
					) . '
				</td>
			</tr>';
	}

	return $html;
};

// add new site in selected
if ($request->get('site'))
{
	$newSite = $request->get('site');
	if (!isset($arResult['RIGHTS'][$newSite]))
	{
		$arResult['RIGHTS'][$newSite] = [];
	}
}

// default rights ???
if (!isset($arResult['RIGHTS'][0]))
{
	$arResult['RIGHTS'][0] = [];
}

// clear sites array
foreach ($arResult['SITES'] as &$site)
{
	$site = [
		'ID' => $site['ID'],
		'TITLE' => \htmlspecialcharsbx($site['TITLE']),
		'DELETED' => $site['DELETED']
	];
}
unset($site);
?>

<form action="<?= POST_FORM_ACTION_URI;?>" method="post" class="ui-form landing-form-gray-padding" id="landing-role-edit" data-testid="role-edit-form">
	<input type="hidden" name="fields[SAVE_FORM]" value="Y" />
	<input type="hidden" name="data[id]" value="<?= $arParams['ROLE_EDIT'];?>" />
	<?= bitrix_sessid_post();?>

	<div class="landing-form-role-title">
		<label class="landing-form-role-caption" for="landing-role-title"><?= Loc::getMessage('LANDING_TPL_CAPTION');?>:</label>
		<?php
		// `required` would turn the check on in the browser and the form would never reach the server,
		// where the empty title is answered with the error block above.
		// The raw `~CURRENT` is escaped here: `CURRENT` is its escaped twin and would be encoded twice
		?>
		<input class="landing-form-role-input" type="text" id="landing-role-title" name="fields[TITLE]" value="<?= \htmlspecialcharsbx($row['TITLE']['~CURRENT']);?>" placeholder="<?= \htmlspecialcharsbx($row['TITLE']['TITLE']);?>" aria-required="true"<?= $hasErrors ? ' aria-describedby="landing-role-edit-error"' : '';?> data-testid="role-edit-title-input" />
	</div>

	<table class="table-blue table-blue-landing-role" id="landing-role-rights-table" tabindex="-1" data-testid="role-edit-rights-table">
		<tbody>
		<tr>
			<th scope="col" class="table-blue-td-title">
				<?= Loc::getMessage('LANDING_TPL_RIGHT_ENTITY');?>
			</th>
			<th scope="col" class="table-blue-td-title">
				<?= Loc::getMessage('LANDING_TPL_RIGHT_TITLE');?>
			</th>
			<th scope="col" class="table-blue-td-title">
				<?= Loc::getMessage('LANDING_TPL_RIGHT_SELECT');?>
			</th>
			<th scope="col" class="table-blue-td-title" data-testid="role-edit-col-actions">
				<span class="landing-role-edit-visually-hidden"><?= Loc::getMessage('LANDING_TPL_COL_ACTIONS');?></span>
			</th>
		</tr>
		<?foreach ($arResult['ADDITIONAL'] as $code => $title):
			$notChecked = ! (
				!is_array($row['ADDITIONAL_RIGHTS']['CURRENT']) ||
				in_array($code, $row['ADDITIONAL_RIGHTS']['CURRENT'])
			);
			if (!is_array($row['ADDITIONAL_RIGHTS']['CURRENT']) && in_array($code, $reverseDefaultCodes, true))
			{
				$notChecked = true;
			}
			$upperCode = mb_strtoupper($code);
			$actionTitle = Loc::getMessage('LANDING_TPL_ADDITIONAL_ACTION_' . $upperCode);
			$actionName = \htmlspecialcharsbx((string)$actionTitle);
			$hintName = $attrPhrase('LANDING_TPL_ARIA_HINT', ['#ACTION#' => $actionName]);
			$hintMoreName = $attrPhrase('LANDING_TPL_ARIA_HINT_MORE', ['#ACTION#' => $actionName]);
			$entityTitle = (string)Loc::getMessage('LANDING_TPL_ADDITIONAL_ENTITY_' . $upperCode);
			?>
			<tr class="tr-first">
				<th scope="row" class="table-blue-td-name">
					<?php
					// a right the portal ships no entity title for still heads its own row: the code
					// keeps the header from being announced empty, the visible cell stays as it was
					?>
					<?php if ($entityTitle !== ''): ?>
						<?= $entityTitle;?>
					<?php else: ?>
						<span class="landing-role-edit-visually-hidden"><?= \htmlspecialcharsbx($code);?></span>
					<?php endif;?>
				</th>
				<td class="table-blue-td-param">
					<?php
					// the hint sits outside the caption: inside it its text would be read as the name of
					// the select the caption binds to
					?>
					<label for="landing-operation-additional-<?= $code;?>">
						<?= $actionTitle;?>
					</label>
					<?php if (Loc::getMessage('LANDING_TPL_ADDITIONAL_ACTION_HINT_' . $upperCode)): ?>
						<button type="button" data-hint="<?= Loc::getMessage('LANDING_TPL_ADDITIONAL_ACTION_HINT_' . $upperCode)?>" class="ui-hint" aria-label="<?= $hintName;?>" data-testid="role-edit-hint-btn"></button>
					<?php endif;?>
					<?php if (Loc::getMessage('LANDING_TPL_ADDITIONAL_ACTION_HINT_INTERACTIVITY_' . $upperCode)): ?>
						<?php $hintHtml = Loc::getMessage('LANDING_TPL_ADDITIONAL_ACTION_HINT_INTERACTIVITY_' . $upperCode)
							. "<br><a href='"
							. \Bitrix\Landing\Help::getHelpUrl($upperCode)
							. "' target='_blank'>"
							. Loc::getMessage('LANDING_TPL_MORE')
							. "</a>";
						?>
						<button type="button" data-hint="<?= $hintHtml?>" data-hint-interactivity data-hint-html class="ui-hint" aria-label="<?= $hintMoreName;?>" data-testid="role-edit-hint-btn"></button>
					<?php endif;?>
				</td>
				<td class="table-blue-td-select">
					<select class="table-blue-select" name="fields[ADDITIONAL][]" id="landing-operation-additional-<?= $code?>" data-testid="role-edit-additional-select">
						<?php if (!in_array($code, $reverseActionsCodes, true)) : ?>
							<option value="<?= $code?>"><?= Loc::getMessage('LANDING_TPL_RIGHT_ALLOW')?></option>
							<option value=""<?= $notChecked ? ' selected="selected"' : ''?>><?= Loc::getMessage('LANDING_TPL_RIGHT_DISALLOW')?></option>
						<?php else:?>
							<option value=""<?= $notChecked ? ' selected="selected"' : ''?>><?= Loc::getMessage('LANDING_TPL_RIGHT_ALLOW')?></option>
							<option value="<?= $code?>"<?= !$notChecked ? ' selected="selected"' : ''?>><?= Loc::getMessage('LANDING_TPL_RIGHT_DISALLOW')?></option>
						<?php endif;?>
					</select>
				</td>
			</tr>
		<?endforeach;?>
		<?
		echo $drawTr(
			0,
			$arResult['RIGHTS'][0],
			\htmlspecialcharsbx((string)$component->getMessageType('LANDING_TPL_RIGHT_DEFAULT_TITLE'))
		);
		foreach ($arResult['RIGHTS'] as $siteId => $rights)
		{
			if (!isset($arResult['SITES'][$siteId]))
			{
				continue;
			}
			$site = $arResult['SITES'][$siteId];
			unset($arResult['SITES'][$siteId]);

			echo $drawTr($siteId, $rights, $site['TITLE']);
		}
		?>
		</tbody>
	</table>

	<?if ($arResult['SITES']):?>
	<div style="padding: 20px 0 20px 0;">
		<button type="button" class="landing-role-add bitrix24-metrika" <?
			?>data-metrika24="role_site_add" <?
			?>id="landing-role-add" <?
			?>aria-haspopup="true" <?
			?>aria-expanded="false" <?
			?>data-testid="role-edit-site-add-btn" <?
			?>onclick="showSiteMenu(
				this,
				<?= \CUtil::phpToJSObject($arResult['SITES']);?>,
				{
					LANDING_ALERT_CONTENT_RELOADED: '<?= \CUtil::jsEscape(Loc::getMessage('LANDING_ALERT_CONTENT_RELOADED'));?>'
				}
			)">
			<?= $component->getMessageType('LANDING_TPL_ADD_FOR_SITE');?>
		</button>
	</div>
	<?else:?>
		<div style="padding-top: 20px;"></div>
	<?endif;?>

	<div class="pinable-block">
		<div class="landing-form-footer-container">
			<button id="landing-rights-save" type="submit" class="ui-btn ui-btn-success bitrix24-metrika" data-metrika24="role_save" name="submit" value="<?= Loc::getMessage('LANDING_TPL_BUTTON_SAVE');?>" data-testid="role-edit-save-btn">
				<?= Loc::getMessage('LANDING_TPL_BUTTON_SAVE');?>
			</button>
			<a id="landing-rights-cancel" class="ui-btn ui-btn-md ui-btn-link landing-rights-cancel" href="<?= $arParams['PAGE_URL_ROLES'];?>" data-testid="role-edit-cancel-link">
				<?= Loc::getMessage('LANDING_TPL_BUTTON_CANCEL');?>
			</a>
		</div>
	</div>
</form>
<script>
	BX.ready(function() {
		BX.UI.Hint.init(BX('landing-role-edit'));
	})
</script>

