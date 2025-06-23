<?php

namespace Bitrix\Crm\RepeatSale\Widget;

use Bitrix\Bitrix24\LicenseScanner\Manager;
use Bitrix\Crm\Service\Container;
use Bitrix\Crm\Tour\Config;
use Bitrix\Crm\Traits\Singleton;
use Bitrix\Main\Loader;
use Bitrix\Main\Web\Json;
use CBitrix24;

final class WidgetManager
{
	use Singleton;

	public function showBanner(): void
	{
		$widgetConfig = $this->getWidgetConfig();
		if ($widgetConfig === null)
		{
			return;
		}

		$type = $widgetConfig['type'] ?? null;
		$executeImmediately = $widgetConfig['executeImmediately'] ?? false;
		$showConfetti = $widgetConfig['showConfetti'] ?? false;

		$params = Json::encode([
			'showConfetti' => $showConfetti,
		]);

		if ($type && $executeImmediately):
			?>
			<script>
			BX.ready(
				() => {
					const target = document.querySelector('[data-id="crm-repeat-sale-widget-button"]');
					BX.Crm.RepeatSale.Widget.execute(
						'<?= $type ?>',
						target,
						<?= $params ?>
					);
				}
			);
		</script>
		<?php
		endif;
	}

	public function getWidgetConfig(): ?array
	{
		$availabilityChecker = Container::getInstance()->getRepeatSaleAvailabilityChecker();
		if (!$availabilityChecker->isAvailable() || !$availabilityChecker->hasPermission())
		{
			return null;
		}

		$isEnablePending = $availabilityChecker->isEnablePending();
		$repeatSalePermission = Container::getInstance()->getUserPermissions()->repeatSale();
		if ($isEnablePending)
		{
			if (!$repeatSalePermission->canEdit())
			{
				return null;
			}

			$isNeedShowStartBanner = (new StartBanner())->isNeedShowImmediately();

			return [
				'type' => 'start',
				'executeImmediately' => $isNeedShowStartBanner && !Config::isToursDeactivated('crm.tour'),
			];
		}

		if ($repeatSalePermission->canRead())
		{
			$isNeedShowConfetti = (new Confetti())->isNeedShowConfetti();

			return [
				'type' => 'statistics',
				'executeImmediately' => $isNeedShowConfetti && !Config::isToursDeactivated('crm.tour'),
				'showConfetti' => $isNeedShowConfetti,
			];
		}

		return null;
	}

	public function getFeedbackFormParams(): array
	{
		if (!Loader::includeModule('bitrix24'))
		{
			return [];
		}

		$licenseScanner = Manager::getInstance();
		if ($licenseScanner->shouldLockPortal())
		{
			return [];
		}

		$defaultParams = [826, 'ma3ms9'];

		return match (CBitrix24::getLicensePrefix())
		{
			'ru' => [818, 'vgluix'],
			'en' => $defaultParams,
			'de' => [824, 'c59bdw'],
			'br' => [820, '2a9g49'],
			'es' => [822, '9e9sm1'],
			default => $defaultParams,
		};
	}
}
