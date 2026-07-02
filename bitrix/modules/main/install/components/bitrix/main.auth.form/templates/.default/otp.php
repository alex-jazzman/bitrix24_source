<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED!==true)
{
	die();
}

/**
 * @global CMain $APPLICATION
 * @var array $arResult
 */

use Bitrix\Main\Localization\Loc;

Loc::loadMessages(__FILE__);

// otp is always
if ($arResult['OTP_REQUIRED_BY_MANDATORY'])
{
	$APPLICATION->IncludeComponent(
		'bitrix:security.auth.otp.mandatory',
		'',
		array(
			'AUTH_LOGIN_URL' => $arResult['AUTH_LOGIN_URL']
		)
	);
	return;
}

\Bitrix\Main\Page\Asset::getInstance()->addCss(
	'/bitrix/css/main/system.auth/flat/style.css'
);

$fields = $arResult['FIELDS'];
?>

<div class="bx-authform">
	<?php if ($arResult['ERRORS']):?>
		<div class="alert alert-danger">
			<?php foreach ($arResult['ERRORS'] as $error)
			{
				echo $error;
			}
			?>
		</div>
	<?php elseif ($arResult['SUCCESS']):?>
		<div class="alert alert-success">
			<?= $arResult['SUCCESS'];?>
		</div>
	<?php endif;?>

	<h3 class="bx-title"><?= Loc::getMessage('MAIN_AUTH_OTP_HEADER');?></h3>

	<form name="bform" method="post" target="_top" action="<?= POST_FORM_ACTION_URI;?>">

		<div class="bx-authform-formgroup-container">
			<div class="bx-authform-label-container"><?= Loc::getMessage('MAIN_AUTH_OTP_FIELD_OTP');?></div>
			<div class="bx-authform-input-container">
				<input class="bx-auth-input" type="text" name="<?= $fields['otp'];?>" maxlength="50" value="" autocomplete="off" />
			</div>
		</div>

		<?php if ($arResult['CAPTCHA_CODE']):?>
			<input type="hidden" name="captcha_sid" value="<?= \htmlspecialcharsbx($arResult['CAPTCHA_CODE']);?>" />
			<div class="bx-authform-formgroup-container dbg_captha">
				<div class="bx-authform-label-container">
					<?= Loc::getMessage('MAIN_AUTH_OTP_FIELD_CAPTCHA');?>
				</div>
				<div class="bx-captcha"><img src="/bitrix/tools/captcha.php?captcha_sid=<?= \htmlspecialcharsbx($arResult['CAPTCHA_CODE']);?>" width="180" height="40" alt="CAPTCHA" /></div>
				<div class="bx-authform-input-container">
					<input type="text" name="captcha_word" maxlength="50" value="" autocomplete="off" />
				</div>
			</div>
		<?php endif;?>

		<?php if ($arResult['REMEMBER_OTP']):?>
			<div class="bx-authform-formgroup-container">
				<div class="checkbox">
					<label class="bx-filter-param-label">
						<input type="checkbox" name="<?= $fields['otp_remember'];?>" value="Y" />
						<span class="bx-filter-param-text"><?= Loc::getMessage('MAIN_AUTH_OTP_FIELD_REMEMBER');?></span>
					</label>
				</div>
			</div>
		<?php endif?>

		<div class="bx-authform-formgroup-container">
			<input type="submit" class="btn btn-primary" name="<?= $fields['action'];?>" value="<?= Loc::getMessage('MAIN_AUTH_OTP_FIELD_SUBMIT');?>" />
		</div>

		<?php if ($arResult['AUTH_AUTH_URL'] || $arResult['AUTH_REGISTER_URL']):?>
			<hr class="bxe-light">
			<noindex>
				<?php if ($arResult['AUTH_AUTH_URL']):?>
					<div class="bx-authform-link-container">
						<a href="<?= $arResult['AUTH_AUTH_URL'];?>" rel="nofollow">
							<?= Loc::getMessage('MAIN_AUTH_OTP_URL_AUTH_URL');?>
						</a>
					</div>
				<?php endif;?>
				<?php if ($arResult['AUTH_REGISTER_URL']):?>
					<div class="bx-authform-link-container">
						<a href="<?= $arResult['AUTH_REGISTER_URL'];?>" rel="nofollow">
							<?= Loc::getMessage('MAIN_AUTH_OTP_URL_REGISTER_URL');?>
						</a>
					</div>
				<?php endif;?>
			</noindex>
		<?php endif;?>

	</form>
</div>

<script>
	try{document.bform.<?= $fields['otp'];?>.focus();}catch(e){}
</script>