<?php
declare(strict_types=1);

use Sotbit\RestAPI\Core\Helper;

/* Warnings and Notices
error_reporting(E_ALL);
set_error_handler(function ($severity, $message, $file, $line) {
    if (error_reporting(E_ALL) & $severity > 8192) {
        throw new \ErrorException($message, 0, $severity, $file, $line);
    }
});*/

/**
 * Include custom settings from file
 */
$settings = require __DIR__ . DS . 'settings.php';
if(Helper::checkCustomFile('settings.php')) {
    $settings = array_merge($settings, require Helper::checkCustomFile('settings.php'));
}

// Init app
$app = new \Slim\App($settings);

// Add CorsSlim
$app->add(new \CorsSlim\CorsSlim());

// Add Cache
$app->add(new \Slim\HttpCache\Cache('public', 86400));

// Get container
$container = $app->getContainer();

require __DIR__ . DS . 'dependencies.php';
require __DIR__ . DS . 'repositories.php';
require __DIR__ . DS . 'events.php';
require __DIR__ . DS . 'routes.php';


$app->run();