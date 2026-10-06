<?php declare(strict_types=1);

use Bitrix\Main\Loader;

// Backward compatibility after the PSR-4 migration: Resolver builds a lowercase class name for
// legacy action names (rpa.item.update), and PSR-4 lookup is case-sensitive, so map them explicitly.
Loader::registerAutoLoadClasses('rpa', [
	\bitrix\rpa\controller\comment::class => 'lib/Controller/Comment.php',
	\bitrix\rpa\controller\fields::class => 'lib/Controller/Fields.php',
	\bitrix\rpa\controller\item::class => 'lib/Controller/Item.php',
	\bitrix\rpa\controller\stage::class => 'lib/Controller/Stage.php',
	\bitrix\rpa\controller\task::class => 'lib/Controller/Task.php',
	\bitrix\rpa\controller\timeline::class => 'lib/Controller/Timeline.php',
	\bitrix\rpa\controller\type::class => 'lib/Controller/Type.php',
]);
