<?php

use Bitrix\Main\Error;
use Bitrix\Main\Localization\Loc;

if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

\Bitrix\Main\Loader::includeModule('crm');
Loc::loadMessages(__FILE__);

class CrmSignDocumentViewComponent extends Bitrix\Crm\Component\Base
{
	public function onPrepareComponentParams($arParams): array
	{
		$this->fillParameterFromRequest('documentId', $arParams);

		return parent::onPrepareComponentParams($arParams);
	}

	protected function init(): void
	{
		parent::init();
		if ($this->getErrors())
		{
			return;
		}

		if (!$this->isIframe())
		{
			// todo redirect ?
			return;
		}

		$this->getApplication()->SetTitle(Loc::getMessage('CRM_SIGNDOCUMENT_VIEW_TITLE'));

		if (!\Bitrix\Crm\Settings\Crm::isDocumentSigningEnabled())
		{
			$this->errorCollection[] = new \Bitrix\Main\Error('Document signing is not enabled');
			return;
		}

		$documentId = $this->arParams['documentId'] ?? null;

		if (!$documentId)
		{
			$this->errorCollection[] = new \Bitrix\Main\Error(Loc::getMessage('CRM_SIGNDOCUMENT_TRY_AGAIN_LATER'));
			return;
		}

		$document = Bitrix\Sign\Document::getById($documentId);

		if (!$document->getInitiatorMember())
		{
			$this->errorCollection[] = new \Bitrix\Main\Error(Loc::getMessage('CRM_SIGNDOCUMENT_TRY_AGAIN_LATER'));
			return;
		}
		$documentHash = $document->getHash();
		$memberHash = $this->arParams['memberHash'] ?? null;

		$data = [
			'documentHash' => $document->getHash(),
			'secCode' => $document->getSecCode(),
		];

		if (!$this->arParams['memberHash'] && !$document->isAllMembersSigned())
		{
			foreach ($document->getMembers() as $member) {
				if ($document->isSignedByMember($member->getHash()))
				{
					$memberHash = $member->getHash();
				}
			}
		}

		if (!$memberHash && !$document->isAnyMembersSigned())
		{
			$memberHash = $document->getInitiatorMember()->getHash();
		}

		if ($memberHash)
		{
			$data['memberHash'] = $memberHash;
		}

		$status = \Bitrix\Sign\Proxy::sendCommand('document.file.getStatus',
			$data
		)['status'];

		if ($status != 'exists')
		{
			$this->errorCollection[] = new \Bitrix\Main\Error(Loc::getMessage('CRM_SIGNDOCUMENT_TRY_AGAIN_LATER'));
			return;
		}

		$basePath = '/bitrix/services/main/ajax.php?action=sign.document.getFileForSrc&documentHash=%s';
		$this->arResult['pdfSource'] = $memberHash
			? sprintf(
				$basePath.'&memberHash=%s',
				$documentHash,
				$memberHash
			)
			: sprintf(
				$basePath,
				$documentHash
			)
		;
	}

	public function executeComponent(): void
	{
		$this->init();
		if ($this->getErrors())
		{
			$this->showErrors();
			return;
		}
		$this->initToolbar();
		$this->includeComponentTemplate();
	}

	protected function showErrors()
	{
		if(count($this->errorCollection) <= 0)
		{
			return;
		}

		$this->arResult['ERRORS'][] = $this->errorCollection->getValues()[0]->getMessage();
		$this->includeComponentTemplate('unavailable');
	}

	protected function initToolbar(): void
	{
		$printButton = (new \Bitrix\UI\Buttons\Button())
			->setIcon(\Bitrix\UI\Buttons\Icon::PRINT)
			->setColor(\Bitrix\UI\Buttons\Color::LIGHT_BORDER)
		;
		$this->arResult['printButtonId'] = $printButton->getUniqId();

		$downloadButton = (new \Bitrix\UI\Buttons\Button())
			->setText(Loc::getMessage('CRM_SIGNDOCUMENT_VIEW_DOCUMENT_DOWNLOAD'))
			->setColor(\Bitrix\UI\Buttons\Color::LIGHT_BORDER)
		;
		$this->arResult['downloadButtonId'] = $downloadButton->getUniqId();

		\Bitrix\UI\Toolbar\Facade\Toolbar::addButton($printButton);
		\Bitrix\UI\Toolbar\Facade\Toolbar::addButton($downloadButton);
	}
}
