<?php
if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)
{
	die();
}
/**
 * @global CMain $APPLICATION
 * @var array $arParams
 * @var array $arResult
 */
?>
<?php if ($arResult['REQUIRED_BY_MANDATORY'] === true):?>
<?php $APPLICATION->IncludeComponent(
	"bitrix:security.auth.otp.mandatory",
	"",
	array(
		"AUTH_LOGIN_URL" => $arResult["~AUTH_LOGIN_URL"],
		"NOT_SHOW_LINKS" => $arParams["NOT_SHOW_LINKS"]
	)
);?>
<?php else:?>
	<?php
if (!empty($arParams["~AUTH_RESULT"]))
{
	ShowMessage($arParams["~AUTH_RESULT"]);
}
?>

<div class="bx-auth">
	<div class="bx-auth-note"><?=GetMessage("AUTH_OTP_PLEASE_AUTH")?></div>

	<form name="form_auth" method="post" target="_top" action="<?=$arResult["AUTH_URL"]?>">

		<input type="hidden" name="AUTH_FORM" value="Y" />
		<input type="hidden" name="TYPE" value="OTP" />
		<?= bitrix_sessid_post(); ?>

		<table class="bx-auth-table">
			<tr>
				<td class="bx-auth-label"><?=GetMessage("AUTH_OTP_OTP")?></td>
				<td><input class="bx-auth-input" type="text" name="USER_OTP" maxlength="50" value="" autocomplete="off" /></td>
			</tr>
<?php if($arResult["CAPTCHA_CODE"]):?>
				<tr>
					<td></td>
					<td><input type="hidden" name="captcha_sid" value="<?= $arResult["CAPTCHA_CODE"]?>" />
					<img src="/bitrix/tools/captcha.php?captcha_sid=<?= $arResult["CAPTCHA_CODE"]?>" width="180" height="40" alt="CAPTCHA" /></td>
				</tr>
				<tr>
					<td class="bx-auth-label"><?= GetMessage("AUTH_OTP_CAPTCHA_PROMT")?>:</td>
					<td><input class="bx-auth-input" type="text" name="captcha_word" maxlength="50" value="" size="15" /></td>
				</tr>
<?php endif;?>
<?php if($arResult["REMEMBER_OTP"]):?>
			<tr>
				<td></td>
				<td><input type="checkbox" id="OTP_REMEMBER" name="OTP_REMEMBER" value="Y" /><label for="OTP_REMEMBER">&nbsp;<?=GetMessage("AUTH_OTP_REMEMBER_ME")?></label></td>
			</tr>
<?php endif?>
			<tr>
				<td></td>
				<td class="authorize-submit-cell"><input type="submit" name="Otp" value="<?=GetMessage("AUTH_OTP_AUTHORIZE")?>" /></td>
			</tr>
		</table>

<?php if ($arParams["NOT_SHOW_LINKS"] != "Y"):?>
		<noindex>
			<p>
				<a href="<?=$arResult["AUTH_LOGIN_URL"]?>" rel="nofollow"><?= GetMessage("AUTH_OTP_AUTH_BACK")?></a>
			</p>
		</noindex>
<?php endif?>

	</form>
</div>

<script>
try{document.form_auth.USER_OTP.focus();}catch(e){}
</script>
<?php endif;?>