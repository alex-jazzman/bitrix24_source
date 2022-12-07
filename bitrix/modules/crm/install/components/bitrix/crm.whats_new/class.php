<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Main\UI\Extension;

class CrmWhatsNewComponent extends \CBitrixComponent
{
	public function __construct($component = null)
	{
		parent::__construct($component);

		Extension::load(['ui.dialogs.whats-new']);
	}

	/**
	 * @return $this
	 */
	protected function prepareParams()
	{
		if (empty($this->arParams['SEF_MODE']))
		{
			$this->arParams['SEF_MODE'] = 'N';
		}

		return $this;
	}

	public function executeComponent()
	{
		if ($this->isAjaxRequest())
		{
			return;
		}

		$this->includeComponentTemplate();
	}

	private function isAjaxRequest(): bool
	{
		return $this->request->isAjaxRequest();
	}
}
