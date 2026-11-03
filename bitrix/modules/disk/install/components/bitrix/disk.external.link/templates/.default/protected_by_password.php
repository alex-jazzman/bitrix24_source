<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) die();
/** @var array $arParams */
/** @var array $arResult */
/** @var CBitrixComponentTemplate $this */
/** @var string $templateFolder */
/** @var CDiskExternalLinkComponent $component */

use Bitrix\Main\UI\Extension;
use Bitrix\UI\Buttons\AirButtonStyle;
use Bitrix\UI\Buttons\Button;

// Password field is mounted client-side (BX.UI.System.Input.PasswordInput).
Extension::load(['ui.system.input']);

include $_SERVER['DOCUMENT_ROOT'] . '/bitrix/components/bitrix/disk.external.link/templates/.default/access-page.php';
/** @var callable $applyAirStyle */
include $_SERVER['DOCUMENT_ROOT'] . '/bitrix/components/bitrix/disk.external.link/templates/.default/access-button.php';

$illustration = $templateFolder . '/images/access-laptop.png';
$mode = 'password';
$titleTag = 'h1';
$cardTestId = 'disk-ext-password-card';
$title = $component->getMessage('DISK_EXT_LINK_PASSWORD_TITLE');
$description = $component->getMessage('DISK_EXT_LINK_PASSWORD_DESCR');
$passwordProtection = is_array($arResult['PASSWORD_PROTECTION'] ?? null) ? $arResult['PASSWORD_PROTECTION'] : [];
$captchaRequired = (bool)($passwordProtection['CAPTCHA_REQUIRED'] ?? false);
$captchaSid = is_string($passwordProtection['CAPTCHA_SID'] ?? null) ? $passwordProtection['CAPTCHA_SID'] : '';
$captchaImageSrc = $captchaSid !== ''
	? '/bitrix/tools/captcha.php?captcha_sid=' . rawurlencode($captchaSid)
	: '';
$captchaBlockClass = 'disk-access-card__captcha' . ($captchaRequired ? '' : ' --hidden');
$passwordProtectionError = (string)($passwordProtection['ERROR'] ?? '');
$passwordProtectionErrorMessage = match ($passwordProtectionError)
{
	'wrong_password' => $component->getMessage('DISK_EXT_LINK_PASSWORD_WRONG'),
	'captcha_required' => $component->getMessage('DISK_EXT_LINK_CAPTCHA_REQUIRED'),
	'captcha_invalid' => $component->getMessage('DISK_EXT_LINK_CAPTCHA_INVALID'),
	'request_error' => $component->getMessage('DISK_EXT_LINK_PASSWORD_ERROR'),
	default => '',
};

$submitButton = new Button([
	'text' => $component->getMessage('DISK_EXT_LINK_PASSWORD_SUBMIT'),
]);
$applyAirStyle($submitButton, AirButtonStyle::FILLED);
$submitButton
	// Buttons\Size has no constant for the XL step of the air design (46px in the mockup).
	->addClass('ui-btn-xl')
	->addClass('--wide')
	->addAttribute('id', 'disk-access-password-submit')
	->addAttribute('type', 'submit')
	->addAttribute('data-testid', 'disk-ext-password-submit-btn')
;

$nativePasswordInputHtml =
	'<noscript>'
	. '<input class="disk-access-card__captcha-input"'
	. ' type="password"'
	. ' name="PASSWORD"'
	. ' autocomplete="current-password"'
	. ' placeholder="' . htmlspecialcharsbx($component->getMessage('DISK_EXT_LINK_PASSWORD_PLACEHOLDER')) . '"'
	. ' aria-label="' . htmlspecialcharsbx($component->getMessage('DISK_EXT_LINK_PASSWORD_ARIA_LABEL')) . '"'
	. ' data-testid="disk-ext-password-native-input">'
	. '</noscript>'
;

$slotHtml
	= '<form method="post" id="disk-access-password-form" class="disk-access-card__form" data-testid="disk-ext-password-form">'
	. bitrix_sessid_post()
	. '<input type="hidden" id="disk-access-password-value" value="">'
	. '<input type="hidden" name="CAPTCHA_SID" id="disk-access-captcha-sid" value="' . htmlspecialcharsbx($captchaSid) . '">'
	. ($passwordProtectionErrorMessage === ''
		? ''
		: '<div class="disk-access-card__captcha-error" role="alert" aria-live="assertive" data-testid="disk-ext-password-error">'
			. htmlspecialcharsbx($passwordProtectionErrorMessage)
			. '</div>')
	. '<div class="disk-access-card__field" id="disk-access-password-field" data-testid="disk-ext-password-field"></div>'
	. $nativePasswordInputHtml
	. '<div class="' . $captchaBlockClass . '" id="disk-access-captcha" data-testid="disk-ext-captcha-block" aria-hidden="' . ($captchaRequired ? 'false' : 'true') . '">'
	. '<label class="disk-access-card__captcha-label" for="disk-access-captcha-word">'
	. htmlspecialcharsbx($component->getMessage('DISK_EXT_LINK_CAPTCHA_LABEL'))
	. '</label>'
	. '<img class="disk-access-card__captcha-image" id="disk-access-captcha-image" data-testid="disk-ext-captcha-image" src="' . htmlspecialcharsbx($captchaImageSrc) . '" alt="' . htmlspecialcharsbx($component->getMessage('DISK_EXT_LINK_CAPTCHA_IMAGE_ALT')) . '">'
	. '<input class="disk-access-card__captcha-input" type="text" name="CAPTCHA_WORD" id="disk-access-captcha-word" value="" autocomplete="off" placeholder="' . htmlspecialcharsbx($component->getMessage('DISK_EXT_LINK_CAPTCHA_PLACEHOLDER')) . '" aria-label="' . htmlspecialcharsbx($component->getMessage('DISK_EXT_LINK_CAPTCHA_ARIA_LABEL')) . '" data-testid="disk-ext-captcha-input">'
	. '<div class="disk-access-card__captcha-error" id="disk-access-captcha-error" role="alert" aria-live="assertive" data-testid="disk-ext-captcha-error"></div>'
	. '</div>'
	. '<div id="disk-access-password-alert" data-testid="disk-ext-password-alert" role="alert" aria-live="assertive" class="disk-access-card__sr-only" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;"></div>'
	. $submitButton->render(false)
	. '</form>';

?>
<main class="<?= $cardLayoutClass ?>" data-testid="disk-ext-password-page">
	<?php include $_SERVER['DOCUMENT_ROOT'] . '/bitrix/components/bitrix/disk.external.link/templates/.default/access-card.php'; ?>
</main>
<script>
BX.ready(function() {
	var form = document.getElementById('disk-access-password-form');
	var container = document.getElementById('disk-access-password-field');
	var submitButton = document.getElementById('disk-access-password-submit');
	var passwordValue = document.getElementById('disk-access-password-value');
	var captchaBlock = document.getElementById('disk-access-captcha');
	var captchaImage = document.getElementById('disk-access-captcha-image');
	var captchaSidField = document.getElementById('disk-access-captcha-sid');
	var captchaInput = document.getElementById('disk-access-captcha-word');
	var captchaError = document.getElementById('disk-access-captcha-error');
	var alertRegion = document.getElementById('disk-access-password-alert');
	if (!form || !container || !submitButton || !passwordValue)
	{
		return;
	}

	var hash = '<?= CUtil::JSEscape($arResult['HASH']) ?>';
	var captchaSid = '<?= CUtil::JSEscape($captchaSid) ?>';
	var captchaVisible = <?= $captchaRequired ? 'true' : 'false' ?>;
	var placeholder = '<?= CUtil::JSEscape($component->getMessage('DISK_EXT_LINK_PASSWORD_PLACEHOLDER')) ?>';
	var ariaLabel = '<?= CUtil::JSEscape($component->getMessage('DISK_EXT_LINK_PASSWORD_ARIA_LABEL')) ?>';
	var wrongPasswordText = '<?= CUtil::JSEscape($component->getMessage('DISK_EXT_LINK_PASSWORD_WRONG')) ?>';
	var requestErrorText = '<?= CUtil::JSEscape($component->getMessage('DISK_EXT_LINK_PASSWORD_ERROR')) ?>';
	var captchaRequiredText = '<?= CUtil::JSEscape($component->getMessage('DISK_EXT_LINK_CAPTCHA_REQUIRED')) ?>';
	var captchaInvalidText = '<?= CUtil::JSEscape($component->getMessage('DISK_EXT_LINK_CAPTCHA_INVALID')) ?>';
	var disabledClass = 'ui-btn-disabled';
	var hiddenClass = '--hidden';

	var setSubmitEnabled = function(enabled) {
		submitButton.disabled = !enabled;
		submitButton.classList.toggle(disabledClass, !enabled);
	};

	var getCaptchaSrc = function(sid) {
		return '/bitrix/tools/captcha.php?captcha_sid=' + encodeURIComponent(sid);
	};

	BX.loadExt('ui.system.input').then(function() {
		var clearAlert = function() {
			if (alertRegion)
			{
				alertRegion.textContent = '';
			}
		};

		var clearCaptchaError = function() {
			if (captchaError)
			{
				captchaError.textContent = '';
			}
		};

		var updateSubmitState = function() {
			var hasPassword = field.getValue() !== '';
			var hasCaptcha = !captchaVisible || (captchaInput && captchaInput.value !== '');

			setSubmitEnabled(!checking && hasPassword && hasCaptcha);
		};

		var setCaptcha = function(sid) {
			captchaSid = sid || '';

			if (captchaSidField)
			{
				captchaSidField.value = captchaSid;
			}

			if (captchaImage && captchaSid !== '')
			{
				captchaImage.src = getCaptchaSrc(captchaSid);
			}
		};

		var setCaptchaVisible = function(visible) {
			captchaVisible = visible;

			if (captchaBlock)
			{
				captchaBlock.classList.toggle(hiddenClass, !visible);
				captchaBlock.setAttribute('aria-hidden', visible ? 'false' : 'true');
			}

			if (!visible)
			{
				clearCaptchaError();
			}

			updateSubmitState();
		};

		var showCaptchaError = function(text) {
			checking = false;
			setCaptchaVisible(true);

			if (captchaInput)
			{
				captchaInput.value = '';
			}

			if (captchaError)
			{
				captchaError.textContent = text;
			}

			if (alertRegion)
			{
				alertRegion.textContent = text;
			}

			updateSubmitState();
		};

		var field = new BX.UI.System.Input.PasswordInput({
			placeholder: placeholder,
			ariaLabel: ariaLabel,
			dataTestId: 'disk-ext-password-input',
			stretched: true,
			onInput: function() {
				field.setError('');
				clearAlert();
				updateSubmitState();
			},
		});

		container.appendChild(field.render());
		setCaptcha(captchaSid);
		updateSubmitState();

		var checking = false;
		var submit = function() {
			var password = field.getValue();
			if (
				checking
				|| password === ''
				|| (captchaVisible && (!captchaInput || captchaInput.value === ''))
			)
			{
				return;
			}

			passwordValue.value = password;

			checking = true;
			setSubmitEnabled(false);

			var showWrong = function() {
				checking = false;
				field.setError(wrongPasswordText);
				clearCaptchaError();
				if (captchaVisible && captchaInput)
				{
					captchaInput.value = '';
				}
				if (alertRegion)
				{
					alertRegion.textContent = wrongPasswordText;
				}
				updateSubmitState();
			};

			var showRequestError = function() {
				checking = false;
				field.setError(requestErrorText);
				if (alertRegion)
				{
					alertRegion.textContent = requestErrorText;
				}
				updateSubmitState();
			};

			BX.ajax.runComponentAction('bitrix:disk.external.link', 'checkPassword', {
				mode: 'ajax',
				data: {
					hash: hash,
					password: password,
					captchaSid: captchaSid,
					captchaWord: captchaInput ? captchaInput.value : '',
				},
			}).then(function(response) {
				if (response.data && response.data.status === 'success')
				{
					clearAlert();
					window.location.reload();

					return;
				}

				if (response.data)
				{
					setCaptcha(response.data.captchaSid || '');

					if (response.data.captchaRequired === true)
					{
						setCaptchaVisible(true);
					}
				}

				if (
					response.data
					&& (response.data.status === 'wrong' || response.data.status === 'wrong_password')
				)
				{
					showWrong();

					return;
				}

				if (response.data && response.data.status === 'captcha_required')
				{
					showCaptchaError(captchaRequiredText);

					return;
				}

				if (response.data && response.data.status === 'captcha_invalid')
				{
					showCaptchaError(captchaInvalidText);

					return;
				}

				showRequestError();
			}).catch(showRequestError);
		};

		BX.bind(form, 'submit', function(event) {
			event.preventDefault();
			submit();
		});
		BX.bind(submitButton, 'click', submit);
		BX.bind(container, 'keydown', function(event) {
			if (event.key === 'Enter' && !submitButton.disabled)
			{
				event.preventDefault();
				submit();
			}
		});
		if (captchaInput)
		{
			BX.bind(captchaInput, 'input', function() {
				clearCaptchaError();
				clearAlert();
				updateSubmitState();
			});
			BX.bind(captchaInput, 'keydown', function(event) {
				if (event.key === 'Enter' && !submitButton.disabled)
				{
					event.preventDefault();
					submit();
				}
			});
		}
	});
});
</script>
