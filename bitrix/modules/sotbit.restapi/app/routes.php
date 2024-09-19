<?php

declare(strict_types=1);

use Slim\App;
use Slim\Routing\RouteCollectorProxy as Route;
use Sotbit\RestAPI\Controller;
use Sotbit\RestAPI\Middleware;
use Sotbit\RestAPI\EventDispatcher\Events\RouterEvent;
use Sotbit\RestAPI\Core\Helper;

/**
 * Routing
 *
 * @link https://www.slimframework.com/docs/v4/objects/routing.html
 */

return function(App $app): void {
    $app->group(
        '/v1',
        function(Route $group) {
            /**
             * Help
             */
            $group->get('', [Controller\Status::class, 'getHelp']);


            /**
             * Auth
             */
            $group->group('/auth', function(Route $auth) {
                $auth->post('', [Controller\User\Auth::class, 'login'])->setName('auth.login');
                $auth->post('/forgot', [Controller\User\Auth::class, 'forgot'])->setName('auth.forgot');
            });


            /**
             * Users
             */
            $group->group('/users', function(Route $users) {
                $users->get('', [Controller\User\User::class, 'getCurrent'])->setName('user.get.current');
                $users->post('', [Controller\User\User::class, 'update']);
                $users->get('/{id:[0-9]+}', [Controller\User\User::class, 'getOne'])->setName('user.get.id');
            })->add(new Middleware\Auth());


            /**
             * Catalog
             */
            $group->group('/catalog', function(Route $catalog) {
                $catalog->get('[/]', [Controller\Catalog\Catalog::class, 'getList']);
                //$catalog->get('/prices', [Controller\Catalog\Catalog::class, 'getPrices']);
                //$catalog->get('/vats', [Controller\Catalog\Catalog::class, 'getVats']);
                $catalog->get('/{iblock_id:[0-9]+}', [Controller\Catalog\Catalog::class, 'getOne']);
                $catalog->get('/{iblock_id:[0-9]+}/sections', [Controller\Catalog\Section::class, 'getList']);
                $catalog->get('/{iblock_id:[0-9]+}/sections/{section_id:[0-9]+}', [Controller\Catalog\Section::class, 'getOne']);
                $catalog->get('/{iblock_id:[0-9]+}/products', [Controller\Catalog\Product::class, 'getList']);
                $catalog->get('/{iblock_id:[0-9]+}/products/{product_id:[0-9]+}', [Controller\Catalog\Product::class, 'getOne']);
                $catalog->get('/{iblock_id:[0-9]+}/filter', [Controller\Catalog\Filter::class, 'get']);
                //$catalog->post('/{iblock_id}/filter', [Controller\Catalog\Product::class, 'getOne']);


            })->add(new Middleware\Auth());


            /**
             * Sale
             */
            $group->group('/sale', function(Route $sale) {
                // Basket
                $sale->get('/basket', [Controller\Sale\Basket::class, 'get']);
                $sale->post('/basket/add', [Controller\Sale\Basket::class, 'add']); // id, quantity, props
                $sale->post('/basket/delete', [Controller\Sale\Basket::class, 'delete']); // id


                // Others
                $sale->get('/paysystems', [Controller\Sale\Sale::class, 'getPaySystems']);
                $sale->get('/deliveries', [Controller\Sale\Sale::class, 'getDeliveries']);
                $sale->get('/statuses', [Controller\Sale\Sale::class, 'getStatuses']);
                $sale->get('/persontypes', [Controller\Sale\Sale::class, 'getPersonTypes']);
            })->add(new Middleware\Auth());


            /**
             * Orders
             */
            $group->group('/orders', function(Route $orders) {
                // query params = select, filter, limit, page, order
                $orders->get('[/]', [Controller\Sale\Order::class, 'getList'])->setName('orders.get.list');
                $orders->get('/{id:[0-9]+}', [Controller\Sale\Order::class, 'getOne'])->setName('orders.get.id');
                $orders->get('/status/{id:[0-9]+}', [Controller\Sale\Order::class, 'getStatus']);

                // cancel order (param = id[,])
                $orders->post('/cancel', [Controller\Sale\Order::class, 'cancel']);

                // repeat order (param = id)
                $orders->post('/repeat', [Controller\Sale\Order::class, 'repeat']);
            })->add(new Middleware\Auth());

            /**
             * Support
             */
            $group->group('/support', function(Route $support) {
                $support->get('[/]', [Controller\Support\Helper::class, 'getSettings']);

                // all tickets  (query params = filter, limit, page, order)
                $support->get('/tickets', [Controller\Support\Ticket::class, 'getAll']);
                // current ticket
                $support->get('/tickets/{id:[0-9]+}', [Controller\Support\Ticket::class, 'getOne']);


                // all message ticket  (query params = filter, limit, page, order)
                $support->get('/messages/ticket/{id:[0-9]+}', [Controller\Support\Message::class, 'getAll']);
                // current message
                $support->get('/messages/{id:[0-9]+}', [Controller\Support\Message::class, 'getOne']);


                // create ticket (params = title, message, [files, category_id, criticality_id, mark_id])
                $support->post('/tickets', [Controller\Support\Ticket::class, 'create']);
                // close ticket (param = id[,])
                $support->post('/tickets/close', [Controller\Support\Ticket::class, 'close']);
                // open ticket
                $support->post('/tickets/open', [Controller\Support\Ticket::class, 'open']);
                // open ticket
                $support->get('/file/{hash}', [Controller\Support\Helper::class, 'getFile'])->setName('support.get.file');


                // update current ticket
                //$support->patch('/tickets/{id}',        [Controller\Support\Ticket::class, 'update']);

                // delete ticket
                //$support->delete('', [Controller\Support::class, 'delete']);


                // create message in ticket (params = message, [files, criticality, mark])
                $support->post('/messages/ticket/{id:[0-9]+}', [Controller\Support\Message::class, 'create']);
            })->add(new Middleware\Auth());

            /**
             * Include custom routers by event
             */
            $customRouters = [];
            $this->get('event_dispatcher')->dispatch(new RouterEvent($customRouters), RouterEvent::AFTER_GET);
            Controller\Router::listen($group, $customRouters);
        }
    );

    /**
     * Include custom routers
     */
    if(file_exists(__DIR__.'/routes_custom.php')) {
        (include __DIR__ . '/routes_custom.php')($app);
    }
};