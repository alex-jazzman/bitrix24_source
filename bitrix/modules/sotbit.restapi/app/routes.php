<?php

declare(strict_types=1);

use Sotbit\RestAPI\Core\Helper;
use Sotbit\RestAPI\Controller;
use Sotbit\RestAPI\Middleware;
use Sotbit\RestAPI\EventDispatcher\Events\RouterEvent;

/**
 * Routing
 *
 * @link https://www.slimframework.com/docs/v3/objects/router.html
 */
$app->group(
    \SotbitRestAPI::getRouteMainPath(),
    function() use ($app): void {
        $app->group(
            '/v1',
            function() use ($app): void {
                /**
                 * Help
                 */
                $app->get('[/]', Controller\Status::class.':getHelp');


                /**
                 * Auth
                 */
                $app->group(
                    '/auth',
                    function() use ($app): void {
                        $app->post('', Controller\User\Auth::class.':login')->setName('auth.login');
                        $app->post('/forgot', Controller\User\Auth::class.':forgot')->setName('auth.forgot');
                    }
                );


                /**
                 * Users
                 */
                $app->group(
                    '/users',
                    function() use ($app): void {
                        $app->get('', Controller\User\User::class.':getCurrent')->setName('user.get.current');
                        $app->post('', Controller\User\User::class.':update');
                        $app->get('/{id:[0-9]+}', Controller\User\User::class.':getOne')->setName('user.get.id');
                    }
                )->add(new Middleware\Auth());


                /**
                 * Catalog
                 */
                $app->group(
                    '/catalog',
                    function() use ($app): void {
                        $app->get('[/]', Controller\Catalog\Catalog::class.':getList');
                        //$app->get('/prices', Controller\Catalog\Catalog::class.':getPrices');
                        //$app->get('/vats', Controller\Catalog\Catalog::class.':getVats');
                        $app->get('/{iblock_id:[0-9]+}', Controller\Catalog\Catalog::class.':getOne');
                        $app->get('/{iblock_id:[0-9]+}/sections', Controller\Catalog\Section::class.':getList');
                        $app->get('/{iblock_id:[0-9]+}/sections/{section_id:[0-9]+}', Controller\Catalog\Section::class.':getOne');
                        $app->get('/{iblock_id:[0-9]+}/products', Controller\Catalog\Product::class.':getList');
                        $app->get('/{iblock_id:[0-9]+}/products/{product_id:[0-9]+}', Controller\Catalog\Product::class.':getOne');
                        $app->get('/{iblock_id:[0-9]+}/filter', Controller\Catalog\Filter::class.':get');

                        //$app->post('/{iblock_id}/filter', Controller\Catalog\Product::class.':getOne');


                    }
                )->add(new Middleware\Auth());


                /**
                 * Sale
                 */
                $app->group(
                    '/sale',
                    function() use ($app): void {
                        /**
                         * Basket
                         */
                        $app->get('/basket', Controller\Sale\Basket::class.':get');
                        $app->post('/basket/add', Controller\Sale\Basket::class.':add'); // id, quantity, props
                        $app->post('/basket/delete', Controller\Sale\Basket::class.':delete'); // id


                        $app->get('/paysystems', Controller\Sale\Sale::class.':getPaySystems');
                        $app->get('/deliveries', Controller\Sale\Sale::class.':getDeliveries');
                        $app->get('/statuses', Controller\Sale\Sale::class.':getStatuses');
                        $app->get('/persontypes', Controller\Sale\Sale::class.':getPersonTypes');
                    }
                )->add(new Middleware\Auth());


                /**
                 * Orders
                 */
                $app->group(
                    '/orders',
                    function() use ($app): void {
                        // query params = select, filter, limit, page, order
                        $app->get('[/]', Controller\Sale\Order::class.':getList')->setName('orders.get.list');
                        $app->get('/{id:[0-9]+}', Controller\Sale\Order::class.':getOne')->setName('orders.get.id');
                        $app->get('/status/{id:[0-9]+}', Controller\Sale\Order::class.':getStatus');

                        // cancel order (param = id[,])
                        $app->post('/cancel', Controller\Sale\Order::class.':cancel');
                    }
                )->add(new Middleware\Auth());

                /**
                 * Support
                 */
                $app->group(
                    '/support',
                    function() use ($app): void {
                        $app->get('[/]', Controller\Support\Helper::class.':getSettings');

                        // all tickets  (query params = filter, limit, page, order)
                        $app->get('/tickets', Controller\Support\Ticket::class.':getAll');
                        // current ticket
                        $app->get('/tickets/{id:[0-9]+}', Controller\Support\Ticket::class.':getOne');


                        // all message ticket  (query params = filter, limit, page, order)
                        $app->get('/messages/ticket/{id:[0-9]+}', Controller\Support\Message::class.':getAll');
                        // current message
                        $app->get('/messages/{id:[0-9]+}', Controller\Support\Message::class.':getOne');


                        // create ticket (params = title, message, [files, category_id, criticality_id, mark_id])
                        $app->post('/tickets', Controller\Support\Ticket::class.':create');
                        // close ticket (param = id[,])
                        $app->post('/tickets/close', Controller\Support\Ticket::class.':close');
                        // open ticket
                        $app->post('/tickets/open', Controller\Support\Ticket::class.':open');
                        // open ticket
                        $app->get('/file/{hash}', Controller\Support\Helper::class.':getFile')->setName(
                            'support.get.file'
                        );


                        // update current ticket
                        //$app->patch('/tickets/{id}',        Controller\Support\Ticket::class.':update');

                        // delete ticket
                        //$app->delete('', Controller\Support::class.':delete');


                        // create message in ticket (params = message, [files, criticality, mark])
                        $app->post('/messages/ticket/{id:[0-9]+}', Controller\Support\Message::class.':create');
                    }
                )->add(new Middleware\Auth());


                /**
                 * Include custom routers current version from file
                 */
                if(Helper::checkCustomFile(basename(__FILE__))) {
                    require Helper::checkCustomFile(basename(__FILE__));
                }


                /**
                 * Include custom routers by event
                 */
                $app->getContainer()->get('event_dispatcher')->dispatch(
                    new RouterEvent($customRouters),
                    RouterEvent::AFTER_GET
                );
                Controller\Router::listen($app, $customRouters);
            }
        );

        /**
         * Include custom routers current version from file
         */
        if(Helper::checkCustomFile('routes_version.php')) {
            require Helper::checkCustomFile('routes_version.php');
        }
    }
)->add(new Middleware\Log($app))->add(new Middleware\Config($app));