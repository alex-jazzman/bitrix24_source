<?php

declare(strict_types=1);

use Sotbit\RestAPI\Handler\ErrorHandler;
use Sotbit\RestAPI\Handler\PhpErrorHandler;
use Sotbit\RestAPI\Handler\NotFoundErrorHandler;
use Sotbit\RestAPI\Handler\NotAllowedErrorHandler;
use Slim\HttpCache\CacheProvider;
use Sotbit\RestAPI\Core\Helper;


/**
 * Cache
 *
 * @link https://www.slimframework.com/docs/v3/features/caching.html
 * @return \Slim\HttpCache\CacheProvider
 */
$container['cache'] = static function() {
    return new CacheProvider();
};


/**
 * @return ErrorHandler
 */
$container['errorHandler'] = static function(): ErrorHandler {
    return new ErrorHandler();
};

/**
 * @return PhpErrorHandler
 */
$container['phpErrorHandler'] = static function(): PhpErrorHandler {
    return new PhpErrorHandler();
};

/**
 * @return NotFoundErrorHandler
 */
$container['notFoundHandler'] = static function(): NotFoundErrorHandler {
    return new NotFoundErrorHandler();
};

/**
 * @return NotAllowedErrorHandler
 */
$container['notAllowedHandler'] = static function(): NotAllowedErrorHandler {
    return new NotAllowedErrorHandler();
};


/**
 * Include custom dependencies from file
 */
if(Helper::checkCustomFile(basename(__FILE__))) {
    require Helper::checkCustomFile(basename(__FILE__));
}
