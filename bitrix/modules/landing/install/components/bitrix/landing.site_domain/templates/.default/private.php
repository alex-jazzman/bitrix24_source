<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Main\Localization\Loc;
use Bitrix\Main\UI\Extension;

Extension::load(['ui.fonts.opensans', 'ui.hint']);

$requestDomainName = $this->getComponent()->request('param');
$tld = $arResult['TLD'][0] ?? 'tld';
$domainRules = (string)Loc::getMessage('LANDING_TPL_DOMAIN_RULES');

if ($arResult['IS_FREE_DOMAIN'] == 'Y')
{
	$arResult['~DOMAIN_NAME'] = '';
	$arResult['DOMAIN_NAME'] = '';
}
?>
<div id="landing-domain-block-private" class="landing-domain-block landing-domain-block-private" data-testid="landing-domain-private-block">
	<div class="landing-domain-block-title"><?= Loc::getMessage('LANDING_TPL_PRIVATE_SUBTITLE_2') ?></div>
	<div class="landing-domain-block-label">
		<label for="domain-edit-name"><?= Loc::getMessage('LANDING_TPL_PRIVATE_DOMAIN_NAME') ?></label>
		<span data-hint="<?= $domainRules ?>" data-hint-html aria-hidden="true"></span>
		<span class="landing-visually-hidden" id="landing-domain-rules"><?= \htmlspecialcharsbx($arResult['DOMAIN_RULES_TEXT']) ?></span>
	</div>
	<div class="ui-ctl ui-ctl-textbox ui-ctl-w100">
		<div class="ui-ctl-ext-after ui-ctl-icon-loader" id="domain-edit-loader" hidden></div>
		<div class="domain-edit-length" id="domain-edit-length" hidden></div>
		<input type="text" name="param" value="<?= \htmlspecialcharsbx($requestDomainName ? $requestDomainName : $arResult['DOMAIN_NAME']);?>" <?
			?>id="domain-edit-name" class="ui-ctl-element" placeholder="mydomain.<?=$tld?>" <?
			?>aria-describedby="domain-edit-message landing-domain-rules domain-edit-length" <?
			?>data-testid="landing-domain-name-input">
	</div>
	<div class="landing-domain-alert" id="domain-edit-message" data-testid="landing-domain-message"></div>
	<div class="landing-domain-block-guide">
		<div class="landing-domain-block-guide-title"><?= Loc::getMessage('LANDING_TPL_PRIVATE_DOMAIN_INSTRUCT');?></div>
		<table id="domain-edit-dnsinfo" class="landing-domain-table" data-testid="landing-domain-dns-table">
			<tr class="landing-domain-table-header">
				<th scope="col">
					<span class="landing-domain-table-header-text"><?= Loc::getMessage('LANDING_TPL_PRIVATE_DOMAIN_DNS_1');?></span>
				</th>
				<th scope="col">
					<span class="landing-domain-table-header-text"><?= Loc::getMessage('LANDING_TPL_PRIVATE_DOMAIN_DNS_2');?></span>
				</th>
				<th scope="col">
					<span class="landing-domain-table-header-text"><?= Loc::getMessage('LANDING_TPL_PRIVATE_DOMAIN_DNS_3');?></span>
				</th>
			</tr>
			<tr class="landing-domain-table-content">
				<td>
					<?= $arResult['~DOMAIN_NAME'] ? \htmlspecialcharsbx($arResult['~DOMAIN_NAME']) : 'landing.mydomain';?>
				</td>
				<td>CNAME</td>
				<td><?= $arResult['CNAME'];?></td>
			</tr>
			<tr class="landing-domain-table-content">
				<td>
					<?= $arResult['~DOMAIN_NAME'] ? \htmlspecialcharsbx($arResult['~DOMAIN_NAME']) : "landing.mydomain.{$tld}";?>
				</td>
				<td>A</td>
				<td id="domain-ina-ip"><?= $arResult['IP_FOR_DNS'];?></td>
			</tr>
		</table>
	</div>
	<div class="ui-alert ui-alert-warning">
		<span class="ui-alert-message">
			<?= Loc::getMessage('LANDING_TPL_PRIVATE_DOMAIN_ALERT_AAA_TEXT');?>
			<?if ($helpUrl = \Bitrix\Landing\Help::getHelpUrl('DOMAIN_EDIT')):?>
				<a href="<?= $helpUrl;?>" target="_blank" data-testid="landing-domain-dns-help-link">
					<?= Loc::getMessage('LANDING_TPL_PRIVATE_DOMAIN_ALERT_AAA_HELP');?>
				</a>
			<?endif;?>
		</span>
	</div>
</div>
<button type="submit" class="ui-btn ui-btn-primary" id="domain-edit-submit" data-testid="landing-domain-submit-btn">
	<?= Loc::getMessage('LANDING_TPL_SAVE');?>
</button>

<script>
	BX.ready(function()
	{
		new BX.Landing.SiteDomain.Private({
			domainId: <?= $arResult['DOMAIN_ID'];?>,
			domainName: '<?= \CUtil::jsEscape($arResult['~DOMAIN_NAME']);?>',
			idDomainName: BX('domain-edit-name'),
			idDomainMessage: BX('domain-edit-message'),
			idDomainLoader: BX('domain-edit-loader'),
			idDomainLength: BX('domain-edit-length'),
			idDomainDnsInfo: BX('domain-edit-dnsinfo'),
			idDomainSubmit: BX('domain-edit-submit'),
			idDomainErrorAlert: BX('domain-error-alert'),
			idDomainINA: BX('domain-ina-ip'),
			tld: <?= \CUtil::phpToJSObject($arResult['TLD'][0])?>,
		});

		BX.UI.Hint.init(BX('landing-domain-block-private'));
	});
</script>