<?php

declare(strict_types=1);

use Sotbit\RestAPI\Config\Config;
use Sotbit\RestAPI\Core\Helper;
use Sotbit\RestAPI\Controller;
use Sotbit\RestAPI\Middleware;

/**
 * Custom routing
 *
 * @link https://www.slimframework.com/docs/v3/objects/router.html
 */

// GET
// $app->get('/route', Controller\Page::class.':getPage');

// POST
// $app->get('/route/{1}', Controller\Page::class.':getPage');

// CUSTOM
// $app->map(['GET', 'POST'], '/route/{1}', Controller\Page::class.':getPage');

// Add AUTH for request
// $app->get('/route', Controller\Page::class.':getPage')->add(new Middleware\Auth());

// Add GROUP route
//$app->group(
//    '/route',
//    function() use ($app): void {
//        $app->get('/page1', Controller\Page::class.':getPage1');
//        $app->get('/page2', Controller\Page::class.':getPage2');
//    }
//)->add(new Middleware\Auth());




