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

$isInitialShell = isset($arResult['operation']) && !isset($arResult['id']);
$extensions = [
	'ui.buttons',
	'ui.buttons.icons',
	'ui.alerts',
	'ui.design-tokens',
	'ui.fonts.opensans',
	'intranet.old-interface.intranet-common',
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
	'ui.icon-set.outline',
	'ui.system.typography',
	'ui.dialogs.messagebox',
	'ui.system.skeleton',
	'crm.integration.ui.banner-dispatcher',
];
if ($isInitialShell)
{
	$extensions[] = 'crm.integration.documentgenerator.document.view';
}
Extension::load($extensions);
Asset::getInstance()->addJs('/bitrix/js/crm/activity.js');

$arResult += [
	'ERRORS' => [],
	'baas' => [],
	'changeQrCodeEnabled' => false,
	'changeStampsEnabled' => false,
	'clientRequisites' => [],
	'downloadUrl' => '',
	'editTemplateUrl' => false,
	'isTransformationError' => false,
	'myCompanyRequisites' => [],
	'pdfUrl' => '',
	'qrCodeEnabled' => false,
	'stampsEnabled' => false,
];
$arResult['baas'] += ['fastTransform' => []];
$arResult['baas']['fastTransform'] += [
	'isActive' => false,
	'isAvailable' => false,
];

$downloadUrl = (string)$arResult['downloadUrl'];

$APPLICATION->SetTitle(htmlspecialcharsbx($arResult['title'] ?? $arResult['initialTitle'] ?? ''));

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

	$printButton = new \Bitrix\UI\Buttons\Button([
		'color' => \Bitrix\UI\Buttons\Color::LIGHT_BORDER,
		'icon' => \Bitrix\UI\Buttons\Icon::PRINT,
	]);
	// html id can be set only via setter
	$printButton->addAttribute('id', 'crm-document-print');
	$printButton->addAttribute('data-testid', 'crm-document-view-print');
	$printButton->addAttribute('aria-label', Loc::getMessage('CRM_COMMON_ACTION_PRINT'));
	$printButton->setDisabled($isInitialShell);
	Toolbar::addButton($printButton);

	Bitrix24Manager::addFeedbackButtonToToolbar(
		$arResult['PROVIDER'] ?? '',
		$arResult['TEMPLATE_NAME'] ?? '',
		$arResult['TEMPLATE_CODE'] ?? '',
	);

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
	$downloadButton->addAttribute('data-testid', 'crm-document-view-download');
	$downloadButton->getMainButton()->addAttribute('data-testid', 'crm-document-view-download-file');
	$downloadButton->getMenuButton()->addAttribute('data-testid', 'crm-document-view-download-menu');
	$downloadButton->getMenuButton()->addAttribute('aria-label', Loc::getMessage('CRM_COMMON_ACTION_DOWNLOAD'));
	$downloadButton->setDisabled($isInitialShell);

	Toolbar::addButton($downloadButton);
}

// sidebar values arrive with the second request, so the creation shell masks the pending boxes in place
$renderPendingSkeleton = static function(array $lineWidths) use ($isInitialShell): void {
	if (!$isInitialShell)
	{
		return;
	}
	?><span class="crm__document-view--skeleton" data-role="document-sidebar-skeleton"><?php
	foreach ($lineWidths as $lineWidth):
		?><span class="ui-skeleton" style="--width: <?=htmlspecialcharsbx($lineWidth);?>; --height: 8px;"></span><?php
	endforeach;
	?></span><?php
};

// the channel selector arrives as rendered html, so the shell holds its exact box
$renderChannelsSkeleton = static function() use ($isInitialShell): void {
	if (!$isInitialShell)
	{
		return;
	}
	?><div class="crm__document-view--channels-skeleton" data-role="document-channels-skeleton">
		<div class="crm__document-view--channels-skeleton-header">
			<span class="ui-skeleton" style="--width: 61px; --height: 8px;"></span>
			<span class="ui-skeleton crm__document-view--channels-skeleton-gear"></span>
		</div>
		<div class="crm__document-view--channels-skeleton-list"><?php
		foreach ([['96px', '132px'], ['96px', '118px'], ['96px', '175px']] as [$nameWidth, $hintWidth]):
			?><div class="crm__document-view--channels-skeleton-channel">
				<span class="ui-skeleton crm__document-view--channels-skeleton-icon"></span>
				<span class="crm__document-view--channels-skeleton-lines">
					<span class="ui-skeleton" style="--width: <?=$nameWidth;?>; --height: 8px;"></span>
					<span class="ui-skeleton" style="--width: <?=$hintWidth;?>; --height: 8px;"></span>
				</span>
			</div><?php
		endforeach;
		?></div>
		<div class="crm__document-view--channels-skeleton-footer">
			<span class="ui-skeleton crm__document-view--channels-skeleton-button"></span>
		</div>
	</div><?php
};

$renderRequisiteSection = function(?string $entityName, array $data, string $rolePrefix) use ($renderPendingSkeleton): void {
	?>
		<div class="crm__document-view--sidebar-requisite-field">
			<?=htmlspecialcharsbx($entityName);?>
		</div>
		<div class="crm__document-view--sidebar-requisite-title crm__document-view--sidebar-pending">
			<a data-testid="crm-document-view-<?=$rolePrefix;?>-link" data-role="<?=$rolePrefix;?>-link"<?php if (!empty($data['link'])):
				?> href="<?=htmlspecialcharsbx($data['link']);?>"<?php
			endif;?>>
				<span data-role="<?=$rolePrefix;?>-title"><?=htmlspecialcharsbx($data['title'] ?? '');?></span>
			</a>
			<?php $renderPendingSkeleton(['230px']);?>
		</div>
		<div class="crm__document-view--sidebar-requisite-subtitle" data-role="<?=$rolePrefix;?>-subtitle"<?php
		if (empty($data['subTitle'])):
			?> hidden<?php
		endif;?>><?=htmlspecialcharsbx($data['subTitle'] ?? '');?></div>
	<?php
};

$this->IncludeLangFile();

$shouldDisplayTransformationError =
	!empty($arResult['transformationErrorMessage'])
	&& ($arResult['isDisplayTransformationErrors'] ?? true)
;

?>
<div class="crm__document-view--wrap" id="crm-document-view-root" data-testid="crm-document-view-root"<?php
if ($isInitialShell):
	?> data-state="assemblingDocx"<?php
endif;?>>
	<div class="crm__document-view--inner crm__document-view--inner-slider">
		<div class="ui-alert ui-alert-danger ui-alert-icon-danger ui-alert-text-center" id="crm-document-view-error" role="alert"<?php
		if (empty($arResult['ERRORS']) && !$shouldDisplayTransformationError):
			?> hidden<?php
		endif;?>>
			<span class="ui-alert-message" id="crm-document-view-error-message">
			<?php if (!empty($arResult['ERRORS']) && is_array($arResult['ERRORS'])):
				foreach($arResult['ERRORS'] as $error):
					echo htmlspecialcharsbx($error);
					echo '<br />';
				endforeach;
			elseif ($shouldDisplayTransformationError):
				echo htmlspecialcharsbx($arResult['transformationErrorMessage']);
			endif; ?></span>
			<?php if ($isInitialShell):?>
				<button
					class="ui-btn ui-btn-light-border crm__document-view--creation-retry"
					type="button"
					data-role="document-create-retry"
					data-testid="crm-document-view-create-retry"
					hidden
				><?=Loc::getMessage('CRM_DOCUMENT_VIEW_TRY_AGAIN');?></button>
			<?php endif;?>
		</div>
		<div class="crm__document-view--img">
			<div class="crm__document-view--error ui-icon-set__scope" id="crm__document-view--transform-error" role="alert"<?php
			if ($arResult['isTransformationError'] && empty($arResult['pdfUrl'])):
				?> style="display: block;"<?php
			endif;?>>
				<div class="crm__document-view--error-scene">
					<div class="crm__document-view--error-illustration" data-role="illustration"></div>
					<div class="crm__document-view--error-message">
						<span class="ui-headline --xl crm__document-view--error-title"><?=Loc::getMessage('CRM_DOCUMENT_VIEW_TRANSFORM_ERROR_TITLE');?></span>
						<span
							class="ui-text --lg crm__document-view--error-lead"
							id="crm__document-view--transform-error-message"
						><?=Loc::getMessage('CRM_DOCUMENT_VIEW_TRANSFORM_ERROR_LEAD');?></span>
					</div>
					<div class="crm__document-view--error-actions">
						<button
							type="button"
							data-testid="crm-document-view-preview-retry"
							onclick="location.reload();"
							class="ui-btn --air ui-btn-xl ui-btn-no-caps --style-filled --with-left-icon crm__document-view--error-action crm__document-view--error-action-retry"
						><span class="ui-btn-text"><?=Loc::getMessage('CRM_DOCUMENT_VIEW_TRY_AGAIN');?></span></button>
						<?php
						// the link stays in the dom even with no url yet: in the creation flow the docx
						// appears after this render, and the extension can only fill a node that exists
						?>
						<a
							<?php if ($downloadUrl !== ''): ?>href="<?=htmlspecialcharsbx($downloadUrl);?>"<?php endif;?>
							target="_blank"
							data-role="document-preview-download-docx"
							data-testid="crm-document-view-preview-download-docx"
							class="ui-btn --air ui-btn-xl ui-btn-no-caps --style-outline-accent-1 --with-left-icon crm__document-view--error-action crm__document-view--error-action-download"
							<?php if ($downloadUrl === ''): ?>hidden<?php endif;?>
						><span class="ui-btn-text"><?=Loc::getMessage('CRM_DOCUMENT_VIEW_TRANSFORM_ERROR_DOWNLOAD_DOCX');?></span></a>
					</div>
					<details class="crm__document-view--error-why">
						<summary class="ui-text --md crm__document-view--error-why-summary"><?=Loc::getMessage('CRM_DOCUMENT_VIEW_TRANSFORM_ERROR_WHY');?></summary>
						<p class="ui-text --md crm__document-view--error-why-text"><?=Loc::getMessage('CRM_DOCUMENT_VIEW_TRANSFORM_ERROR_WHY_DETAILS');?></p>
					</details>
				</div>
			</div>
			<div class="crm__document-view--upload crm__document-view--upload-img" id="crm__document-view--node"<?php
			if (!$arResult['isTransformationError'] && empty($arResult['pdfUrl'])):
				?> style="display: block;"<?php
			endif;?>>
				<div class="crm__document-view--upload-message">
					<div class="crm__document-view--upload-logo">
						<div class="ui-icon-set --document"></div>
					</div>
					<span class="crm__document-view--upload-message-text" id="crm__document-view--node-message" role="status"><?=Loc::getMessage('CRM_DOCUMENT_VIEW_PREVIEW_MESSAGE_PREPARE_MSGVER_1');?></span>
					<span class="crm__document-view--upload-detail" id="crm__document-view--node-detail" data-role="document-loader"><?=Loc::getMessage('CRM_DOCUMENT_VIEW_PREVIEW_MESSAGE_READY_MSGVER_1');?></span>
					<div class="crm__document-view--upload-progress" id="docs-progress-bar" data-role="document-progress"></div>

					<?php if ($arResult['baas']['fastTransform']['isAvailable']): ?>
						<div id="crm-document-speedup-in-placeholder" <?= $arResult['baas']['fastTransform']['isActive'] ? 'hidden' : '' ?>>
							<button class="crm__document-view--upload-btn" data-testid="crm-document-view-speedup-placeholder">
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
							'CRM_DOCUMENT_VIEW_COMPONENT_PROCESSED_NO_PDF_ERROR_MSGVER_1' => Loc::getMessage('CRM_DOCUMENT_VIEW_COMPONENT_PROCESSED_NO_PDF_ERROR_MSGVER_1'),
						],
						\Bitrix\Crm\Service\Container::getInstance()->getLocalization()->loadMessages(),
					);
					?>
					BX.message(<?= \Bitrix\Main\Web\Json::encode($messages) ?>);
					<?php if ($isInitialShell):?>
						BX.Crm.DocumentView.createDocument(<?= \Bitrix\Main\Web\Json::encode($arResult) ?>);
					<?php else:?>
						BX.Crm.DocumentView.init(<?=CUtil::PhpToJSObject($arResult);?>);
					<?php endif;?>
			});
		</script>
	</div>
	<div
		class="crm__document-view--sidebar-wrapper"
		data-testid="crm-document-view-sidebar"
		tabindex="0"
		role="region"
		aria-label="<?=htmlspecialcharsbx(Loc::getMessage('CRM_COMMON_DOCUMENT'));?>"
	>
		<div class="crm__document-view--sidebar crm__document-view--sidebar-channels" data-role="document-channel-selector">
			<div class="crm__document-view--channels">
				<?php if (!empty($arResult['channelSelectorParameters'])):?>
					<?php $APPLICATION->IncludeComponent(
						'bitrix:crm.channel.selector',
						'',
						$arResult['channelSelectorParameters'],
						$this->getComponent()
					);?>
				<?php else:
					$renderChannelsSkeleton();
				endif;?>
			</div>
		</div>
			<div class="crm__document-view--sidebar --company-information">
				<div class="crm__document-view--sidebar-section">
					<div
						class="crm__document-view--sidebar-control crm__document-view--sidebar-pending
							<?php
							if (empty($arResult['editTemplateUrl']) || empty($arResult['changeQrCodeEnabled'])):
								?> --disabled<?php
							endif;?>
							">
						<label class="crm__document-view--label" for="crm-document-qr"><?=Loc::getMessage('CRM_DOCUMENT_VIEW_QR');?></label>
						<input class="crm__document-view--checkbox" type="checkbox" id="crm-document-qr" data-testid="crm-document-view-qr"<?php
						if ($arResult['qrCodeEnabled']):
							?> checked<?php
						endif;
						if (empty($arResult['editTemplateUrl']) || empty($arResult['changeQrCodeEnabled'])):
							?> disabled<?php
						endif;?>>
						<?php $renderPendingSkeleton(['104px', '9px']);?>
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
						'document-my-company-requisite',
					);
				?>
					<?php if (Driver::getInstance()->getUserPermissions()->canModifyDocuments()):?>
						<div class="crm__document-view--sidebar-control --in-details crm__document-view--sidebar-pending">
							<label class="crm__document-view--label" type="text" for="crm-document-stamp"><?=Loc::getMessage('CRM_DOCUMENT_VIEW_SIGN_AND_STAMP');?></label>
							<input class="crm__document-view--checkbox" type="checkbox" id="crm-document-stamp" data-testid="crm-document-view-stamp"<?php
							if ($arResult['stampsEnabled'] && $arResult['changeStampsEnabled']):
								?> checked<?php
							endif;
							if (empty($arResult['editTemplateUrl']) || empty($arResult['changeStampsEnabled'])):
								?> disabled<?php
							endif;?>>
							<?php $renderPendingSkeleton(['110px', '9px']);?>
						</div>
					<?php endif;?>
				</div>
				<div class="crm__document-view--sidebar-section">
				<?php
					$renderRequisiteSection(
						Loc::getMessage('CRM_COMMON_CLIENT'),
						$arResult['clientRequisites'],
						'document-client-requisite',
					);
				?></div>
				<?php if ($arResult['isSigningEnabled'] ?? false):
					echo \Bitrix\Crm\Tour\Sign\SignDocumentFromSlider::getInstance()->build();
				endif;?>
					<div class="crm__document-view--sidebar-section" data-role="document-sign-section"<?php
					if (empty($arResult['isSigningEnabled'])):
						?> hidden<?php
					endif;?>>
						<div class="crm__document-view--sidebar-control" id="crm-document-sign" data-testid="crm-document-view-sign">
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
			</div>
			<?php if ($arResult['baas']['fastTransform']['isAvailable']): ?>
					<div class="crm__document-view--speed-btn crm__document-view--sidebar-pending" id="crm-document-speedup-in-sidebar" data-testid="crm-document-view-speedup-sidebar"<?php
					if (!$isInitialShell && empty($arResult['editDocumentUrl'])):
						?> hidden<?php
					endif;?>>
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
						<?php $renderPendingSkeleton(['186px']);?>
					</div>
			<?php endif; ?>
			<?php if ($isInitialShell || !empty($arResult['editDocumentUrl'])):?>
				<div class="crm__document-view--link-inner">
					<div class="crm__document-view--link-block crm__document-view--sidebar-pending">
						<span class="crm__document-view--link-text<?php
						if (empty($arResult['editDocumentUrl'])):
							?> --disabled<?php
						endif;?>" id="crm-document-edit-document" data-testid="crm-document-view-edit-document"><?=Loc::getMessage('CRM_DOCUMENT_VIEW_EDIT_DOCUMENT');?></span>
						<?php $renderPendingSkeleton(['166px']);?>
					</div>
				</div>
			<?php endif;?>
			<?php if ($isInitialShell || !is_bool($arResult['editTemplateUrl'])):?>
				<div class="crm__document-view--link-inner">
					<div class="crm__document-view--link-block crm__document-view--sidebar-pending">
						<span class="crm__document-view--link-text<?php
						if (empty($arResult['editTemplateUrl'])):
							?> --disabled<?php
						endif;?>" id="crm-document-edit-template" data-testid="crm-document-view-edit-template"><?=Loc::getMessage('CRM_DOCUMENT_VIEW_EDIT_TEMPLATE');?></span>
						<?php $renderPendingSkeleton(['174px']);?>
					</div>
				</div>
			<?php endif;?>
			<?php if (isset($arResult['publicUrlView']['time'])):?>
				<div class="crm__document-view--sidebar crm__document-view--sidebar-details">
					<div class="crm__document-view--public-view-info">
						<?=Loc::getMessage('CRM_DOCUMENT_VIEW_PUBLIC_URL_VIEWED_TIME', [
							'#TIME#' => $arResult['publicUrlView']['time'],
						]);?>
					</div>
				</div>
			<?php endif;?>
		</div>
	</div>
