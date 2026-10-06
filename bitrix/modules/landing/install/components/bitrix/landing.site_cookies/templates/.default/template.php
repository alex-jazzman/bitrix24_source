<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}
$bodyClass = $APPLICATION->GetPageProperty('BodyClass');
$APPLICATION->SetPageProperty('BodyClass', ($bodyClass ? $bodyClass . ' ' : '') . ' no-background no-all-paddings');
use Bitrix\Main\Localization\Loc;
use Bitrix\Landing\Manager;
use Bitrix\Main\UI\Extension;
use Bitrix\UI\Toolbar\Facade\Toolbar;

if ($this->getComponent()->request('close') == 'Y' && !$arResult['ERRORS'])
{
	?>
	<script>
		if (typeof top.BX.SidePanel !== 'undefined')
		{
			setTimeout(function() {
				top.BX.SidePanel.Instance.close();
			}, 300);
		}
	</script>
	<?
}

// load
Loc::loadMessages(__FILE__);
Manager::setPageTitle(Loc::getMessage('LANDING_TPL_TITLE'));
Toolbar::deleteFavoriteStar();
Extension::load(['ui.hint', 'ui.alerts', 'ui.dialogs.messagebox', 'ui.link', 'ui.fonts.opensans']);

// errors
if ($arResult['ERRORS'])
{
	?><div
		class="ui-alert ui-alert-danger"
		id="landing-agreement-error"
		role="alert"
		tabindex="-1"
		data-testid="site-cookies-error"
	><?
	foreach ($arResult['ERRORS'] as $error)
	{
		echo \htmlspecialcharsbx($error) . '<br/>';
	}
	?></div>
	<script>
		BX.ready(function() {
			// the block comes from the server already rendered, so nothing announces it on its own
			var errorBlock = document.getElementById('landing-agreement-error');

			if (errorBlock)
			{
				errorBlock.focus();
			}
		});
	</script><?
}
if ($arResult['FATAL'])
{
	return;
}

// uri
$uriSave = new \Bitrix\Main\Web\Uri(
	\htmlspecialcharsback(POST_FORM_ACTION_URI)
);
$uriSave->addParams([
	'close' => 'Y'
]);

// help link
$helpUrl = \Bitrix\Landing\Help::getHelpUrl('COOKIES_EDIT');
if ($helpUrl)
{
	$helpText = Loc::getMessage('LANDING_TPL_HELP_LINK');
	$helpHint = Loc::getMessage('LANDING_TPL_HELP_LINK_HINT');
	$helpLink = <<<HTML
			<a class="landing-help-link" href="$helpUrl" target="_blank" data-testid="site-cookies-help-link">
				$helpText
				<span data-hint="$helpHint" class="ui-hint"></span>
			</a>
		HTML;

	Toolbar::addRightCustomHtml($helpLink, [
		'align' => 'right',
	]);
}

$idRand1 = randString(5);
?>

<div class="landing-agreement">
	<form action="<?= \htmlspecialcharsbx($uriSave->getUri());?>" method="post" data-testid="site-cookies-form">
		<input type="hidden" name="action" value="save">
		<?= bitrix_sessid_post();?>
		<?foreach (['SYSTEM', 'CUSTOM'] as $agreementType):?>
			<div class="landing-agreement-wrapper<?if ($agreementType == 'CUSTOM'){?> landing-agreement-wrapper-custom<?}?>" data-testid="site-cookies-section-<?= strtolower($agreementType);?>">
				<?php /* the section carries a tabindex: the script sends the focus here after the
				warning is closed together with the button that closed it */ ?>
				<h2 class="landing-agreement-title" tabindex="-1" data-testid="site-cookies-title-<?= strtolower($agreementType);?>"><?= Loc::getMessage('LANDING_TPL_TITLE_' . $agreementType);?></h2>
				<?if ($agreementType == 'CUSTOM' && $arResult['SITE_INCLUDES_SCRIPT']):?>
					<div class="ui-alert ui-alert-warning landing-agreement-warning" data-testid="site-cookies-warning">
						<span class="ui-alert-message">
							<?= Loc::getMessage('LANDING_TPL_HOOK_COOKIES_SCRIPT_WARN');?>
						</span>
						<button
							type="button"
							class="ui-alert-close-btn"
							id="landing-agreement-warning-close"
							aria-label="<?= \htmlspecialcharsbx(Loc::getMessage('LANDING_TPL_WARNING_CLOSE'));?>"
							data-testid="site-cookies-warning-close-btn"
						></button>
					</div>
				<?endif;?>
				<?
				foreach ($arResult['AGREEMENTS'][$agreementType] as $id => $agreement)
				{
					include 'bbform.php';
				}
				?>
				<?if ($agreementType == 'CUSTOM'):?>
					<div class="landing-agreement-new-custom" id="landing-agreement-new-<?= $idRand1;?>" data-testid="site-cookies-new-agreements"></div>
					<button type="button" class="landing-agreement-add ui-link ui-link-dashed" data-testid="site-cookies-add-btn"><?= Loc::getMessage('LANDING_TPL_NEW_COOKIES');?></button>
				<?endif;?>
			</div>
		<?endforeach;?>
		<div class="landing-edit-footer-fixed pinable-block">
			<div class="landing-form-footer-container">
				<button type="submit" class="ui-btn ui-btn-success"  name="submit"  value="<?= Loc::getMessage('LANDING_TPL_BUTTON_SAVE');?>" data-testid="site-cookies-save-btn">
					<?= Loc::getMessage('LANDING_TPL_BUTTON_SAVE');?>
				</button>
				<?php /* outside of the side panel there is nothing for this button to close, and a
				button that does nothing promises more than the dead link it replaces */ ?>
				<?if ($this->getComponent()->request('IFRAME') == 'Y'):?>
					<button type="button" class="ui-btn ui-btn-md ui-btn-link" id="landing-agreement-cancel" data-testid="site-cookies-cancel-btn">
						<?= Loc::getMessage('LANDING_TPL_BUTTON_CANCEL');?>
					</button>
				<?endif;?>
			</div>
		</div>
	</form>
</div>

<script>
	BX.ready(function()
	{
		var cancelButton = document.getElementById('landing-agreement-cancel');

		if (cancelButton)
		{
			cancelButton.addEventListener('click', function() {
				if (typeof top.BX !== 'undefined' && typeof top.BX.SidePanel !== 'undefined')
				{
					top.BX.SidePanel.Instance.close();
				}
			});
		}

		new BX.Landing.SiteCookies({
			classNameAgreementBlock: 'landing-agreement-block',
			classNameEditIcon: 'landing-agreement-edit',
			classNameAgreementDelete: 'landing-agreement-delete',
			classNameAgreementAdd: 'landing-agreement-add',
			classCloseWarningIcon: 'landing-agreement-warning-close',
			classInputBlock: 'landing-agreement-input-block',
			classEditTitle: 'landing-agreement-cookies-name-edit',
			classTitleInput: 'landing-agreement-cookies-name-input',
			classBlockAreaShow: 'landing-agreement-block-inner-show',
			idAgreementNew: 'landing-agreement-new-<?= $idRand1;?>',
			bbFormAjaxPath: '/bitrix/components/bitrix/landing.site_cookies/ajax.form.php',
			messages: {
				removeAlertTitle: '<?= \CUtil::jsEscape(Loc::getMessage('LANDING_TPL_ALERT_REMOVE_TITLE'))?>',
				removeAlertText: '<?= \CUtil::jsEscape(Loc::getMessage('LANDING_TPL_ALERT_REMOVE_TEXT'))?>',
				newAgreement: '<?= \CUtil::jsEscape(Loc::getMessage('LANDING_TPL_NEW_COOKIES'))?>'
			}
		});
	});
</script>