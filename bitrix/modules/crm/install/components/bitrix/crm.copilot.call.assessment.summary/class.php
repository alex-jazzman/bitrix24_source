<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Crm\Component\Base;
use Bitrix\Crm\Copilot\CallAssessment\Summary\SettingsRepository;
use Bitrix\Crm\Integration\AI\AIManager;
use Bitrix\Crm\Integration\Bitrix24Manager;
use Bitrix\Crm\Service\Container;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\UserTable;

class CrmCopilotCallAssessmentSummaryComponent extends Base
{
	public function executeComponent(): void
	{
		Container::getInstance()->getLocalization()->loadMessages();

		if (!Bitrix24Manager::isFeatureEnabled(AIManager::AI_COPILOT_FEATURE_NAME))
		{
			$this->includeComponentTemplate('restrictions');

			return;
		}

		if (
			!AIManager::isAiCallProcessingEnabled()
			|| !AIManager::isCallScoringV2Enabled()
			|| !Container::getInstance()->getUserPermissions()->copilotCallAssessment()->canEdit()
		)
		{
			$this->showError();

			return;
		}

		$settings = (new SettingsRepository())->load();
		$this->arResult['settings'] = $settings->toArray();
		$this->arResult['recipients'] = $this->prepareRecipients($settings->recipientUserIds);

		$this->includeComponentTemplate();
	}

	private function showError(): void
	{
		$this->getApplication()->IncludeComponent(
			'bitrix:ui.info.error',
			'',
			[
				'TITLE' => Loc::getMessage('CRM_COMMON_ERROR_ACCESS_DENIED'),
				'DESCRIPTION' => '',
			],
		);
	}

	/**
	 * @param int[] $userIds
	 *
	 * @return array<int, array{id:int, name:string, avatar:string|null}>
	 */
	private function prepareRecipients(array $userIds): array
	{
		if (empty($userIds))
		{
			return [];
		}

		$rows = UserTable::query()
			->setSelect(['ID', 'NAME', 'LAST_NAME', 'LOGIN', 'PERSONAL_PHOTO'])
			->whereIn('ID', $userIds)
			->where('ACTIVE', 'Y')
			->fetchAll()
		;

		$result = [];
		foreach ($rows as $row)
		{
			$fullName = trim(($row['NAME'] ?? '') . ' ' . ($row['LAST_NAME'] ?? ''));

			$avatar = null;
			if (!empty($row['PERSONAL_PHOTO']))
			{
				$file = \CFile::resizeImageGet(
					(int)$row['PERSONAL_PHOTO'],
					['width' => 100, 'height' => 100],
					BX_RESIZE_IMAGE_EXACT,
					false,
				);
				$avatar = !empty($file['src']) ? $file['src'] : null;
			}

			$result[] = [
				'id' => (int)$row['ID'],
				'name' => $fullName !== '' ? $fullName : (string)($row['LOGIN'] ?? ('User #' . (int)$row['ID'])),
				'avatar' => $avatar,
			];
		}

		return $result;
	}
}
