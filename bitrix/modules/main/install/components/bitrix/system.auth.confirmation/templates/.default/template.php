<?php
if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)die();

/**
 * @global CUser $USER
 * @global CMain $APPLICATION
 * @var array $arResult
 * @var array $arParams
 */
?>

<p><?= $arResult["MESSAGE_TEXT"]?></p>
<?php
//here you can place your own messages
	switch($arResult["MESSAGE_CODE"])
	{
	case "E01":
		?><?php
		//When user not found
		break;
	case "E02":
		?><?php
		//User was successfully authorized after confirmation
		break;
	case "E03":
		?><?php
		//User already confirm his registration
		break;
	case "E04":
		?><?php
		//Missed confirmation code
		break;
	case "E05":
		?><?php
		//Confirmation code provided does not match stored one
		break;
	case "E06":
		?><?php
		//Confirmation was successfull
		break;
	case "E07":
		?><?php
		//Some error occured during confirmation
		break;
	}
?>
<?php if($arResult["SHOW_FORM"]):?>
	<form method="post" action="<?= $arResult["FORM_ACTION"]?>">
		<table class="data-table bx-confirm-table">
			<tr>
				<td>
					<?= GetMessage("CT_BSAC_LOGIN")?>:
				</td>
				<td>
					<input type="text" name="<?= $arParams["LOGIN"]?>" maxlength="50" value="<?= $arResult["LOGIN"]?>" size="17" />
				</td>
			</tr>
			<tr>
				<td>
					<?= GetMessage("CT_BSAC_CONFIRM_CODE")?>:
				</td>
				<td>
					<input type="text" name="<?= $arParams["CONFIRM_CODE"]?>" maxlength="50" value="<?= $arResult["CONFIRM_CODE"]?>" size="17" />
				</td>
			</tr>
			<tr>
				<td colspan="2"><input type="submit" value="<?= GetMessage("CT_BSAC_CONFIRM")?>" /></td>
			</tr>
		</table>
		<input type="hidden" name="<?= $arParams["USER_ID"]?>" value="<?= $arResult["USER_ID"]?>" />
	</form>
<?php elseif(!$USER->IsAuthorized()):?>
	<?php $APPLICATION->IncludeComponent("bitrix:system.auth.authorize", "", array());?>
<?php endif?>