<?php

use Bitrix\DocumentGenerator\Components\ViewComponent;
use Bitrix\DocumentGenerator\CreationMethod;
use Bitrix\DocumentGenerator\Driver;
use Bitrix\DocumentGenerator\Integration\Bitrix24Manager;
use Bitrix\Main\Application;
use Bitrix\Main\Loader;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\Web\Uri;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) die();

if (!Loader::includeModule('documentgenerator')) {
    die('Module documentgenerator is not installed');
}

Loc::loadMessages(__FILE__);

class HmsDocumentViewComponent extends ViewComponent {
    public function executeComponent() {
        if (!$this->includeModules()) {
            ShowError(Loc::getMessage('HMS_DOCUMENT_VIEW_COMPONENT_MODULE_ERROR'));
            return;
        }
        if ($this->arParams['MODE'] === 'change' && !check_bitrix_sessid()) {
            ShowError(Loc::getMessage('HMS_DOCUMENT_VIEW_COMPONENT_CSRF_ERROR'));
            return;
        }
        $result = $this->initDocument();
        if (!$result->isSuccess()) {
            $this->arResult['ERRORS'] = $result->getErrorMessages();
            $this->includeComponentTemplate();
            return;
        }
        if ($this->document->ID > 0 && $this->arParams['MODE'] === 'edit') {
            if (!Driver::getInstance()->getUserPermissions()->canModifyDocument($this->document)) {
                $this->arResult['ERRORS'] = [Loc::getMessage('DOCGEN_DOCUMENT_VIEW_ACCESS_ERROR')];
                $this->includeComponentTemplate();
                return;
            }
            $this->arResult['FIELDS'] = $this->document->getFields([], true, true);
            $this->includeComponentTemplate('edit');
            return;
        }
        if (!$this->document->ID && Bitrix24Manager::isEnabled() && Bitrix24Manager::isDocumentsLimitReached()) {
            $this->includeComponentTemplate('limit');
            return;
        }
        $isNewDocument = true;
        if ($this->document->ID > 0) {
            $isNewDocument = false;
        }
        if (
            $this->arParams['MODE'] === 'change'
            && !$isNewDocument
        ) {
            $result = $this->document->update($this->arParams['VALUES']);
        } else {
            if ($isNewDocument) {
                CreationMethod::markDocumentAsCreatedByPublic($this->document);
            }
            $isSendToTransformation = !$this->document->PDF_ID;
            $result = $this->document->getFile($isSendToTransformation);
        }
        $this->arResult = $result->getData();
        if (
            $isSendToTransformation
            && !empty($this->arResult['transformationCancelReason'])
            && $this->arResult['transformationCancelReason'] instanceof \Bitrix\Main\Error
            && $this->arResult['transformationCancelReason']->getCode() === 'TRANSFORM_FORMATS_PROCESSED'
        ) {
            $this->arResult['isTransformationError'] = true;
            $this->arResult['transformationErrorMessage'] = Loc::getMessage('HMS_DOCUMENT_VIEW_COMPONENT_PROCESSED_NO_PDF_ERROR');
        }
        if (!$result->isSuccess()) {
            if ($this->arResult['isTransformationError'] !== true) {
                $this->arResult['ERRORS'] = $result->getErrorMessages();
            }
        }
        $this->arResult['isDisplayTransformationErrors'] = true;
        if ($isNewDocument) {
            $this->arResult['documentUrl'] = $this->getDocumentUrl();
        }
        $this->arResult['values'] = $this->arParams['VALUES'];
        $this->arResult['editTemplateUrl'] = $this->getEditTemplateUrl();
        if ($this->arResult['editTemplateUrl']) {
            $this->arResult['editDocumentUrl'] = $this->getEditDocumentUrl();
        }
        $this->arResult['myCompanyRequisites'] = [
            'title' => Loc::getMessage('HMS_COMMON_EMPTY_VALUE'),
            'link' => null,
            'subTitle' => '',
        ];
        $this->arResult['clientRequisites'] = [
            'title' => Loc::getMessage('HMS_COMMON_EMPTY_VALUE'),
            'link' => null,
            'subTitle' => '',
        ];
        $provider = $this->document->getProvider();
        if ($provider) {
            $this->arResult['PROVIDER'] = get_class($provider);
        } else {
            $this->arResult['PROVIDER'] = '';
        }
        $this->arResult['TEMPLATE_NAME'] = '';
        $this->arResult['TEMPLATE_CODE'] = '';
        if ($this->template) {
            $this->arResult['TEMPLATE_NAME'] = $this->template->NAME;
            $this->arResult['TEMPLATE_CODE'] = $this->template->CODE;
        }

        $this->arResult['isSigningEnabledInCurrentTariff'] = false;
        $this->arResult['signingInfoHelperSliderCode'] = 'limit_crm_sign_integration'; //stay

        $this->includeComponentTemplate();
    }

    /**
     * @return string
     */
    protected function getModule() {
        return 'mywebstor.hms';
    }

    /**
     * @return string|false
     */
    protected function getEditDocumentUrl() {
        $uri = new Uri(Application::getInstance()->getContext()->getRequest()->getRequestUri());

        return $uri->deleteParams(['mode', 'templateId', 'values', 'value', 'provider'])
            ->addParams(['documentId' => $this->document->ID, 'mode' => 'edit'])
            ->getLocator();
    }

    /**
     * @param bool $docx
     * @return int
     */
    protected function getEmailDiskFile($docx = false): int {
        $result = 0;

        if ($this->document) {
            $result = $this->document->getEmailDiskFile($docx);
        }

        return $result;
    }

    /**
     * @return string
     */
    protected function getDocumentUrl(): string {
        $uri = new Uri(Application::getInstance()->getContext()->getRequest()->getRequestUri());

        return $uri->deleteParams(['mode', 'templateId', 'values', 'value', 'provider'])
            ->addParams(['documentId' => $this->document->ID])
            ->getLocator();
    }

    /**
     * @return bool|string
     */
    protected function getEditTemplateUrl() {
        if ($this->template && !$this->template->isDeleted()) {
            $addPath = '/hms/documents/templates/';
            $addUrl = new Uri($addPath);

            if ($addUrl) {
                $editUrl = new Uri($addUrl->getLocator());
                $editUrl->addParams([
                    'ID' => $this->template->ID,
                    'UPLOAD' => 'Y',
                ]);

                return $editUrl->getLocator();
            }
        }

        return false;
    }
}
