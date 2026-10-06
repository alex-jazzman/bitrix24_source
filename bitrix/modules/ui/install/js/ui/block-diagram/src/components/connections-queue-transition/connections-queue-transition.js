import './connections-queue-transition.css';
import { toValue } from 'ui.vue3';
import { useBlockDiagram } from '../../composables';
import { matchesTransitionEl } from '../../utils';
import { ANIMATED_TYPES } from '../../constants';

type ConnectionsQueueTransitionSetup = {
	isAnimate: boolean;
	onBeforeEnter: () => void;
	onAfterEnter: (el: HTMLElement) => void;
	onAfterLeave: (el: HTMLElement) => void;
};

// @vue/component
export const ConnectionsQueueTransition = {
	name: 'connections-queue-transition',
	setup(): ConnectionsQueueTransitionSetup
	{
		const {
			isAnimate,
			currentAnimationItem,
			animationStep,
			updatePort,
			hooks,
		} = useBlockDiagram();

		// Совпадает ли завершившийся переход с текущим элементом-связью. Логика
		// сопоставления по data-id корня связи (Connection кладёт его на <svg>)
		// вынесена в чистую matchesTransitionEl. Если data-id недоступен — грубый
		// тип-фильтр + резервный таймер контроллера.
		function isCurrentTransitionEl(el: HTMLElement): boolean
		{
			return matchesTransitionEl(el, toValue(currentAnimationItem)?.item);
		}

		function advanceForCurrent(): void
		{
			// Контроллер гарантирует ровно одно продвижение на шаг (переход vs
			// резервный таймер) по токену шага.
			animationStep.settle(animationStep.currentToken);
		}

		function onBeforeEnter(): void
		{
			const { item: connection } = toValue(currentAnimationItem) ?? {};
			// Сторонний enter-переход может сработать после завершения очереди, когда
			// stop() обнулил currentAnimationItem — тогда connection отсутствует и
			// деструктуризация/updatePort ниже упали бы. Просто выходим.
			if (!connection)
			{
				return;
			}

			hooks.connectionTransitionStart.trigger(connection);

			const {
				sourceBlockId,
				sourcePortId,
				targetBlockId,
				targetPortId,
			} = connection;

			// Полный рефреш геометрии обоих портов перед входом связи: rect + segment
			// sizes. Во время поблочной анимации updatePortSegmentSizes ещё не отработал
			// (он ждёт waitAllBlocksMounted), поэтому одного updatePortRect мало —
			// связь отрисуется без сегментов. updatePort покрывает block rect + port
			// rect + segment sizes самодостаточно.
			updatePort(sourceBlockId, sourcePortId);
			updatePort(targetBlockId, targetPortId);
		}

		function onAfterEnter(el: HTMLElement): void
		{
			hooks.connectionTransitionEnd.trigger(toValue(currentAnimationItem)?.item);
			// Как и в blocks-queue-transition: продвигаем очередь только для перехода
			// текущего элемента-связи, чтобы сторонний переход (в т.ч. вызванный
			// отсечением при движении камеры) не дал лишнее продвижение.
			if (toValue(currentAnimationItem)?.type === ANIMATED_TYPES.CONNECTION && isCurrentTransitionEl(el))
			{
				advanceForCurrent();
			}
		}

		function onAfterLeave(el: HTMLElement): void
		{
			if (toValue(currentAnimationItem)?.type === ANIMATED_TYPES.REMOVE_CONNECTION && isCurrentTransitionEl(el))
			{
				advanceForCurrent();
			}
		}

		return {
			isAnimate,
			onBeforeEnter,
			onAfterEnter,
			onAfterLeave,
		};
	},
	template: `
		<TransitionGroup
			v-if="isAnimate"
			name="ui-block-diagram-connections-queue-transition"
			@before-enter="onBeforeEnter"
			@after-enter="onAfterEnter"
			@after-leave="onAfterLeave"
		>
			<slot/>
		</TransitionGroup>
		<template v-else>
			<slot/>
		</template>
	`,
};
