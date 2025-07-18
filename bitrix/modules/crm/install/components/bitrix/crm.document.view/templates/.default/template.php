<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

/** @var array $arParams */
/** @var array $arResult */
/** @var CMain $APPLICATION */

use Bitrix\DocumentGenerator\Driver;
use Bitrix\DocumentGenerator\Integration\Bitrix24Manager;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\Page\Asset;
use Bitrix\Main\UI\Extension;
use Bitrix\UI\Toolbar\Facade\Toolbar;

Extension::load([
	'ui.buttons',
	'ui.buttons.icons',
	'ui.alerts',
	'ui.design-tokens',
	'ui.fonts.opensans',
	'ui.progressround',
	'ui.viewer',
	'ui.notification',
	'ui.info-helper',
	'popup',
	'sidepanel',
	'documentpreview',
	'ui.icons.disk',
	'ui.progressbar',
	'ui.icon-set.main',
	'crm.integration.ui.banner-dispatcher',
]);
Asset::getInstance()->addJs('/bitrix/js/crm/activity.js');

$APPLICATION->SetTitle(htmlspecialcharsbx($arResult['title']));

$downloadButtonOptions = \CUserOptions::GetOption('crm.document.view', 'download_button', []);
$defaultDownloadFormat = in_array(mb_strtolower($downloadButtonOptions['format'] ?? ''), ['doc', 'pdf'], true)
	? mb_strtolower($downloadButtonOptions['format'])
	: 'pdf';

$isSigningEnabledInCurrentTariff = (bool)($arResult['isSigningEnabledInCurrentTariff'] ?? false);

if ($isSigningEnabledInCurrentTariff)
{
	Extension::load([
		'sign.v2.ui.tokens',
		'sign.v2.wizard',
	]);
}

if (\Bitrix\Main\Loader::includeModule('bitrix24'))
{
	$APPLICATION->IncludeComponent('bitrix:bitrix24.limit.lock', '', array());
}

if (\Bitrix\Main\Loader::includeModule('ui'))
{
	Toolbar::deleteFavoriteStar();

	Toolbar::addButton(
		(new \Bitrix\UI\Buttons\Button([
			'color' => \Bitrix\UI\Buttons\Color::LIGHT_BORDER,
			'icon' => \Bitrix\UI\Buttons\Icon::PRINT,
		]))
			// html id can be set only via setter
			->addAttribute('id', 'crm-document-print')
		,
	);

	if (Bitrix24Manager::isEnabled())
	{
		$escapedProvider = \CUtil::JSEscape($arResult['PROVIDER']);
		$escapedTemplateName = \CUtil::JSEscape($arResult['TEMPLATE_NAME']);
		$escapedTemplateCode = \CUtil::JSEscape($arResult['TEMPLATE_CODE']);

		Toolbar::addButton(
			new \Bitrix\UI\Buttons\Button([
				'color' => \Bitrix\UI\Buttons\Color::LIGHT_BORDER,
				'text' => Loc::getMessage('CRM_DOCUMENT_VIEW_FEEDBACK'),
				'onclick' => new \Bitrix\UI\Buttons\JsCode("BX.DocumentGenerator.Feedback.open('{$escapedProvider}', '{$escapedTemplateName}', '{$escapedTemplateCode}')"),
			])
		);
	}

	$downloadButton = \Bitrix\UI\Buttons\Split\Button::create([
		'color' => \Bitrix\UI\Buttons\Color::LIGHT_BORDER,
		'className' => 'crm__document-view--btn-icon-' . mb_strtolower($defaultDownloadFormat),
		'text' => Loc::getMessage(
			'CRM_COMMON_ACTION_DOWNLOAD_FORMAT',
			[
				'#FORMAT#' => match (mb_strtolower($defaultDownloadFormat)) {
					'pdf' => 'PDF',
					'doc' => 'DOCX',
					default => '',
				},
			],
		),
	]);
	$downloadButton->addAttribute('id', 'crm-document-download');

	Toolbar::addButton($downloadButton);
}

$renderRequisiteSection = function(?string $entityName, array $data): void {
	?>
		<div class="crm__document-view--sidebar-requisite-field">
			<?=htmlspecialcharsbx($entityName);?>
		</div>
		<div class="crm__document-view--sidebar-requisite-title">
			<?php if (!empty($data['link'])):?>
				<a href="<?=htmlspecialcharsbx($data['link']);?>"><?=htmlspecialcharsbx($data['title'] ?? '');?></a>
			<?php else:?>
				<?=htmlspecialcharsbx($data['title'] ?? '');?>
			<?php endif;?>
		</div>
		<?if (!empty($data['subTitle'])):?>
			<div class="crm__document-view--sidebar-requisite-subtitle">
				<?=htmlspecialcharsbx($data['subTitle']);?>
			</div>
		<?php endif;?>
	<?php
};

$this->IncludeLangFile();

$shouldDisplayTransformationError =
	!empty($arResult['transformationErrorMessage'])
	&& ($arResult['isDisplayTransformationErrors'] ?? true)
;

?>
<div class="crm__document-view--wrap">
	<div class="crm__document-view--inner crm__document-view--inner-slider">
		<div class="ui-alert ui-alert-danger ui-alert-icon-danger ui-alert-text-center" id="crm-document-view-error"<?php
		if (!empty($arResult['ERRORS']) || $shouldDisplayTransformationError):
			?> style="display: block;"
		<?php endif;?>>
			<span class="ui-alert-message" id="crm-document-view-error-message">
			<?php if (!empty($arResult['ERRORS']) && is_array($arResult['ERRORS'])):
				foreach($arResult['ERRORS'] as $error):
					echo htmlspecialcharsbx($error);
					echo '<br />';
				endforeach;
			elseif ($shouldDisplayTransformationError):
				echo htmlspecialcharsbx($arResult['transformationErrorMessage']);
			endif; ?></span>
			<span class="ui-alert-close-btn" onclick="BX.hide(BX('crm-document-view-error'));"></span>
		</div>
		<?php if (empty($arResult['ERRORS'])):?>
			<div class="crm__document-view--img">
				<div class="crm__document-view--error" id="crm__document-view--transform-error"<?php if ($arResult['isTransformationError'] && empty($arResult['pdfUrl'])): ?> style="display: block;"<?php endif;?>>
					<div class="crm__document-view--error-message">
						<span class="crm__document-view--error-message-text"><?=Loc::getMessage('CRM_DOCUMENT_VIEW_TRANSFORM_ERROR');?></span>
						<span class="crm__document-view--error-message-text"><?=Loc::getMessage('CRM_DOCUMENT_VIEW_TRY_LATER');?></span>
						<span><a onclick="location.reload();" class="crm__document-view--link-pointer"><?=Loc::getMessage('CRM_DOCUMENT_VIEW_TRY_AGAIN');?></a></span>
					</div>
					<div class="crm__document-view--error-img"></div>
				</div>
				<div class="crm__document-view--upload crm__document-view--upload-img" id="crm__document-view--node"<?php if (!$arResult['isTransformationError'] && empty($arResult['pdfUrl'])):?> style="display: block;"<?php endif;?>>
					<div class="crm__document-view--upload-message">
						<div class="crm__document-view--upload-logo">
							<div class="ui-icon-set --document"></div>
						</div>
						<span class="crm__document-view--upload-message-text" id="crm__document-view--node-message"><?=Loc::getMessage('CRM_DOCUMENT_VIEW_PREVIEW_MESSAGE_PREPARE_MSGVER_1');?></span>
						<span class="crm__document-view--upload-detail" id="crm__document-view--node-detail"><?=Loc::getMessage('CRM_DOCUMENT_VIEW_PREVIEW_MESSAGE_READY_MSGVER_1');?></span>
						<div class="crm__document-view--upload-progress" id="docs-progress-bar"></div>

						<?php if ($arResult['baas']['fastTransform']['isAvailable']): ?>
							<div id="crm-document-speedup-in-placeholder" <?= $arResult['baas']['fastTransform']['isActive'] ? 'hidden' : '' ?>>
								<button class="crm__document-view--upload-btn">
									<span class="ui-icon-set --sort-activity"></span>
									<span class="crm__document-view--upload-btn-text"><?=Loc::getMessage('CRM_DOCUMENT_VIEW_SPEEDUP');?></span>
								</button>
							</div>
						<?php endif; ?>
					</div>
				</div>
				<div class="crm__document-view--pdf" id="crm-document-pdf" data-viewer-type="document"></div>
			</div>
			<script>
				BX.ready(function()
				{
					<?php
					$messages = array_merge(
						Loc::loadLanguageFile(__FILE__),
						[
							'CRM_DOCUMENT_VIEW_COMPONENT_PROCESSED_NO_PDF_ERROR' => Loc::getMessage('CRM_DOCUMENT_VIEW_COMPONENT_PROCESSED_NO_PDF_ERROR'),
						],
						\Bitrix\Crm\Service\Container::getInstance()->getLocalization()->loadMessages(),
					);
					?>
					BX.message(<?= \Bitrix\Main\Web\Json::encode($messages) ?>);
					BX.Crm.DocumentView.init(<?=CUtil::PhpToJSObject($arResult);?>);
				});
			</script>
		<?php endif;?>
	</div>
	<?php if (empty($arResult['ERRORS'])):?>
		<div class="crm__document-view--sidebar-wrapper">
			<?php if (!empty($arResult['channelSelectorParameters'])):?>
				<div class="crm__document-view--sidebar crm__document-view--sidebar-channels">
					<div class="crm__document-view--channels">
						<?php $APPLICATION->IncludeComponent(
							'bitrix:crm.channel.selector',
							'',
							$arResult['channelSelectorParameters'],
							$this->getComponent()
						);?>
					</div>
				</div>
			<?php endif;?>
			<div class="crm__document-view--sidebar --company-information">
				<div class="crm__document-view--sidebar-section">
					<div
						class="crm__document-view--sidebar-control
							<?php
							if (empty($arResult['editTemplateUrl']) || empty($arResult['changeQrCodeEnabled'])):
								?> --disabled<?php
							endif;?>
							">
						<label class="crm__document-view--label" for="crm-document-qr"><?=Loc::getMessage('CRM_DOCUMENT_VIEW_QR');?></label>
						<input class="crm__document-view--checkbox" type="checkbox" id="crm-document-qr"<?php
						if ($arResult['qrCodeEnabled']):
							?> checked<?php
						endif;
						if (empty($arResult['editTemplateUrl']) || empty($arResult['changeQrCodeEnabled'])):
							?> disabled<?php
						endif;?>>
					</div>
				</div>
				<?php /* // payments temporary disabled
				<div class="crm__document-view--sidebar-section">
					<div class="crm__document-view--sidebar-control">
						<label class="crm__document-view--label --label-icon --icon-paymen crm__document-view--sidebar-control-paymen">
							<?=Loc::getMessage('CRM_DOCUMENT_VIEW_PAYMENT_BUTTON');?>
						</label>
						<span class="crm__document-view--arrow"> </span>
					</div>
				</div>
 				*/?>
				<div class="crm__document-view--sidebar-section">
				<?php
					$renderRequisiteSection(
						Loc::getMessage('CRM_DOCUMENT_VIEW_REQUISITES_MY_COMPANY_TITLE'),
						$arResult['myCompanyRequisites'],
					);
				?>
					<?php if (Driver::getInstance()->getUserPermissions()->canModifyDocuments()):?>
						<div class="crm__document-view--sidebar-control --in-details">
							<label class="crm__document-view--label" type="text" for="crm-document-stamp"><?=Loc::getMessage('CRM_DOCUMENT_VIEW_SIGN_AND_STAMP');?></label>
							<input class="crm__document-view--checkbox" type="checkbox" id="crm-document-stamp"<?php
							if ($arResult['stampsEnabled'] && $arResult['changeStampsEnabled']):
								?> checked<?php
							endif;
							if (empty($arResult['editTemplateUrl']) || empty($arResult['changeStampsEnabled'])):
								?> disabled<?php
							endif;?>>
						</div>
					<?php endif;?>
				</div>
				<div class="crm__document-view--sidebar-section">
				<?php
					$renderRequisiteSection(
						Loc::getMessage('CRM_COMMON_CLIENT'),
						$arResult['clientRequisites'],
					);
				?></div>
				<?php if ($arResult['isSigningEnabled'] ?? false):
					echo \Bitrix\Crm\Tour\Sign\SignDocumentFromSlider::getInstance()->build();
					?>
					<div class="crm__document-view--sidebar-section">
						<div class="crm__document-view--sidebar-control" id="crm-document-sign">
							<label class="crm__document-view--label --label-icon --icon-sign crm__document-view--sidebar-control-sign">
								<?= Loc::getMessage('CRM_DOCUMENT_VIEW_SIGN_BUTTON') ?>
							</label>
							<span class="<?=
							$isSigningEnabledInCurrentTariff
								? 'crm__document-view--arrow'
								: 'tariff-lock'
							?>"></span>
						</div>
					</div>
				<?php endif; ?>
			</div>
			<?php if (!empty($arResult['editDocumentUrl'])):?>
				<?php if ($arResult['baas']['fastTransform']['isAvailable']): ?>
					<div class="crm__document-view--speed-btn" id="crm-document-speedup-in-sidebar">
						<span class="ui-icon-set --speed-meter"></span>
						<span class="crm__document-view--speed-btn-text">
							<?= Loc::getMessage('CRM_DOCUMENT_VIEW_CURRENT_SPEED') ?>
							<span id="crm-document-speedup-value"><?=
								$arResult['baas']['fastTransform']['isActive']
									? Loc::getMessage('CRM_DOCUMENT_VIEW_CURRENT_SPEED_VALUE_FAST')
									: Loc::getMessage('CRM_DOCUMENT_VIEW_CURRENT_SPEED_VALUE_REGULAR')
							?></span>
						</span>
						<span class="crm__document-view--arrow"></span>
					</div>
				<?php endif; ?>
				<div class="crm__document-view--link-inner">
					<div class="crm__document-view--link-block">
						<span class="crm__document-view--link-text" id="crm-document-edit-document"><?=Loc::getMessage('CRM_DOCUMENT_VIEW_EDIT_DOCUMENT');?></span>
					</div>
				</div>
			<?php endif;
			if (!is_bool($arResult['editTemplateUrl'])):?>
			<div class="crm__document-view--link-inner">
				<div class="crm__document-view--link-block">
					<span class="crm__document-view--link-text" id="crm-document-edit-template"><?=Loc::getMessage('CRM_DOCUMENT_VIEW_EDIT_TEMPLATE');?></span>
				</div>
			</div>
			<?php endif;
			if (isset($arResult['publicUrlView']['time'])):?>
				<div class="crm__document-view--sidebar crm__document-view--sidebar-details">
					<div class="crm__document-view--public-view-info">
						<?=Loc::getMessage('CRM_DOCUMENT_VIEW_PUBLIC_URL_VIEWED_TIME', [
							'#TIME#' => $arResult['publicUrlView']['time'],
						]);?>
					</div>
				</div>
			<?php endif;?>
		</div>
	<?php endif;?>
</div>
