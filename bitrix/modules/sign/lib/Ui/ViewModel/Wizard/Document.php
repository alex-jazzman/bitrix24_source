<?php

namespace Bitrix\Sign\Ui\ViewModel\Wizard;

use Bitrix\Main\Type\Contract\Arrayable;
use Bitrix\Sign\Service\Container;
use Bitrix\Sign\Service\Sign\BlankService;
use Bitrix\Sign\Type\ProviderCode;

final class Document implements Arrayable
{
	private \Bitrix\Sign\Item\Document $document;
	private readonly BlankService $blankService;

	public function __construct(\Bitrix\Sign\Item\Document $document)
	{
		$this->document = $document;
		$this->blankService = Container::instance()->getSignBlankService();
	}

	public function toArray(): array
	{
		return [
			'id' => $this->document->id,
			'blankId' => $this->document->blankId,
			'entityId' => $this->document->entityId,
			'entityType' => $this->document->entityType,
			'entityTypeId' => $this->document->entityTypeId,
			'initiator' => $this->document->initiator,
			'langId' => $this->document->langId,
			'parties' => $this->document->parties,
			'resultFileId' => $this->document->resultFileId,
			'scenario' => $this->document->scenario,
			'status' => $this->document->status,
			'title' => $this->document->title,
			'uid' => $this->document->uid,
			'version' => $this->document->version,
			'createdById' => $this->document->createdById,
			'companyEntityId' => $this->document->companyEntityId,
			'companyUid' => $this->document->companyUid,
			'representativeId' => $this->document->representativeId,
			'scheme' => $this->document->scheme,
			'dateCreate' => $this->document->dateCreate,
			'dateSign' => $this->document->dateSign,
			'regionDocumentType' => $this->document->regionDocumentType,
			'externalId' => $this->document->externalId,
			'stoppedById' => $this->document->stoppedById,
			'externalDateCreate' => $this->document->externalDateCreate?->format('Y-m-d'),
			'providerCode' => $this->document->providerCode ? ProviderCode::toRepresentativeString($this->document->providerCode) : null,
			'templateId' => $this->document->templateId,
			'chatId' => $this->document->chatId,
			'groupId' => $this->document->groupId,
			'createdFromDocumentId' => $this->document->createdFromDocumentId,
			'initiatedByType' => $this->document->initiatedByType,
			'hcmLinkCompanyId' => $this->document->hcmLinkCompanyId,
			'dateStatusChanged' => $this->document->dateStatusChanged,
			'dateSignUntil' => $this->document->dateSignUntil,
			'previewUrl' => $this->blankService->getPreviewUrl((int)$this->document->blankId),

			'externalDateCreateSourceType' => $this->document->externalDateCreateSourceType,
			'hcmLinkDateSettingId' => $this->document->hcmLinkDateSettingId,
			'externalIdSourceType' => $this->document->externalIdSourceType->value,
			'hcmLinkExternalIdSettingId' => $this->document->hcmLinkExternalIdSettingId,
			'hcmLinkDocumentTypeSettingId' => $this->document->hcmLinkDocumentTypeSettingId,
		];
	}
}
