import { toValue } from 'ui.vue3';
import { useBlockDiagram } from './block-diagram';
import { useCanvas } from './canvas';
import { useHistory } from './history';
import type {
	AnimationItem,
} from '../types';

import { ANIMATED_TYPES } from '../constants';

type Options = {
	items: Array<AnimationItem>;
	zoom: number;
};

type UseAnimatedQueue = {
	start: (options: Options) => void;
	pause: () => void;
	play: () => void;
	stop: () => void;
};

export function useAnimationQueue(): UseAnimatedQueue
{
	const {
		zoom,
		isPauseAnimation,
		isStopAnimation,
		animationQueue,
		currentAnimationItem,
		isRenderOptimizationAvailable,
		blockIntersections,
		animationStep,
		addConnection,
		deleteConnectionById,
		addBlock,
		deleteBlockById,
	} = useBlockDiagram();
	const { goToBlock } = useCanvas();
	const history = useHistory();

	// Единая точка продвижения очереди. Вызывается ровно один раз на каждый
	// yield-шаг — либо совпавшим экранным переходом (переходом отрисованного
	// элемента), либо резервным таймером (см. AnimationStepController). Гарантия
	// «ровно один advance на шаг» лежит на контроллере; здесь — само действие
	// продвижения генератора.
	function advance(): void
	{
		const queue = animationQueue.value;
		if (!queue)
		{
			return;
		}

		const { done = false } = queue.next() ?? {};
		if (done)
		{
			animationQueue.value = null;
			// Снимок истории делаем ОДИН раз при завершении очереди, а не на
			// каждом шаге — иначе O(N^2) клонов и засорение undo.
			history.makeSnapshot();
		}
	}

	animationStep.setAdvanceHandler(advance);

	// Отрисован ли блок сейчас. При выключенной оптимизации рендерятся все блоки;
	// при включённой — только попавшие в видимый набор (видимая область).
	function isBlockRendered(blockId: string): boolean
	{
		return !toValue(isRenderOptimizationAvailable)
			|| toValue(blockIntersections.visibleBlockIds).has(blockId);
	}

	// Возвращает true, если элемент даст переход (enter/leave), которым очередь
	// продвинется дальше через onAfter* в *-queue-transition. Если перехода не
	// будет (удаление неотрисованного блока), очередь не должна его ждать.
	function animateItem(animatedItem: AnimationItem): boolean
	{
		switch (animatedItem.type)
		{
			case ANIMATED_TYPES.BLOCK: {
				// Доводим камеру до блока ДО его отрисовки. При включённой
				// оптимизации рендерятся только блоки в видимой области: блок вне видимой
				// области не смонтируется, его enter-переход не сработает и очередь
				// встанет. Центрирование камеры синхронно обновляет transform, из-за
				// чего selectVisibleBlocks включит блок в видимый набор и он
				// отрисуется — очередь продолжится, а пользователь «доезжает» до
				// каждого блока независимо от размера графа. (onEnter в
				// blocks-queue-transition уточняет центрирование уже после монтажа.)
				goToBlock(animatedItem.item);
				addBlock(animatedItem.item);

				return true;
			}

			case ANIMATED_TYPES.CONNECTION: {
				addConnection(animatedItem.item);

				return true;
			}

			case ANIMATED_TYPES.REMOVE_BLOCK: {
				// Leave-переход возможен только для отрисованного блока. Блок вне экрана
				// (при оптимизации не в DOM) удаляется без перехода — ждать его
				// нельзя, иначе очередь встанет. Видимый удаляется с затуханием как обычно.
				const willAnimate = isBlockRendered(animatedItem.item.id);
				deleteBlockById(animatedItem.item.id);

				return willAnimate;
			}

			case ANIMATED_TYPES.REMOVE_CONNECTION: {
				deleteConnectionById(animatedItem.item.id);

				return true;
			}

			default:
				return false;
		}
	}

	function* animationQueueFn(animatedQueueItems: Array<AnimationItem>): Generator<AnimationItem | undefined>
	{
		for (const animatedItem: AnimationItem of animatedQueueItems)
		{
			if (toValue(isPauseAnimation))
			{
				yield;
			}

			if (toValue(isStopAnimation))
			{
				break;
			}

			currentAnimationItem.value = animatedItem;

			if (animatedItem.type && animatedItem.item)
			{
				const willAnimate: boolean = animateItem(animatedItem);

				// Ждём завершения перехода только если он будет. Иначе (удаление
				// неотрисованного блока) сразу переходим к следующему элементу — так
				// удаления блоков вне экрана проходят мгновенно и очередь не зависает.
				if (willAnimate)
				{
					// Открываем шаг: вооружаем резервный таймер и получаем токен.
					// Продвинет шаг первый из {совпавший переход, таймер}, второй —
					// идемпотентно игнорируется контроллером.
					animationStep.openStep();
					yield animatedItem;
				}
			}
		}

		stop();
	}

	function start(options: Options): void
	{
		const {
			items: shouldAnimatedItems = [],
		} = options ?? {};

		zoom.value = 1;
		isStopAnimation.value = false;
		animationStep.stop();

		animationQueue.value = animationQueueFn(shouldAnimatedItems);
		if (shouldAnimatedItems.length > 0)
		{
			setTimeout((): void => play(), 100);
		}
		else
		{
			stop();
		}
	}

	function pause(): void
	{
		isPauseAnimation.value = true;
	}

	function play(): void
	{
		isPauseAnimation.value = false;
		animationQueue.value?.next();
	}

	function stop(): void
	{
		isStopAnimation.value = true;
		isPauseAnimation.value = false;
		currentAnimationItem.value = null;
		animationQueue.value = null;
		// Снимаем вооружённый резервный таймер и сбрасываем состояние шага.
		animationStep.stop();
	}

	return {
		start,
		pause,
		play,
		stop,
	};
}
