<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use \Bitrix\Main\Localization\Loc;
use \Bitrix\Main\Page\Asset;
use \Bitrix\Landing\Manager;
use Bitrix\Main\UI\Extension;

/** @var array $site */
/** @var array $arResult */

Asset::getInstance()->addJS(
	'/bitrix/components/bitrix/landing.site_domain/templates/.default/script.js'
);
Loc::loadMessages(
	Manager::getDocRoot() . '/bitrix/components/bitrix/landing.site_domain/templates/.default/template.php'
);
Extension::load(['ui.hint']);

$domainName = $site['SUBDOMAIN_NAME'] ?: $site['DOMAIN_NAME'];
$domainRules = (string)Loc::getMessage('LANDING_TPL_DOMAIN_RULES_B24');
// accessible description is plain text: markup line breaks give no pause there
$domainRulesText = trim(strip_tags(preg_replace('#\.?\s*<br\s*/?>\s*#i', '. ', $domainRules)));
?>

<input type="hidden" name="SAVE_SITE" value="Y" />
<table id="landing-sm-content-table" class="landing-sm-content-table" role="presentation">
	<tr>
		<td></td>
		<td colspan="2">
			<div class="ui-ctl-label-text">
				<label for="domain-edit-name"><?= Loc::getMessage('LANDING_TPL_CURRENT_ADDRESS') ?></label>
				<span data-hint="<?= $domainRules ?>" data-hint-html aria-hidden="true"></span>
				<span class="landing-visually-hidden" id="landing-domain-rules"><?= \htmlspecialcharsbx($domainRulesText) ?></span>
			</div>
		</td>
	</tr>
	<tr>
		<td aria-hidden="true">
			<div class="landing-sm-content-table-num">1</div>
		</td>
		<td>
			<div class="ui-ctl ui-ctl-textbox ui-ctl-w100">
				<input autocomplete="off" type="text" name="SUBDOMAIN" class="ui-ctl-element" id="domain-edit-name" value="<?= \htmlspecialcharsbx($domainName);?>" placeholder="<?= Loc::getMessage('LANDING_TPL_PLACEHOLDER_DOMAIN_NAME');?>" aria-describedby="domain-edit-message landing-domain-postfix landing-domain-rules domain-edit-length" data-testid="landing-master-domain-input">
				<div class="ui-ctl-ext-after ui-ctl-icon-loader" id="domain-edit-loader" hidden></div>
				<div class="landing-domain-alert" id="domain-edit-message" data-testid="landing-master-domain-message"></div>
				<div class="domain-edit-length" id="domain-edit-length" hidden></div>
			</div>
		</td>
		<td>
			<div class="landing-sm-content-table-domain" id="landing-domain-postfix"><?= $site['POSTFIX'];?></div>
		</td>
	</tr>
	<tr>
		<td></td>
		<td colspan="2">
			<div class="ui-ctl-label-text">
				<label for="landing-master-company"><?= Loc::getMessage('LANDING_TPL_FORM_TITLE');?></label>
			</div>
		</td>
	</tr>
	<tr>
		<td aria-hidden="true">
			<div class="landing-sm-content-table-num">2</div>
		</td>
		<td colspan="2">
			<div class="ui-ctl ui-ctl-textbox ui-ctl-w100">
				<input autocomplete="organization" type="text" name="COMPANY" class="ui-ctl-element" id="landing-master-company" value="<?= \htmlspecialcharsbx($arResult['CRM_CONTACTS']['COMPANY'] ?? '');?>" placeholder="<?= Loc::getMessage('LANDING_TPL_PLACEHOLDER_COMPANY');?>" data-testid="landing-master-company-input">
			</div>
		</td>
	</tr>
	<tr>
		<td></td>
		<td colspan="2">
			<div class="ui-ctl-label-text">
				<label for="landing-master-phone"><?= Loc::getMessage('LANDING_TPL_FORM_PHONE');?></label>
			</div>
		</td>
	</tr>
	<tr>
		<td aria-hidden="true">
			<div class="landing-sm-content-table-num">3</div>
		</td>
		<td colspan=2>
			<div class="ui-ctl ui-ctl-textbox ui-ctl-w100">
				<input autocomplete="tel" type="tel" name="PHONE" class="ui-ctl-element" id="landing-master-phone" value="<?= \htmlspecialcharsbx($arResult['CRM_CONTACTS']['PHONE'] ?? '');?>" placeholder="<?= Loc::getMessage('LANDING_TPL_PLACEHOLDER_PHONE');?>" data-testid="landing-master-phone-input">
			</div>
		</td>
	</tr>
</table>

<div class="landing-sm-content-bottom-info"><?= Loc::getMessage('LANDING_TPL_CHANGE_INFO');?></div>

<script>
	BX.ready(function()
	{
		BX.message({
			LANDING_TPL_ERROR_DOMAIN_EXIST: '<?= \CUtil::jsEscape(Loc::getMessage('LANDING_TPL_ERROR_DOMAIN_EXIST'));?>',
			LANDING_TPL_ERROR_DOMAIN_EXIST_DELETED: '<?= \CUtil::jsEscape(Loc::getMessage('LANDING_TPL_ERROR_DOMAIN_EXIST_DELETED'));?>',
			LANDING_TPL_ERROR_DOMAIN_EMPTY: '<?= \CUtil::jsEscape(Loc::getMessage('LANDING_TPL_ERROR_DOMAIN_EMPTY'));?>',
			LANDING_TPL_ERROR_DOMAIN_WRONG_NAME: '<?= \CUtil::jsEscape(Loc::getMessage('LANDING_TPL_ERROR_DOMAIN_WRONG_NAME'));?>',
			LANDING_TPL_ERROR_DOMAIN_WRONG_LENGTH: '<?= \CUtil::jsEscape(Loc::getMessage('LANDING_TPL_ERROR_DOMAIN_WRONG_LENGTH'));?>',
			LANDING_TPL_ERROR_DOMAIN_WRONG_SYMBOL_COMBINATIONS: '<?= \CUtil::jsEscape(Loc::getMessage('LANDING_TPL_ERROR_DOMAIN_WRONG_SYMBOL_COMBINATIONS')) ?>',
			LANDING_TPL_ERROR_DOMAIN_WRONG_DOMAIN_LEVEL: '<?= \CUtil::jsEscape(Loc::getMessage('LANDING_TPL_ERROR_DOMAIN_WRONG_DOMAIN_LEVEL')) ?>',
			LANDING_TPL_DOMAIN_LENGTH_LIMIT: '<?= \CUtil::jsEscape(Loc::getMessage('LANDING_TPL_DOMAIN_LENGTH_LIMIT'));?>',
			LANDING_TPL_ALERT_TITLE: '<?= \CUtil::jsEscape(Loc::getMessage('LANDING_TPL_ALERT_TITLE'));?>',
			LANDING_TPL_DOMAIN_AVAILABLE: '<?= \CUtil::jsEscape(Loc::getMessage('LANDING_TPL_DOMAIN_AVAILABLE'));?>',
			LANDING_TPL_ERROR_DOMAIN_INCORRECT: '<?= \CUtil::jsEscape(Loc::getMessage('LANDING_TPL_ERROR_DOMAIN_INCORRECT'));?>',
			LANDING_TPL_ERROR_DOMAIN_CHECK_DASH: '<?= \CUtil::jsEscape(Loc::getMessage('LANDING_TPL_ERROR_DOMAIN_CHECK_DASH'));?>',
			LANDING_TPL_ERROR_DOMAIN_CHECK: '<?= \CUtil::jsEscape(Loc::getMessage('LANDING_TPL_ERROR_DOMAIN_CHECK', ['#TLD#' => strtolower($arResult['TLD'][0])]));?>',
			LANDING_TPL_DOMAIN_CHECKING: '<?= \CUtil::jsEscape(Loc::getMessage('LANDING_TPL_DOMAIN_CHECKING'));?>',
			LANDING_TPL_DOMAIN_CHECKING_SUBMIT: '<?= \CUtil::jsEscape(Loc::getMessage('LANDING_TPL_DOMAIN_CHECKING_SUBMIT'));?>',
			LANDING_TPL_DOMAIN_MESSAGE_SUCCESS: '<?= \CUtil::jsEscape(Loc::getMessage('LANDING_TPL_DOMAIN_MESSAGE_SUCCESS'));?>',
			LANDING_TPL_DOMAIN_MESSAGE_ERROR: '<?= \CUtil::jsEscape(Loc::getMessage('LANDING_TPL_DOMAIN_MESSAGE_ERROR'));?>',
			LANDING_TPL_ERROR_DOMAIN_PROCESSING: '<?= \CUtil::jsEscape(Loc::getMessage('LANDING_TPL_ERROR_DOMAIN_PROCESSING'));?>'
		});
	});
</script>

<script>
	BX.ready(function()
	{
		new BX.Landing.SiteDomain.Bitrix24({
			domainId: <?= $site['DOMAIN_ID'];?>,
			domainName: '<?= \CUtil::jsEscape($site['DOMAIN_NAME']);?>',
			domainPostfix: '<?= $site['POSTFIX']?>',
			idDomainName: BX('domain-edit-name'),
			idDomainMessage: BX('domain-edit-message'),
			idDomainLoader: BX('domain-edit-loader'),
			idDomainLength: BX('domain-edit-length'),
			idDomainSubmit: BX('landing-master-next'),
			tld: <?= \CUtil::phpToJSObject($arResult['TLD'][0])?>,
		});
	});

	BX.UI.Hint.init(BX('landing-sm-content-table'));
</script>