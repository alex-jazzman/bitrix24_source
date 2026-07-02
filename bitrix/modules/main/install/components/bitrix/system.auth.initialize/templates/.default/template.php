<?php
if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)die();

/**
 * @global CUser $USER
 * @var array $arResult
 * @var array $arParams
 */
?>

<p><?php
ShowMessage($arResult["MESSAGE_TEXT"])
?></p>
<?php if($arResult["SHOW_FORM"]):?>
	<form method="post" action="<?= $arResult["FORM_ACTION"]?>" enctype="multipart/form-data">
	<?=bitrix_sessid_post()?>
		<table class="data-table bx-confirm-table">
			<tr>
				<td>
					<span class="starrequired">*</span><?= GetMessage("CT_MAIN_REG_INIT_NAME_TITLE")?>:
				</td>
				<td>
					<input type="text" name="NAME" maxlength="50" value="<?= $arResult["USER"]["NAME"]?>" size="17" />
				</td>
			</tr>
			<tr>
				<td>
					<span class="starrequired">*</span><?= GetMessage("CT_MAIN_REG_INIT_LAST_NAME_TITLE")?>:
				</td>
				<td>
					<input type="text" name="LAST_NAME" maxlength="50" value="<?= $arResult["USER"]["LAST_NAME"]?>" size="17" />
				</td>
			</tr>
			<tr>
				<td>
					<?= GetMessage("CT_MAIN_REG_INIT_WORK_COMPANY_TITLE")?>:
				</td>
				<td>
					<input type="text" name="WORK_COMPANY" maxlength="50" value="<?= $arResult["USER"]["WORK_COMPANY"]?>" size="17" />
				</td>
			</tr>
			<tr>
				<td>
					<?= GetMessage("CT_MAIN_REG_INIT_WORK_PHONE_TITLE")?>:
				</td>
				<td>
					<input type="text" name="WORK_PHONE" maxlength="50" value="<?= $arResult["USER"]["WORK_PHONE"]?>" size="17" />
				</td>
			</tr>
			<tr>
				<td>
					<?= GetMessage("CT_MAIN_REG_INIT_PERSONAL_PHOTO_TITLE")?>:
				</td>
				<td>
					<input type="file" name="PERSONAL_PHOTO" size="10">
				</td>
			</tr>
			<tr>
				<td colspan="2"><hr></td>
			</tr>
			<tr>
				<td>
					<?= GetMessage("CT_MAIN_REG_INIT_LOGIN_TITLE")?>:
				</td>
				<td>
					<?= $arResult["USER"]["LOGIN"]?>
				</td>
			</tr>
			<tr>
				<td>
					<div style="display: none;"><input type="text" name="LOGIN_PSEUDO" value="<?= $arResult["USER"]["LOGIN"]?>" size="1" readonly /></div>
					<span class="starrequired">*</span><?= GetMessage("CT_MAIN_REG_INIT_PASSWORD_TITLE")?>:
				</td>
				<td>
					<input type="password" name="PASSWORD" maxlength="50" value="<?= $arResult["PASSWORD"]?>" size="12" />
				</td>
			</tr>
			<tr>
				<td>
					<span class="starrequired">*</span><?= GetMessage("CT_MAIN_REG_INIT_CONFIRM_PASSWORD_TITLE")?>:
				</td>
				<td>
					<input type="password" name="CONFIRM_PASSWORD" maxlength="50" value="<?= $arResult["CONFIRM_PASSWORD"]?>" size="12" />
				</td>
			</tr>
			<?php
			if (trim($arResult["CHECKWORD"]) == '')
			{
				?>
				<tr>
					<td>
						<span class="starrequired">*</span><?= GetMessage("CT_MAIN_REG_INIT_CHECKWORD_TITLE")?>:
					</td>
					<td>
						<input type="text" name="CHECKWORD" maxlength="50" value="<?= $arResult["CHECKWORD"]?>" size="17" />
					</td>
				</tr>
				<?php
			}
			else
			{
				?><input type="hidden" name="CHECKWORD" value="<?= $arResult["CHECKWORD"]?>" /><?php
			}
			?>
			<?php
			if (isset($_REQUEST["USER_REMEMBER"]) && $_REQUEST["USER_REMEMBER"] == "Y")
				$checked = " checked";
			else
				$checked = "";
			?>
			<tr>
				<td colspan="2"><input type="checkbox" id="USER_REMEMBER" name="USER_REMEMBER" value="Y"<?=$checked?>/><label for="USER_REMEMBER">&nbsp;<?=GetMessage("CT_MAIN_REG_INIT_REMEMBER_TITLE")?></label></td>
			</tr>

			<tr>
				<td colspan="2"><hr></td>
			</tr>
			<tr>
				<td colspan="2"><span class="starrequired">*</span><?=GetMessage("CT_MAIN_REG_INIT_REQUIRED_COMMENT")?></td>
			</tr>
			<tr>
				<td colspan="2"><?=GetMessage("CT_MAIN_REG_INIT_FUTURE_COMMENT")?></td>
			</tr>
			<tr>
				<td colspan="2"><input type="submit" name="confirm" value="<?= GetMessage("CT_MAIN_REG_INIT_CONFIRM")?>" /></td>
			</tr>
		</table>
		<input type="hidden" name="<?= $arParams["USER_ID"]?>" value="<?= $arResult["USER_ID"]?>" />
	</form>
<?php elseif(!$USER->IsAuthorized()):
	echo str_replace("#LINK#", $arParams["AUTH_URL"], GetMessage("CT_MAIN_REG_INIT_AUTH_LINK")).". ";
endif?>