<?
/**
 * @var array $arResult
 * @var CMain $APPLICATION
 * @var string $componentPath
 */
if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

\Bitrix\Main\UI\Extension::load([
	'ui.design-tokens',
	'voximplant.common',
	'voximplant.permissions-selector',
	'sidepanel',
]);

\Bitrix\Main\Page\Asset::getInstance()->addCss('/bitrix/css/main/table/style.css');
?>

<div id="vi-permissions-edit" data-testid="vox-perms-root">
<form method="POST" data-testid="vox-perms-form">
	<input type="hidden" id="act" value="save" name="act">
	<?echo bitrix_sessid_post()?>
	<table class="table-blue-wrapper">
		<tr>
			<td>
				<table class="table-blue bx-vi-js-role-access-table" data-testid="vox-perms-access-table">
					<tr>
						<td class="table-blue-td-title">&nbsp;</td>
						<td class="table-blue-td-title">&nbsp;</td>
						<td class="table-blue-td-title"><?=GetMessage('VOXIMPLANT_PERM_ROLE')?></td>
						<td class="table-blue-td-title"></td>
					</tr>
					<?foreach ($arResult['ROLE_ACCESS_CODES'] as $roleAccessCode):?>
						<tr data-access-code="<?=htmlspecialcharsbx($roleAccessCode['ACCESS_CODE'])?>" data-role-id="<?=htmlspecialcharsbx($roleAccessCode['ROLE_ID'])?>" data-testid="vox-perms-access-row-<?=htmlspecialcharsbx($roleAccessCode['ACCESS_CODE'])?>">
							<td class="table-blue-td-name" data-testid="vox-perms-access-provider"><?=htmlspecialcharsbx($roleAccessCode['ACCESS_PROVIDER'])?></td>
							<td class="table-blue-td-param" data-testid="vox-perms-access-name"><?=htmlspecialcharsbx($roleAccessCode['ACCESS_NAME'])?></td>
							<td class="table-blue-td-select">
									<select class="bx-vi-js-select-role table-blue-select" name="PERMS[<?=htmlspecialcharsbx($roleAccessCode['ACCESS_CODE'])?>]" data-access-code="<?=htmlspecialcharsbx($roleAccessCode['ACCESS_CODE'])?>" data-testid="vox-perms-access-role">
										<?foreach ($arResult['ROLES'] as $role):?>
											<option title="<?=htmlspecialcharsbx($role['NAME'])?>" value="<?=htmlspecialcharsbx($role['ID'])?>" <?=($role['ID'] == $roleAccessCode['ROLE_ID'] ? 'selected' : '')?>>
												<?=htmlspecialcharsbx($role['NAME'])?>
											</option>
										<?endforeach;?>
									</select>
							</td>
							<td class="table-blue-td-action">
								<span class="bx-vi-js-delete-access table-blue-delete" data-access-code="<?=htmlspecialcharsbx($roleAccessCode['ACCESS_CODE'])?>" data-testid="vox-perms-access-delete"></span>
							</td>
						</tr>
					<?endforeach;?>
					<tr class="bx-vi-js-access-table-last-row">
						<td colspan="4" class="table-blue-td-link">
								<a class="bx-vi-js-add-access table-blue-link" href="javascript:void(0);" data-testid="vox-perms-add-access"><?=GetMessage('VOXIMPLANT_PERM_ADD_ACCESS_CODE')?></a>
						</td>
					</tr>
				</table>
			</td>
			<td>
				<table class="table-blue" data-testid="vox-perms-role-list">
					<tr>
						<td colspan="2" class="table-blue-td-title"><?=GetMessage('VOXIMPLANT_PERM_ROLE_LIST')?>:</td>
					</tr>
					<?foreach ($arResult['ROLES'] as $role):?>
						<tr data-role-id="<?=htmlspecialcharsbx($role['ID'])?>" data-testid="vox-perms-role-<?=htmlspecialcharsbx($role['ID'])?>">
							<td class="table-blue-td-name">
								<?=htmlspecialcharsbx($role['NAME'])?>
							</td>
							<td class="table-blue-td-action">
								<a class="table-blue-edit" data-testid="vox-perms-role-edit" title="<?=GetMessage('VOXIMPLANT_PERM_EDIT')?>" href="<?=$role['EDIT_URL']?>" onclick="BX.SidePanel.Instance.open('<?=$role['EDIT_URL']?>', {cacheable: false}); return false;"></a>
								<?if($arResult['CAN_EDIT']):?>
									<span class="table-blue-delete bx-vi-js-delete-role" title="<?=GetMessage('VOXIMPLANT_PERM_DELETE')?>" data-role-id="<?=htmlspecialcharsbx($role['ID'])?>" data-testid="vox-perms-role-delete"></span>
								<?endif?>
							</td>
						</tr>
					<?endforeach;?>
					<tr>
						<td colspan="2" class="table-blue-td-link">
							<a href="<?=$arResult['ADD_URL']?>" class="table-blue-link" data-testid="vox-perms-role-add" onclick="BX.SidePanel.Instance.open('<?=$arResult['ADD_URL']?>', {cacheable: false}); return false;">
								<?=GetMessage('VOXIMPLANT_PERM_ADD')?>
							</a>
						</td>
					</tr>
				</table>
			</td>
		</tr>
	</table>
	<?

	$buttons = [];

	if($arResult['CAN_EDIT'])
	{
		$buttons[] = 'save';
	}
	$buttons['cancel'] = [
		'TYPE' => 'cancel',
		'ONCLICK' => 'BX.SidePanel.Instance.close()',
	];

	$APPLICATION->IncludeComponent(
		'bitrix:ui.button.panel',
		'',
		['BUTTONS' => $buttons],
		false
	); ?>

</form>
</div>
<script>
	BX.ready(function()
	{
		new BX.Voximplant.PermissionsSelector({
			container: BX('vi-permissions-edit'),
			ajaxUrl: '<?=CUtil::JSEscape($componentPath.'/ajax.php')?>',
			sessid: '<?=CUtil::JSEscape(bitrix_sessid())?>',
			providerNames: <?=CUtil::PhpToJSObject($arResult['ACCESS_PROVIDER_NAMES'])?>,
			useStructureRoles: <?=($arResult['HAS_STRUCTURE_ROLES'] ? 'true' : 'false')?>,
		});
	});
</script>

<script type="text/template" id="bx-vi-new-access-row">
	<td class="table-blue-td-name" data-testid="vox-perms-access-provider">#PROVIDER#</td>
	<td class="table-blue-td-param" data-testid="vox-perms-access-name">#NAME#</td>
	<td class="table-blue-td-select">
		<select class="bx-vi-js-select-role table-blue-select" name="PERMS[#ACCESS_CODE#]" data-access-code="#ACCESS_CODE#" data-testid="vox-perms-access-role">
			<?foreach ($arResult['ROLES'] as $role):?>
				<option title="<?=htmlspecialcharsbx($role['NAME'])?>" value="<?=htmlspecialcharsbx($role['ID'])?>">
					<?=htmlspecialcharsbx($role['NAME'])?>
				</option>
			<?endforeach;?>
		</select>
	</td>
	<td class="table-blue-td-action">
		<span class="bx-vi-js-delete-access table-blue-delete" data-access-code="#ACCESS_CODE#" data-testid="vox-perms-access-delete"></span>
	</td>
</script>

<script>
	BX.message({
		VOXIMPLANT_PERM_ERROR: '<?=GetMessageJS('VOXIMPLANT_PERM_ERROR')?>',
		VOXIMPLANT_PERM_ROLE_DELETE_ERROR: '<?=GetMessageJS('VOXIMPLANT_PERM_ROLE_DELETE_ERROR')?>',
		VOXIMPLANT_PERM_ROLE_DELETE: '<?=GetMessageJS('VOXIMPLANT_PERM_ROLE_DELETE')?>',
		VOXIMPLANT_PERM_ROLE_DELETE_CONFIRM: '<?=GetMessageJS('VOXIMPLANT_PERM_ROLE_DELETE_CONFIRM')?>',
		VOXIMPLANT_PERM_ROLE_OK: '<?=GetMessageJS('VOXIMPLANT_PERM_ROLE_OK')?>',
		VOXIMPLANT_PERM_ROLE_CANCEL: '<?=GetMessageJS('VOXIMPLANT_PERM_ROLE_CANCEL')?>'
	});
</script>

<?
if(!$arResult['CAN_EDIT'])
{
	$APPLICATION->IncludeComponent("bitrix:ui.info.helper", "", array());
	?>
	<script>
		BX.ready(function()
		{
			BX.UI.InfoHelper.show('limit_contact_center_telephony_access_permissions');
		});
	</script>
	<?
}

