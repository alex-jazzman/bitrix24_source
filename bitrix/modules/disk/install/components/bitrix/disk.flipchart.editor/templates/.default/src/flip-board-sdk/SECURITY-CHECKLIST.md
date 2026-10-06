# Проверка перед обновлением вендорного SDK досок

Поставляемая копия `@flip-chart/flip-board-sdk` — форк вендорной версии `0.0.31`: в неё внесена
защита канала сообщений. Обновление зависимости перезапишет копию целиком, поэтому после **каждого**
обновления библиотеки проверь три пункта вручную — и в исходнике `src/lib/flip-board-sdk.js`,
и в собранном `../../script.js`, который реально уходит в браузер.

## 1. Нет широковещательной отправки

В обоих файлах не должно остаться отправок в окно фрейма с адресатом `'*'`:

```bash
cd disk/install/components/bitrix/disk.flipchart.editor/templates/.default
grep -n "postMessage(.*'\*'" src/flip-board-sdk/src/lib/flip-board-sdk.js script.js
```

Ожидание: пусто. Каждая отправка адресуется `this.expectedOrigin`.

## 2. Гейт по окну и источнику на месте

```bash
grep -n "isTrustedMessage" src/flip-board-sdk/src/lib/flip-board-sdk.js script.js
```

Ожидание: предикат объявлен и вызывается в постоянном обработчике `listenBoardEvents` и в обоих
временных обработчиках (`tryToCloseBoard`, `renameBoard`) — до чтения `event.data`. Проверка окна без
проверки источника недостаточна: после перенавигации фрейма окно остаётся тем же объектом.

## 3. Отписка снимает подписанное и только по явному вызову

```bash
grep -n "boundListenBoardEvents\|beforeunload" src/flip-board-sdk/src/lib/flip-board-sdk.js script.js
```

Ожидание: обработчик хранится в поле экземпляра, `addEventListener()` подписывает именно его,
`destroy()` снимает то же значение. Подписки на `beforeunload` быть не должно: вендорная версия
вызывала там `destroy()`, и после починки отписки это глушило SDK при отменённом переходе и при
возврате страницы из bfcache.

## После проверки

Прогони тесты канала сообщений:

```bash
chef test unit --path disk/install/components/bitrix/disk.flipchart.editor/templates/.default flip-board-sdk.test.js
```

Если правка вносится в исходник — обязательно пересобери бандл, иначе защита останется только в
исходнике, а в браузер уйдёт незащищённая версия:

```bash
chef build --path disk/install/components/bitrix/disk.flipchart.editor/templates/.default
```
