<?php
if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}
/**
 * Bitrix vars
 * @global CMain $APPLICATION
 * @global CUser $USER
 * @var array $arParams
 * @var array $arResult
 */

//one css for all system.auth.* forms
$APPLICATION->SetAdditionalCSS("/bitrix/css/main/system.auth/flat/style.css");

//here you can place your own messages
switch($arResult["MESSAGE_CODE"])
{
	case "E01":
		//When user not found
		$class = "alert-warning";
		break;
	case "E02":
		//User was successfully authorized after confirmation
		$class = "alert-success";
		break;
	case "E03":
		//User already confirm his registration
		$class = "alert-warning";
		break;
	case "E04":
		//Missed confirmation code
		$class = "alert-warning";
		break;
	case "E05":
		//Confirmation code provided does not match stored one
		$class = "alert-danger";
		break;
	case "E06":
		//Confirmation was successfull
		$class = "alert-success";
		break;
	case "E07":
		//Some error occured during confirmation
		$class = "alert-danger";
		break;
	default:
		$class = "alert-warning";
}
?>

<?php
if($arResult["MESSAGE_TEXT"] <> ''):
	$text = str_replace(array("<br>", "<br />"), "\n", $arResult["MESSAGE_TEXT"]);
?>
<div class="bx-authform">
	<div class="alert <?=$class?>"><?= nl2br(htmlspecialcharsbx($text))?></div>
</div>
<?php endif?>

<?php if($arResult["SHOW_FORM"]):?>
<div class="bx-authform">

	<form method="post" action="<?= $arResult["FORM_ACTION"]?>">
		<div class="bx-authform-formgroup-container">
			<div class="bx-authform-label-container"><?= GetMessage("CT_BSAC_LOGIN")?></div>
			<div class="bx-authform-input-container">
				<input type="text" name="<?= $arParams["LOGIN"]?>" maxlength="50" value="<?= $arResult["LOGIN"]?>" />
			</div>
		</div>

		<div class="bx-authform-formgroup-container">
			<div class="bx-authform-label-container"><?= GetMessage("CT_BSAC_CONFIRM_CODE")?></div>
			<div class="bx-authform-input-container">
				<input type="text" name="<?= $arParams["CONFIRM_CODE"]?>" maxlength="50" value="<?= $arResult["CONFIRM_CODE"]?>" />
			</div>
		</div>

		<div class="bx-authform-formgroup-container">
			<input type="submit" class="btn btn-primary" value="<?= GetMessage("CT_BSAC_CONFIRM")?>" />
		</div>
		<input type="hidden" name="<?= $arParams["USER_ID"]?>" value="<?= $arResult["USER_ID"]?>" />
	</form>
</div>
<?php elseif(!$USER->IsAuthorized()):?>
	<?php $APPLICATION->IncludeComponent("bitrix:system.auth.authorize", "flat", array());?>
<?php endif?>