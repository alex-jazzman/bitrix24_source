<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use \Bitrix\Main\Localization\Loc;
use \Bitrix\Landing\Manager;

Loc::loadMessages(__FILE__);
Manager::setPageTitle(Loc::getMessage('LANDING_TPL_TITLE'));

\Bitrix\Main\UI\Extension::load('ui.design-tokens');
\Bitrix\Main\Page\Asset::getInstance()->addCss(
	'/bitrix/css/main/table/style.css'
);

if ($arResult['ERRORS'])
{
	\showError(implode("\n", $arResult['ERRORS']));
}
if ($arResult['FATAL'])
{
	return;
}

\Bitrix\Main\UI\Extension::load([
	'access',
	'ui.design-tokens'
]);

// a phrase of an attribute is encoded before the values go in: the values are encoded already
$attrPhrase = function($phraseCode, array $replace = [])
{
	$phrase = \htmlspecialcharsbx((string)Loc::getMessage($phraseCode));

	return $replace
		? \str_replace(array_keys($replace), array_values($replace), $phrase)
		: $phrase;
};

// $entity is already escaped: the default is the placeholder the client script fills in
$drawSelect = function($position = '#inc#', $selectedId = null, $entity = '#entity#') use($arResult, $attrPhrase)
{
	$select = '<select class="table-blue-select" name="rights[ROLE_ID][' . $position . ']"'
			. ' aria-label="' . $attrPhrase('LANDING_TPL_ARIA_ROLE_SELECT', ['#ENTITY#' => $entity]) . '"'
			. ' data-testid="roles-right-role-select">';
	foreach ($arResult['ROLES'] as $role)
	{
		$selected = ($role['ID'] == $selectedId) ? ' selected="selected"' : '';
		$role['TITLE'] = \htmlspecialcharsbx($role['TITLE']);
		$select .= '<option title="'. $role['TITLE'] . '" value="'. $role['ID'] .'"' . $selected . '>';
		$select .= $role['TITLE'];
		$select .= '</option>';
	}
	$select .= '</select>';

	return $select;
};
if (isset($arResult['ACCESS_CODES']))
{
	$accessCodes = array_keys($arResult['ACCESS_CODES']);
}
?>

<?if ($arResult['EXTENDED']):?>
<form action="<?=POST_FORM_ACTION_URI;?>" method="post" data-testid="roles-extended-form">
	<input type="hidden" name="action" value="saveExtended" />
	<?= bitrix_sessid_post();?>
	<table class="table-blue landing-additional-rights-table" id="landing-additional-rights-table" data-testid="roles-additional-rights-table">
		<thead>
		<tr>
			<th scope="col" data-testid="roles-col-name">
				<span class="landing-roles-visually-hidden"><?= Loc::getMessage('LANDING_TPL_COL_NAME');?></span>
			</th>
			<th scope="col" data-testid="roles-col-entity">
				<span class="landing-roles-visually-hidden"><?= Loc::getMessage('LANDING_TPL_COL_ENTITY');?></span>
			</th>
			<th scope="col" data-testid="roles-col-actions">
				<span class="landing-roles-visually-hidden"><?= Loc::getMessage('LANDING_TPL_COL_ACTIONS');?></span>
			</th>
		</tr>
		</thead>
		<tbody>
		<?foreach ($arResult['ADDITIONAL'] as $code => $title):
			$checked = !is_array($row['ADDITIONAL_RIGHTS']['CURRENT']) ||
					   in_array($code, $row['ADDITIONAL_RIGHTS']['CURRENT']);
			$accessCodes = \htmlspecialcharsbx(
				implode(',', array_keys($arResult['ACCESS_CODES'][$code]))
			);
			$rightTitle = \htmlspecialcharsbx($title);
			// a right the portal ships no title for still has to head its row and name its controls
			$rightName = ($rightTitle !== '') ? $rightTitle : \htmlspecialcharsbx($code);
			?>
			<tr class="tr-first">
				<th scope="row" class="table-blue-td-name">
					<?php if ($rightTitle !== ''): ?>
						<?= $rightTitle;?>
					<?php else: ?>
						<span class="landing-roles-visually-hidden"><?= $rightName;?></span>
					<?php endif;?>
				</th>
				<td class="table-blue-td-select" id="landing-additional-rights-fields-<?= $code;?>" data-testid="roles-additional-right-codes">
					<?foreach ($arResult['ACCESS_CODES'][$code] as $codeKey => $accessItem):
						$provider = \htmlspecialcharsbx($accessItem['PROVIDER']);
						$entityName = \htmlspecialcharsbx($accessItem['NAME']);
						$entity = $provider . ': ' . $entityName;
						?>
						<div>
							<input type="hidden" name="rights[<?= $code;?>][]" value="<?= \htmlspecialcharsbx($codeKey);?>">
							<?= $provider;?>: <?= $entityName;?>
							<button type="button" class="table-blue-delete table-blue-delete-landing-role" <?
							?>data-code="<?= $code;?>" <?
							?>data-id="<?= \htmlspecialcharsbx($accessItem['CODE']);?>" <?
							?>onclick="deleteAccessRowExtended(this);" <?
							?>title="<?= $attrPhrase('LANDING_TPL_ACTION_DEL');?>" <?
							?>aria-label="<?= $attrPhrase('LANDING_TPL_ARIA_DELETE_ACCESS_CODE', [
								'#ENTITY#' => $entity,
								'#RIGHT#' => $rightName,
							]);?>" <?
							?>data-testid="roles-access-code-delete-btn"></button>
						</div>
					<?endforeach;?>
				</td>
				<td>
					<button type="button" class="landing-additional-rights-form" <?
					?>data-codes="<?= $accessCodes;?>" <?
					   ?>data-id="<?= $code;?>" <?
					   ?>aria-label="<?= $attrPhrase('LANDING_TPL_ARIA_ADD_ACCESS_CODE', ['#RIGHT#' => $rightName]);?>" <?
					   ?>data-testid="roles-additional-right-add-btn">
						<?= Loc::getMessage('LANDING_TPL_ACTION_RIGHT');?>
					</button>
				</td>
			</tr>
		<?endforeach;?>
		</tbody>
	</table>
	<div class="pinable-block">
		<div class="landing-form-footer-container">
			<button id="landing-rights-save" type="submit" class="ui-btn ui-btn-success" name="submit" value="<?= Loc::getMessage('LANDING_TPL_BUTTON_SAVE');?>" data-testid="roles-save-btn">
				<?= Loc::getMessage('LANDING_TPL_BUTTON_SAVE');?>
			</button>
		</div>
	</div>
</form>

<form action="<?=POST_FORM_ACTION_URI;?>" method="post" data-testid="roles-mode-form">
	<?= bitrix_sessid_post();?>
	<input type="hidden" name="action" value="mode"/>
	<p><?=Loc::getMessage('LANDING_TPL_EXTENDED_MODE');?></p>
	<button type="submit" class="ui-btn ui-btn-success" data-testid="roles-mode-switch-btn" value="<?=Loc::getMessage(
		'LANDING_TPL_BUTTON_MODE_TO_ROLE'
	);?>">
		<?=Loc::getMessage('LANDING_TPL_BUTTON_MODE_TO_ROLE');?>
	</button>
</form>

<script>
	BX.ready(function(){
		new BX.Landing.AccessExtended({
			rights: <?= \CUtil::phpToJSObject($arResult['ADDITIONAL']);?>,
			messages: {
				deleteAccessCode: '<?= \CUtil::jsEscape(Loc::getMessage('LANDING_TPL_ARIA_DELETE_ACCESS_CODE'));?>',
				deleteTitle: '<?= \CUtil::jsEscape(Loc::getMessage('LANDING_TPL_ACTION_DEL'));?>'
			}
		});
	});
</script>

<?else:?>

<form action="<?= POST_FORM_ACTION_URI;?>" method="post" data-testid="roles-form">
<input type="hidden" name="action" value="save" />
<?= bitrix_sessid_post();?>
<table class="table-blue-wrapper">
	<tbody>
	<tr>
		<td>
			<table class="table-blue" id="landing-rights-table" data-testid="roles-rights-table">
				<tbody>
					<tr>
						<th scope="col" class="table-blue-td-title" data-testid="roles-col-entity">
							<span class="landing-roles-visually-hidden"><?= Loc::getMessage('LANDING_TPL_COL_ENTITY');?></span>
						</th>
						<th scope="col" class="table-blue-td-title" data-testid="roles-col-name">
							<span class="landing-roles-visually-hidden"><?= Loc::getMessage('LANDING_TPL_COL_NAME');?></span>
						</th>
						<th scope="col" class="table-blue-td-title"><?= Loc::getMessage('LANDING_TPL_COL_ROLE');?></th>
						<th scope="col" class="table-blue-td-title" data-testid="roles-col-actions">
							<span class="landing-roles-visually-hidden"><?= Loc::getMessage('LANDING_TPL_COL_ACTIONS');?></span>
						</th>
					</tr>
					<?foreach (array_values($arResult['ACCESS_CODES']) as $i => $code):
						$provider = \htmlspecialcharsbx($code['PROVIDER']);
						$entityName = \htmlspecialcharsbx($code['NAME']);
						$entity = $provider . ': ' . $entityName;
						?>
					<tr>
						<th scope="row" class="table-blue-td-name"><?= $provider;?></th>
						<td class="table-blue-td-param"><?= $entityName;?></td>
						<td class="table-blue-td-select">
							<?= $drawSelect($i, $code['ROLE_ID'], $entity);?>
							<input type="hidden" name="rights[ACCESS_CODE][<?= $i;?>]" value="<?= \htmlspecialcharsbx($code['CODE'])?>">
						</td>
						<td class="table-blue-td-action">
							<button type="button" class="table-blue-delete table-blue-delete-landing-role bitrix24-metrika" data-metrika24="permission_delete" data-id="<?= \htmlspecialcharsbx($code['CODE']);?>" onclick="deleteAccessRow(this);" title="<?= $attrPhrase('LANDING_TPL_ACTION_DEL');?>" aria-label="<?= $attrPhrase('LANDING_TPL_ARIA_DELETE_RIGHT', ['#ENTITY#' => $entity]);?>" data-testid="roles-right-delete-btn"></button>
						</td>
					</tr>
					<?endforeach;?>
					<tr>
						<td colspan="4" class="table-blue-td-link">
							<button type="button" class="table-blue-link bitrix24-metrika" data-metrika24="permission_add" id="landing-rights-form" data-testid="roles-right-add-btn">
								<?= Loc::getMessage('LANDING_TPL_ACTION_RIGHT');?>
							</button>
						</td>
					</tr>
				</tbody>
			</table>
		</td>
		<td>
			<table class="table-blue" id="landing-roles" data-testid="roles-roles-table">
				<tbody>
				<tr>
					<th colspan="2" scope="colgroup" class="table-blue-td-title">
						<?= Loc::getMessage('LANDING_TPL_COL_ROLES');?>
					</th>
				</tr>
				<?foreach ($arResult['ROLES'] as $item):
					$urlEdit = str_replace(
						'#role_edit#',
						$item['ID'],
						$arParams['PAGE_URL_ROLE_EDIT']
					);
					$roleTitle = \htmlspecialcharsbx($item['TITLE']);
					?>
				<tr data-role-id="1">
					<td class="table-blue-td-name">
						<?= $roleTitle;?>
					</td>
					<td class="table-blue-td-action">
						<input type="hidden" name="roles[]" value="<?= $item['ID'];?>" />
						<a class="table-blue-edit bitrix24-metrika" data-metrika24="role_edit" title="<?= $attrPhrase('LANDING_TPL_ACTION_EDIT');?>" aria-label="<?= $attrPhrase('LANDING_TPL_ARIA_EDIT_ROLE', ['#ROLE#' => $roleTitle]);?>" href="<?= $urlEdit;?>" data-testid="roles-role-edit-link"></a>
						<button type="button" class="table-blue-delete landing-role-delete bitrix24-metrika" data-metrika24="role_delete" title="<?= $attrPhrase('LANDING_TPL_ACTION_DEL');?>" aria-label="<?= $attrPhrase('LANDING_TPL_ARIA_DELETE_ROLE', ['#ROLE#' => $roleTitle]);?>" data-testid="roles-role-delete-btn"></button>
					</td>
				</tr>
				<?endforeach;?>
				<tr>
					<td colspan="2" class="table-blue-td-link">
						<a href="<?= str_replace('#role_edit#', 0, $arParams['PAGE_URL_ROLE_EDIT']);?>" class="table-blue-link bitrix24-metrika" data-metrika24="role_add" data-testid="roles-role-add-link">
							<?= Loc::getMessage('LANDING_TPL_ACTION_ADD');?>
						</a>
					</td>
				</tr>
				</tbody>
			</table>
		</td>
	</tr>
	</tbody>
</table>
<button type="submit" class="ui-btn ui-btn-success bitrix24-metrika" data-metrika24="rights_edit" id="landing-rights-save" name="submit" value="<?= Loc::getMessage('LANDING_TPL_ACTION_SAVE');?>" data-testid="roles-save-btn">
	<?= Loc::getMessage('LANDING_TPL_ACTION_SAVE');?>
</button>
</form>

<form action="<?= POST_FORM_ACTION_URI;?>" method="post" id="landing-mode-form" data-testid="roles-mode-form">
	<?= bitrix_sessid_post();?>
	<input type="hidden" name="action" value="mode" />
</form>

<script>
	var landingAccessSelected = <?= \CUtil::phpToJSObject(array_fill_keys($accessCodes, true));?>;
	BX.ready(function(){
		new BX.Landing.Access({
			select: '<?= \CUtil::jsEscape($drawSelect());?>',
			inc: <?= count($arResult['ACCESS_CODES']);?>,
			messages: {
				deleteRight: '<?= \CUtil::jsEscape(Loc::getMessage('LANDING_TPL_ARIA_DELETE_RIGHT'));?>',
				deleteTitle: '<?= \CUtil::jsEscape(Loc::getMessage('LANDING_TPL_ACTION_DEL'));?>'
			}
		});
	});
</script>

<?endif;?>