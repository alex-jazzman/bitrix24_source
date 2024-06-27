<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) {
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

Extension::load([
    "ui.buttons",
    "ui.buttons.icons",
    "ui.alerts",
    "ui.design-tokens",
    "ui.fonts.opensans",
    "ui.progressround",
    "ui.viewer",
    "ui.notification",
    "ui.info-helper",
    "loader",
    "popup",
    "sidepanel",
    "documentpreview",
    "ui.icons.disk",
]);
// Asset::getInstance()->addJs('/bitrix/js/crm/activity.js');

$downloadButtonOptions = \CUserOptions::GetOption('hms.document.view', 'download_button', []);
$defaultDownloadFormat = in_array(mb_strtolower($downloadButtonOptions['format'] ?? ''), ['doc', 'pdf'], true)
    ? mb_strtolower($downloadButtonOptions['format'])
    : 'pdf';

$isSigningEnabledInCurrentTariff = (bool)($arResult['isSigningEnabledInCurrentTariff'] ?? false);

if ($isSigningEnabledInCurrentTariff) {
    Extension::load([
        'sign.v2.ui.tokens',
        'sign.v2.wizard',
    ]);
}

$APPLICATION->IncludeComponent("bitrix:bitrix24.limit.lock", "", array());

$this->IncludeLangFile();
if ($arParams['IS_SLIDER']) :
    $APPLICATION->RestartBuffer();
?>
    <!DOCTYPE html>
    <html lang="<?= LANGUAGE_ID; ?>">

    <head>
        <script data-skip-moving="true">
            // Prevent loading page without header and footer
            if (window === window.top) {
                window.location = "<?= CUtil::JSEscape((new \Bitrix\Main\Web\Uri(\Bitrix\Main\Application::getInstance()->getContext()->getRequest()->getRequestUri()))->deleteParams(['IFRAME', 'IFRAME_TYPE'])); ?>" + window.location.hash;
            }
        </script>
        <?php $APPLICATION->ShowHead(); ?>
    </head>

    <body class="hms__document-view--slider-wrap">
        <div class="hms__document-view--title">
            <div class="hms__document-view--container-docs-preview">
                <div class="pagetitle hms__document-view--pagetitle">
                    <span id="pagetitle" class="pagetitle-item hms__document-view--pagetitle-item"><?= htmlspecialcharsbx($arResult['title']); ?></span>
                </div>
                <div class="hms__document-view--buttons">
                    <button class="ui-btn ui-btn-md ui-btn-light-border ui-btn-icon-print" id="hms-document-print"></button>
                    <?php if (Bitrix24Manager::isEnabled()) :
                    ?><button class="ui-btn ui-btn-md ui-btn-light-border" onclick="BX.DocumentGenerator.Feedback.open('<?= htmlspecialcharsbx(CUtil::JSEscape($arResult['PROVIDER'])); ?>', '<?= htmlspecialcharsbx(CUtil::JSEscape($arResult['TEMPLATE_NAME'])); ?>', '<?= htmlspecialcharsbx(CUtil::JSEscape($arResult['TEMPLATE_CODE'])); ?>');"><?= Loc::getMessage('HMS_DOCUMENT_VIEW_FEEDBACK'); ?></button>
                    <?php endif; ?>
                    <div class="ui-btn-split ui-btn-light-border hms__document-view--btn-icon-<?= mb_strtolower($defaultDownloadFormat) ?>" id="hms-document-download">
                        <button class="ui-btn-main">
                            <span class="ui-btn-text"><?= Loc::getMessage('HMS_COMMON_ACTION_DOWNLOAD'); ?></span>
                        </button>
                        <button class="ui-btn-menu"></button>
                    </div>
                </div>
            </div>
        </div>
    <?php
else :
    $APPLICATION->SetTitle($arResult['title']);
endif;

$shouldDisplayTransformationError =
    !empty($arResult['transformationErrorMessage'])
    && ($arResult['isDisplayTransformationErrors'] ?? true);

    ?>
    <div class="hms__document-view--wrap">
        <div class="hms__document-view--inner hms__document-view--inner-slider">
            <div class="ui-alert ui-alert-danger ui-alert-icon-danger ui-alert-text-center" id="hms-document-view-error" <?php
                                                                                                                            if (!empty($arResult['ERRORS']) || $shouldDisplayTransformationError) :
                                                                                                                            ?> style="display: block;" <?php endif; ?>>
                <span class="ui-alert-message" id="hms-document-view-error-message">
                    <?php if (!empty($arResult['ERRORS']) && is_array($arResult['ERRORS'])) :
                        foreach ($arResult['ERRORS'] as $error) :
                            echo htmlspecialcharsbx($error);
                            echo '<br />';
                        endforeach;
                    elseif ($shouldDisplayTransformationError) :
                        echo htmlspecialcharsbx($arResult['transformationErrorMessage']);
                    endif; ?></span>
                <span class="ui-alert-close-btn" onclick="BX.hide(BX('hms-document-view-error'));"></span>
            </div>
            <?php if (!$arResult['ERRORS']) : ?>
                <div class="hms__document-view--img">
                    <div class="hms__document-view--error" id="hms__document-view--transform-error" <?php if ($arResult['isTransformationError'] && !$arResult['pdfUrl']) : ?> style="display: block;" <?php endif; ?>>
                        <div class="hms__document-view--error-message">
                            <span class="hms__document-view--error-message-text"><?= Loc::getMessage('HMS_DOCUMENT_VIEW_TRANSFORM_ERROR'); ?></span>
                            <span class="hms__document-view--error-message-text"><?= Loc::getMessage('HMS_DOCUMENT_VIEW_TRY_LATER'); ?></span>
                            <span><a onclick="location.reload();" class="hms__document-view--link-pointer"><?= Loc::getMessage('HMS_DOCUMENT_VIEW_TRY_AGAIN'); ?></a></span>
                        </div>
                        <div class="hms__document-view--error-img"></div>
                    </div>
                    <div class="hms__document-view--upload hms__document-view--upload-img" id="hms__document-view--node" <?php if (!$arResult['isTransformationError'] && !$arResult['pdfUrl']) : ?> style="display: block;" <?php endif; ?>>
                        <div class="hms__document-view--upload-message">
                            <span class="hms__document-view--upload-message-text" id="hms__document-view--node-message"><?= Loc::getMessage('HMS_DOCUMENT_VIEW_PREVIEW_MESSAGE_PREPARE'); ?></span>
                            <div class="hms__document-view--upload-progress" id="docs-progress-bar"></div>
                            <span class="hms__document-view--upload-detail" id="hms__document-view--node-detail"><?= Loc::getMessage('HMS_DOCUMENT_VIEW_PREVIEW_MESSAGE_READY'); ?></span>
                        </div>
                    </div>
                    <div class="hms__document-view--pdf" id="hms-document-pdf" data-viewer-type="document"></div>
                </div>
                <script>
                    BX.ready(function() {
                        <?php
                        $messages = array_merge(Loc::loadLanguageFile(__FILE__), [
                            'HMS_DOCUMENT_VIEW_COMPONENT_PROCESSED_NO_PDF_ERROR' => Loc::getMessage('HMS_DOCUMENT_VIEW_COMPONENT_PROCESSED_NO_PDF_ERROR'),
                        ]);
                        echo 'BX.message(' . \CUtil::PhpToJSObject($messages) . ');' ?>
                        BX.MyWebstor.Hms.DocumentView.init(<?= CUtil::PhpToJSObject($arResult); ?>);
                    });
                </script>
            <?php endif; ?>
        </div>
        <?php if (!$arResult['ERRORS']) : ?>
            <div class="hms__document-view--sidebar-wrapper">
                <?php if ($arResult['editDocumentUrl']) : ?>
                    <div class="hms__document-view--link-inner">
                        <div class="hms__document-view--link-block">
                            <span class="hms__document-view--link-text" id="hms-document-edit-document"><?= Loc::getMessage('HMS_DOCUMENT_VIEW_EDIT_DOCUMENT'); ?></span>
                        </div>
                    </div>
                <?php endif;
                if (!is_bool($arResult['editTemplateUrl'])) : ?>
                    <div class="hms__document-view--link-inner">
                        <div class="hms__document-view--link-block">
                            <span class="hms__document-view--link-text" id="hms-document-edit-template"><?= Loc::getMessage('HMS_DOCUMENT_VIEW_EDIT_TEMPLATE'); ?></span>
                        </div>
                    </div>
                <?php endif;
                if (isset($arResult['publicUrlView']['time'])) : ?>
                    <div class="hms__document-view--sidebar hms__document-view--sidebar-details">
                        <div class="hms__document-view--public-view-info">
                            <?= Loc::getMessage('HMS_DOCUMENT_VIEW_PUBLIC_URL_VIEWED_TIME', [
                                '#TIME#' => $arResult['publicUrlView']['time'],
                            ]); ?>
                        </div>
                    </div>
                <?php endif; ?>
            </div>
        <?php endif; ?>
    </div>
    <?php if ($arParams['IS_SLIDER']) : ?>
    </body>

    </html>
<?php
        \CMain::FinalActions();
    endif;
