<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Landing\Manager;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\UI\Extension;

Loc::loadMessages(__FILE__);
\Bitrix\Main\UI\Extension::load('ui.forms');
\Bitrix\Main\UI\Extension::load('ui.common');


/** @var array $arParams */
/** @var array $arResult */
/** @var \LandingSiteContactsComponent $component */

Manager::setPageTitle(Loc::getMessage('LANDING_TPL_TITLE'));

// saving and close
if ($component->request('save') == 'Y' && !$arResult['ERRORS'])
{
	?>
	<script>
		if (typeof top.BX.SidePanel !== 'undefined')
		{
			setTimeout(function() {
				top.BX.SidePanel.Instance.close();
				top.BX.onCustomEvent('BX.Landing.Filter:apply');
			}, 300);
		}
	</script>
	<?
}

// errors
if ($arResult['ERRORS'])
{
	?><div
		class="ui-alert ui-alert-danger"
		id="landing-site-contacts-error"
		role="alert"
		tabindex="-1"
		data-testid="site-contacts-error"
	><?
	foreach ($arResult['ERRORS'] as $error)
	{
		echo \htmlspecialcharsbx($error) . '<br/>';
	}
	?></div>
	<script>
		BX.ready(function() {
			// the block comes from the server already rendered, so nothing announces it on its own
			var errorBlock = document.getElementById('landing-site-contacts-error');

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

Extension::load(['sidepanel']);
$contacts = $arResult['CRM_CONTACTS'];
$contactsRaw = $arResult['CRM_CONTACTS_RAW'];
?>

<div class="landing-site-contacts" data-testid="site-contacts-root">
	<form method="post" action="<?= \htmlspecialcharsbx($component->getUri(['save' => 'Y']))?>" data-testid="site-contacts-form">
		<input type="hidden" name="save" value="Y" />
		<input type="hidden" name="action" value="save" />
		<input type="hidden" name="IFRAME" value="<?= $component->request('IFRAME') == 'Y' ? 'Y' : 'N';?>" />
		<?= bitrix_sessid_post();?>

		<div class="landing-site-contacts__section">
			<div class="ui-ctl-label-text"><?
				?><label id="landing-site-contacts-company-label" for="landing-site-contacts-company"><?= Loc::getMessage('LANDING_TPL_FORM_INPUT_NAME');?></label><?
				if ($contactsRaw['COMPANY'] !== $contacts['COMPANY']):
					?> <button
						type="button"
						class="landing-site-contacts__return"
						id="landing-site-contacts-company-return"
						aria-labelledby="landing-site-contacts-company-return landing-site-contacts-company-label"
						data-role="landing-site-contacts__return"
						data-target="landing-site-contacts-company"
						data-raw="<?= \htmlspecialcharsbx($contactsRaw['COMPANY']);?>"
						data-testid="site-contacts-company-return-btn"
					><span class="landing-site-contacts__return-text"><?= Loc::getMessage('LANDING_TPL_REVERT');?></span></button><?
				endif;
			?></div>
			<div class="ui-ctl ui-ctl-textbox ui-ctl-w100">
				<input type="text" name="COMPANY" id="landing-site-contacts-company" class="ui-ctl-element" value="<?= \htmlspecialcharsbx($contacts['COMPANY'] ?? '');?>" placeholder="<?= Loc::getMessage('LANDING_TPL_PLACEHOLDER_COMPANY');?>" data-testid="site-contacts-company-input" />
			</div>
		</div>

		<div class="landing-site-contacts__section">
			<div class="ui-ctl-label-text"><?
				?><label id="landing-site-contacts-phone-label" for="landing-site-contacts-phone"><?= Loc::getMessage('LANDING_TPL_FORM_INPUT_PHONE');?></label><?
				if ($contactsRaw['PHONE'] !== $contacts['PHONE']):
					?> <button
						type="button"
						class="landing-site-contacts__return"
						id="landing-site-contacts-phone-return"
						aria-labelledby="landing-site-contacts-phone-return landing-site-contacts-phone-label"
						data-role="landing-site-contacts__return"
						data-target="landing-site-contacts-phone"
						data-raw="<?= \htmlspecialcharsbx($contactsRaw['PHONE']);?>"
						data-testid="site-contacts-phone-return-btn"
					><span class="landing-site-contacts__return-text"><?= Loc::getMessage('LANDING_TPL_REVERT');?></span></button><?
				endif;
			?></div>
			<div class="ui-ctl ui-ctl-textbox ui-ctl-w100">
				<input type="text" name="PHONE" id="landing-site-contacts-phone" class="ui-ctl-element" value="<?= \htmlspecialcharsbx($contacts['PHONE'] ?? '');?>" placeholder="<?= Loc::getMessage('LANDING_TPL_PLACEHOLDER_PHONE');?>" data-role="landing-site-contacts__phone" data-testid="site-contacts-phone-input"/>
			</div>
		</div>

		<?if ($contactsRaw['ID']):?>
		<div class="landing-site-contacts__section">
			<a class="landing-site-contacts__link" href="<?= SITE_DIR?>crm/company/details/<?= $contactsRaw['ID'];?>/" data-testid="site-contacts-requisites-link">
				<?= Loc::getMessage('LANDING_TPL_REQ_CHANGE');?>
			</a>
		</div>
		<?endif;?>

		<button type="submit" id="landing-master-next" class="ui-btn ui-btn-primary" data-testid="site-contacts-save-btn">
			<?= Loc::getMessage('LANDING_TPL_FORM_SAVE');?>
		</button>
	</form>
</div>

<script>
	BX.ready(function() {
		var returnNodes = document.body.querySelectorAll('[data-role="landing-site-contacts__return"]');

		for (var i = 0; i < returnNodes.length; i++)
		{
			returnNodes[i].addEventListener('click', function() {
				var inputNode = document.getElementById(this.getAttribute('data-target'));

				if (!inputNode)
				{
					return;
				}

				inputNode.value = this.getAttribute('data-raw');
				// the focus moves first: hiding the button before that would drop the focus on the body
				inputNode.focus();
				this.classList.add('--hide');
			});
		}
	});
</script>