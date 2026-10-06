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
$title = $component->getMessage('DISK_EXT_LINK_PASSWORD_TITLE');
$description = $component->getMessage('DISK_EXT_LINK_PASSWORD_DESCR');

$submitButton = new Button([
	'text' => $component->getMessage('DISK_EXT_LINK_PASSWORD_SUBMIT'),
]);
$applyAirStyle($submitButton, AirButtonStyle::FILLED);
$submitButton
	// Buttons\Size has no constant for the XL step of the air design (46px in the mockup).
	->addClass('ui-btn-xl')
	->addClass('--wide')
	->addAttribute('id', 'disk-access-password-submit')
	->setDisabled(true)
	->addAttribute('data-testid', 'disk-ext-password-submit-btn')
;

$slotHtml =
	'<div class="disk-access-card__field" id="disk-access-password-field" data-testid="disk-ext-password-field"></div>'
	. '<div id="disk-access-password-alert" role="alert" aria-live="assertive" class="disk-access-card__sr-only" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;"></div>'
	. $submitButton->render(false)
;

?>
<div class="<?= $cardLayoutClass ?>">
	<?php include $_SERVER['DOCUMENT_ROOT'] . '/bitrix/components/bitrix/disk.external.link/templates/.default/access-card.php'; ?>
</div>
<script>
BX.ready(function() {
	var container = document.getElementById('disk-access-password-field');
	var submitButton = document.getElementById('disk-access-password-submit');
	var alertRegion = document.getElementById('disk-access-password-alert');
	if (!container || !submitButton)
	{
		return;
	}

	var hash = '<?= CUtil::JSEscape($arResult['HASH']) ?>';
	var placeholder = '<?= CUtil::JSEscape($component->getMessage('DISK_EXT_LINK_PASSWORD_PLACEHOLDER')) ?>';
	var ariaLabel = '<?= CUtil::JSEscape($component->getMessage('DISK_EXT_LINK_PASSWORD_ARIA_LABEL')) ?>';
	var wrongPasswordText = '<?= CUtil::JSEscape($component->getMessage('DISK_EXT_LINK_PASSWORD_WRONG')) ?>';
	var requestErrorText = '<?= CUtil::JSEscape($component->getMessage('DISK_EXT_LINK_PASSWORD_ERROR')) ?>';
	var disabledClass = 'ui-btn-disabled';

	var setSubmitEnabled = function(enabled) {
		submitButton.disabled = !enabled;
		submitButton.classList.toggle(disabledClass, !enabled);
	};

	BX.loadExt('ui.system.input').then(function() {
		var clearAlert = function() {
			if (alertRegion)
			{
				alertRegion.textContent = '';
			}
		};

		var field = new BX.UI.System.Input.PasswordInput({
			placeholder: placeholder,
			ariaLabel: ariaLabel,
			dataTestId: 'disk-ext-password-input',
			stretched: true,
			onInput: function() {
				field.setError('');
				clearAlert();
				setSubmitEnabled(field.getValue() !== '');
			},
		});

		container.appendChild(field.render());
		setSubmitEnabled(false);

		var checking = false;
		var submit = function() {
			var password = field.getValue();
			if (checking || password === '')
			{
				return;
			}

			checking = true;
			setSubmitEnabled(false);

			var showWrong = function() {
				checking = false;
				field.setError(wrongPasswordText);
				if (alertRegion)
				{
					alertRegion.textContent = wrongPasswordText;
				}
				setSubmitEnabled(field.getValue() !== '');
			};

			var showRequestError = function() {
				checking = false;
				field.setError(requestErrorText);
				if (alertRegion)
				{
					alertRegion.textContent = requestErrorText;
				}
				setSubmitEnabled(field.getValue() !== '');
			};

			BX.ajax.runComponentAction('bitrix:disk.external.link', 'checkPassword', {
				mode: 'ajax',
				data: {
					hash: hash,
					password: password,
				},
			}).then(function(response) {
				if (response.data && response.data.status === 'success')
				{
					clearAlert();
					window.location.reload();

					return;
				}

				showWrong();
			}).catch(showRequestError);
		};

		BX.bind(submitButton, 'click', submit);
		BX.bind(container, 'keydown', function(event) {
			if (event.key === 'Enter' && !submitButton.disabled)
			{
				event.preventDefault();
				submit();
			}
		});
	});
});
</script>
