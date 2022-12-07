<?php

declare(strict_types=1);

use Sotbit\RestAPI\Core\Config;
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
                 * Status
                 */
                //$app->get('/status', Controller\Status::class.':getStatus')->setName('status');

                /**
                 * Documentation
                 */
                //$app->get('/doc', Documentation::class);

                /**
                 * Auth
                 */
                $app->group(
                    '/auth',
                    function() use ($app): void {
                        $app->post('', Controller\User::class.':login')->setName('auth.login');
                        $app->post('/forgot', Controller\User::class.':forgot')->setName('auth.forgot');
                    }
                );


                /**
                 * Users
                 */
                $app->group(
                    '/users',
                    function() use ($app): void {
                        $app->get('', Controller\User::class.':getCurrent')->setName('user.get.current');
                        $app->get('/{id}', Controller\User::class.':getOne')->setName('user.get.id');
                    }
                )->add(new Middleware\Auth());


                /**
                 * Orders
                 */
                $app->group(
                    '/orders',
                    function() use ($app): void {
                        // query params = select, filter, limit, page, order
                        $app->get('', Controller\Order::class.':getList')->setName('orders.get.list');
                        $app->get('/{id:[0-9]+}', Controller\Order::class.':getOne')->setName('orders.get.id');
                        $app->get('/status/{id}', Controller\Order::class.':getStatus');

                        // cancel order (param = id[,])
                        $app->post('/cancel', Controller\Order::class.':cancel');

                        $app->get('/paysystems', Controller\Order::class.':getPaySystems');
                        $app->get('/deliveries', Controller\Order::class.':getDeliveries');
                        $app->get('/statuses', Controller\Order::class.':getStatuses');
                        $app->get('/persontypes', Controller\Order::class.':getPersonTypes');
                    }
                )->add(new Middleware\Auth());


                /**
                 * Support
                 */
                $app->group(
                    '/support',
                    function() use ($app): void {
                        $app->get('[/]', Controller\SupportHelper::class.':getSettings');

                        // all tickets  (query params = filter, limit, page, order)
                        $app->get('/tickets', Controller\SupportTicket::class.':getAll');
                        // current ticket
                        $app->get('/tickets/{id}', Controller\SupportTicket::class.':getOne');


                        // all message ticket  (query params = filter, limit, page, order)
                        $app->get('/messages/ticket/{id}', Controller\SupportMessage::class.':getAll');
                        // current message
                        $app->get('/messages/{id}', Controller\SupportMessage::class.':getOne');


                        // create ticket (params = title, message, [files, category_id, criticality_id, mark_id])
                        $app->post('/tickets', Controller\SupportTicket::class.':create');
                        // close ticket (param = id[,])
                        $app->post('/tickets/close', Controller\SupportTicket::class.':close');
                        // open ticket
                        $app->post('/tickets/open', Controller\SupportTicket::class.':open');
                        // open ticket
                        $app->get('/file/{hash}', Controller\SupportHelper::class.':getFile')->setName(
                            'support.get.file'
                        );


                        // update current ticket
                        //$app->patch('/tickets/{id}',        Controller\SupportTicket::class.':update');

                        // delete ticket
                        //$app->delete('', Controller\Support::class.':delete');


                        // create message in ticket (params = message, [files, criticality, mark])
                        $app->post('/messages/ticket/{id}', Controller\SupportMessage::class.':create');
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
                $app->getContainer()->get('event_service')->dispatch(
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
)->add(new Middleware\Log($app));