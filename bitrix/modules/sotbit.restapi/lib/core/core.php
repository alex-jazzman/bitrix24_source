<?php

declare(strict_types=1);

namespace Sotbit\RestAPI\Core;

use Bitrix\Main\Application;
use Sotbit\RestAPI\Localisation as l;
use Sotbit\RestAPI\Exception;

class Core
{
    public const DIR_APP = 'app';
    public const DIR_CUSTOM = 'custom';

    public const DIR_CONFIG = 'config';

    public function run()
    {
        if(\SotbitRestAPI::isModuleActive()) {
            if($this->checkSite() && $this->checkRoute()) {
                $this->initConstants();
                $this->initAutoload();
                $this->initApp();
                exit;
            }
        }
    }

    public function checkRoute(): bool
    {
        $request = Application::getInstance()->getContext()->getRequest();
        $requestPage = $request->getRequestedPage() ?? $_SERVER['REQUEST_URI'];

        return (strpos($requestPage, \SotbitRestAPI::getRouteMainPath()) === 0);
    }

    public function initConstants(): void
    {
        define('SM_SAFE_MODE', true);
        define('PERFMON_STOP', true);
        define('PUBLIC_AJAX_MODE', true);
        define('STOP_STATISTICS', true);
        define('NO_AGENT_STATISTIC', 'Y');
        define('NO_AGENT_CHECK', true);
        define('NO_KEEP_STATISTIC', true);
        define('DisableEventsCheck', true);

        define('DS', DIRECTORY_SEPARATOR);
        define('SR_ROOT_PATH', __DIR__.DS.'..'.DS.'..'.DS);
        define('SR_APP_PATH', SR_ROOT_PATH.self::DIR_APP.DS);
        define('SR_CONFIG_PATH', SR_ROOT_PATH.self::DIR_CONFIG.DS);
        define('SR_APP_CUSTOM_PATH', SR_APP_PATH.self::DIR_CUSTOM.DS);
    }

    public function initAutoload(): void
    {
        require SR_ROOT_PATH.'vendor'.DS.'autoload.php';
    }

    public function initApp(): void
    {
        require SR_ROOT_PATH.self::DIR_APP.DS.'app.php';
    }

    private function checkSite(): bool
    {
        return \Bitrix\Main\Config\Option::get("main", "site_stopped", "N") !== 'Y';
    }
}