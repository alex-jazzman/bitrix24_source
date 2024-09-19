<?php
use Bitrix\Main\Localization\Loc;
use Slim\Factory\AppFactory;
use DI\Container;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Sotbit\RestAPI\Core\Helper;

try {
    require __DIR__.'/../vendor/autoload.php';

    $return = '';
    $returnRoutes = [];
    $core = new Sotbit\RestAPI\Core\Core();
    $core->initConstants();


    // Init container
    $container = require __DIR__ . '/../app/container.php';
    AppFactory::setContainer($container->build());

    // Init app
    $app = AppFactory::create();

    // Set default route path
    $app->setBasePath(\SotbitRestAPI::getRouteMainPath());
    (require __DIR__ . '/../app/events.php')($app->getContainer());
    (require __DIR__ . '/../app/routes.php')($app);
    $routes = $app->getRouteCollector()->getRoutes();
    foreach ($routes as $route) {
        $returnRoutes[] = [
            'data' => [
                'PATTERN' => \SotbitRestAPI::getRouteMainPath().$route->getPattern(),
                'METHOD' => implode(', ', $route->getMethods()),
            ]
        ];
    }
    if($returnRoutes) {
        ob_start();
        $list = $APPLICATION->IncludeComponent('bitrix:main.ui.grid', '', [
            'GRID_ID' => 'report_list',
            'COLUMNS' => [
                ['id' => 'PATTERN', 'name' => Loc::getMessage($moduleId.'_ROUTE_MAP_PATTERN'), 'sort' => 'PATTERN', 'default' => true],
                ['id' => 'METHOD', 'name' => Loc::getMessage($moduleId.'_ROUTE_MAP_METHOD'), 'sort' => 'METHOD', 'default' => true],
            ],
            'ROWS' => $returnRoutes,
            'SHOW_ROW_CHECKBOXES' => false,
            'AJAX_OPTION_JUMP'          => 'N',
            'SHOW_CHECK_ALL_CHECKBOXES' => false,
            'SHOW_ROW_ACTIONS_MENU'     => false,
            'SHOW_GRID_SETTINGS_MENU'   => false,
            'SHOW_NAVIGATION_PANEL'     => false,
            'SHOW_PAGINATION'           => false,
            'SHOW_SELECTED_COUNTER'     => false,
            'SHOW_TOTAL_COUNTER'        => false,
            'SHOW_PAGESIZE'             => false,
            'SHOW_ACTION_PANEL'         => false,
            'ACTION_PANEL'              => [
                'GROUPS' => [
                    'TYPE' => [
                        'ITEMS' => [
                        ],
                    ]
                ],
            ],
            'ALLOW_COLUMNS_SORT'        => false,
            'ALLOW_COLUMNS_RESIZE'      => false,
            'ALLOW_HORIZONTAL_SCROLL'   => false,
            'ALLOW_SORT'                => false,
            'ALLOW_PIN_HEADER'          => false,
            'ALLOW_COLUMN_RESIZE'       => true,
            'AJAX_OPTION_HISTORY'       => 'N'
        ]);
        $return = ob_get_clean();
    }

    return $return;

} catch(\Throwable $e) {
    return $e->getMessage();
}