<?

use Bitrix\Main\Config\Option;
use Bitrix\Main\Loader;
use Bitrix\Main\ModuleManager;

if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

class IntranetReleaseComponent extends \CBitrixComponent implements \Bitrix\Main\Engine\Contract\Controllerable
{
	protected string $id = 'vega';
	protected array $releaseMap = [
		'ru' => ['https://vega.bitrix24.tech/slider/', '17.11.2023 10:00'],
		'by' => ['https://vega.bitrix24promo.by/slider/', '17.11.2023 10:00'],
		'kz' => ['https://vega.bitrix24kz.works/slider/', '17.11.2023 10:00'],

		'uk' => ['https://www.bitrix24.uk/promo/fall-2023-release-slider/', '29.11.2023 13:00'],
		'in' => ['https://www.bitrix24.in/promo/fall-2023-release-slider/', '29.11.2023 11:00'],
		'eu' => ['https://www.bitrix24.eu/promo/fall-2023-release-slider/', '29.11.2023 13:00'],
		'br' => ['https://www.bitrix24.com.br/promo/fall-2023-release-slider/', '29.11.2023 17:00'],
		'la' => ['https://www.bitrix24.es/promo/fall-2023-release-slider/', '29.11.2023 14:00'],
		'mx' => ['https://www.bitrix24.mx/promo/fall-2023-release-slider/', '29.11.2023 18:00'],
		'co' => ['https://www.bitrix24.co/promo/fall-2023-release-slider/', '29.11.2023 18:00'],
		'tr' => ['https://www.bitrix24.com.tr/promo/fall-2023-release-slider/', '29.11.2023 12:00'],
		'fr' => ['https://www.bitrix24.fr/promo/fall-2023-release-slider/', '29.11.2023 12:00'],
		'it' => ['https://www.bitrix24.it/promo/fall-2023-release-slider/', '29.11.2023 16:00'],
		'pl' => ['https://www.bitrix24.pl/promo/fall-2023-release-slider/', '29.11.2023 16:00'],
		'de' => ['https://www.bitrix24.de/promo/fall-2023-release-slider/', '29.11.2023 15:00'],

		'en' => ['https://www.bitrix24.com/promo/fall-2023-release-slider/', '29.11.2023 13:00'],
		'cn' => ['https://www.bitrix24.com/promo/fall-2023-release-slider/', '29.11.2023 11:00'],
		'vn' => ['https://www.bitrix24.com/promo/fall-2023-release-slider/', '29.11.2023 11:00'],
		'jp' => ['https://www.bitrix24.com/promo/fall-2023-release-slider/', '29.11.2023 11:00'],
		'id' => ['https://www.bitrix24.com/promo/fall-2023-release-slider/', '29.11.2023 11:00'],
	];

	public function __construct($component = null)
	{
		parent::__construct($component);
	}

	public function executeComponent()
	{
		if (!ModuleManager::isModuleInstalled('bitrix24') || (defined('ERROR_404') && ERROR_404 ==='Y'))
		{
			return;
		}

		$this->arResult['show_time'] = false;
		$this->arResult['mode'] = '';

		if ($this->shouldShow())
		{
			$this->arResult['show_time'] = true;
			$this->arResult['options'] = $this->getOptions();

			// First set a new theme
			if ($this->getSliderModeCnt() === -1)
			{
				$this->incSliderModeCnt();
				if ($this->setDefaultTheme())
				{
					if (Loader::includeModule('intranet'))
					{
						\Bitrix\Intranet\Composite\CacheProvider::deleteUserCache();
					}

					LocalRedirect($GLOBALS['APPLICATION']->getCurUri());
				}
			}

			// Show Slider for the first hit
			if ($this->getSliderModeCnt() === 0)
			{
				$this->arResult['mode'] = 'slider';
				$this->incSliderModeCnt();
			}
			else if ($this->getSliderModeCnt() === 1)
			{
				// Repeat after one day
				$lastShowTime = $this->getLastShowTime();
				if ((time() - $lastShowTime) > 24 * 3600)
				{
					$this->arResult['mode'] = 'slider';
					$this->incSliderModeCnt();
				}
			}
		}

		$this->includeComponentTemplate();
	}

	protected function getZone(): ?string
	{
		if (Loader::includeModule('bitrix24'))
		{
			return \CBitrix24::getPortalZone();
		}

		return null;
	}

	protected static function createDate(string $date): int
	{
		$time = \DateTime::createFromFormat('d.m.Y H:i', $date, new \DateTimeZone('Europe/Moscow'));

		return $time->getTimestamp();
	}

	protected function shouldShow(): bool
	{
		$release = $this->getRelease();
		if (!$release)
		{
			return false;
		}

		$now = time();
		$startDate = static::createDate($release['releaseDate']);
		$endDate = $startDate + 24 * 3600 * 14;
		if ($now < $startDate || $now > $endDate)
		{
			return false;
		}

		if (Loader::includeModule('extranet') && \CExtranet::isExtranetSite())
		{
			return false;
		}

		if ($this->isDeactivated())
		{
			return false;
		}

		if (Loader::includeModule('bitrix24'))
		{
			$creationTime = intval(\CBitrix24::getCreateTime());
			if ($creationTime === 0 || $creationTime > $startDate)
			{
				return false;
			}
		}

		$spotlight = new \Bitrix\Main\UI\Spotlight("release_{$this->id}");
		$spotlight->setUserTimeSpan(3600 * 24 * 14);
		$isAvailable = $spotlight->isAvailable();
		if (!$isAvailable)
		{
			$this->deactivate();
		}

		return $isAvailable;
	}

	protected function getOptions(): array
	{
		return [
			'url' => $this->getUrl(),
			'zone' => $this->getZone(),
			'id' => $this->id,
		];
	}

	protected function getRelease(): ?array
	{
		$zone = $this->getZone();
		if (in_array($zone, ['ua', 'ur']))
		{
			return null;
		}

		$zone = isset($this->releaseMap[$zone]) ? $zone : 'en';

		return [
			'zone' => $zone,
			'url' => $this->releaseMap[$zone][0],
			'releaseDate' => $this->releaseMap[$zone][1],
		];
	}

	protected function getUrl(): string
	{
		$release = $this->getRelease();
		if (!$release)
		{
			return '';
		}

		$host = \Bitrix\Main\Context::getCurrent()->getRequest()->getHttpHost();
		$salt = md5('POLAR' . $host . 'STAR');
		if (Loader::includeModule('bitrix24'))
		{
			$salt =\CBitrix24::requestSign($salt);
		}

		$url = new \Bitrix\Main\Web\Uri($release['url']);
		$url->addParams([
			'host' => $host,
			'auth' => $salt,
		]);

		return $url->getUri();
	}

	public function closeAction()
	{
		// just for analytics
	}

	public function showAction()
	{
		$this->setLastShowTime();
	}

	public function deactivateAction()
	{
		$this->deactivate();
	}

	protected function getLastShowTimeOption(): string
	{
		return "release_{$this->id}:last_show_time";
	}

	protected function getSliderModeCntOption(): string
	{
		return "release_{$this->id}:slider_mode_cnt";
	}

	protected function getDeactivatedOption(): string
	{
		return "release_{$this->id}:deactivated";
	}

	protected function getStopChangeDefaultThemeOption(): string
	{
		return "release_{$this->id}:stop_change_default_theme";
	}

	protected function isDeactivated(): bool
	{
		return \CUserOptions::getOption('intranet', $this->getDeactivatedOption()) === 'Y';
	}

	protected function deactivate()
	{
		\CUserOptions::setOption('intranet', $this->getDeactivatedOption(), 'Y');
	}

	protected function activate()
	{
		\CUserOptions::deleteOption('intranet', $this->getDeactivatedOption());
	}

	protected function getLastShowTime(): ?int
	{
		$time = \CUserOptions::getOption('intranet', $this->getLastShowTimeOption(), null);

		return $time === null ? $time : (int)$time;
	}

	protected function setLastShowTime(): void
	{
		\CUserOptions::setOption('intranet', $this->getLastShowTimeOption(), time());
	}

	protected function shouldChangeDefaultTheme(): bool
	{
		return Option::get('intranet', $this->getStopChangeDefaultThemeOption(), 'N') !== 'Y';
	}

	protected function stopChangeDefaultTheme(): void
	{
		Option::set('intranet', $this->getStopChangeDefaultThemeOption(), 'Y');
	}

	protected function getSliderModeCnt(): ?int
	{
		return (int)\CUserOptions::getOption('intranet', $this->getSliderModeCntOption(), -1);
	}

	protected function incSliderModeCnt(): void
	{
		\CUserOptions::setOption('intranet', $this->getSliderModeCntOption(), $this->getSliderModeCnt() + 1);
	}

	protected function setDefaultTheme(): bool
	{
		if (!Loader::includeModule('intranet'))
		{
			return false;
		}

		$newDefaultThemeId = (
			in_array($this->getZone(), ['ru', 'kz', 'by'])
				? 'light:video-jupiter'
				: 'light:orbital-symphony'
		);

		$theme = new \Bitrix\Intranet\Integration\Templates\Bitrix24\ThemePicker('bitrix24', 's1');

		$currentDefaultThemeId = $theme->getDefaultThemeId();
		$currentThemeId = $theme->getCurrentThemeId();

		// Try to change the default theme only for the first time
		if ($currentDefaultThemeId !== $newDefaultThemeId && !$theme->isCustomThemeId($currentDefaultThemeId))
		{
			if ($this->shouldChangeDefaultTheme())
			{
				$theme->setDefaultTheme($newDefaultThemeId);
			}
		}

		$this->stopChangeDefaultTheme();

		if ($currentThemeId !== $newDefaultThemeId && !$theme->isCustomThemeId($currentThemeId))
		{
			if ($currentDefaultThemeId !== $currentThemeId)
			{
				$theme->setCurrentThemeId($newDefaultThemeId);
			}

			return true;
		}

		return false;
	}

	public function configureActions()
	{
		// TODO: Implement configureActions() method.
	}
}
