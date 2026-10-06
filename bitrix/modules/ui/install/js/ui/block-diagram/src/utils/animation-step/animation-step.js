// Резервный таймаут (мс) на один шаг анимации. Должен быть заметно больше
// длительности видимого перехода (opacity 0.7s в *-queue-transition.css), чтобы
// таймер никогда не соперничал с экранным переходом: он срабатывает, только
// когда продвигающего перехода не будет вовсе (отсечение блоков вне экрана,
// добавление/удаление без изменений).
export const ANIMATION_STEP_FALLBACK_MS = 1200;

export type AdvanceHandler = () => void;

export type AnimationStepControllerOptions = {
	fallbackMs?: number,
	onAdvance?: AdvanceHandler | null,
	setTimeoutFn?: typeof setTimeout,
	clearTimeoutFn?: typeof clearTimeout,
};

/**
 * Управляет продвижением очереди анимации так, чтобы каждый yield-шаг
 * продвигался РОВНО ОДИН РАЗ — тем, что наступит первым: совпавшим экранным
 * переходом или резервным таймером; проигравший игнорируется.
 *
 * Чистая логика (без Vue и DOM): таймеры инъектируются, поэтому класс
 * тестируется с поддельными часами. Сопоставление элемента с текущим шагом (какой
 * переход относится к текущему шагу) остаётся в компонентах переходов — этот
 * контроллер лишь обеспечивает инвариант «одно продвижение на шаг» через
 * монотонный токен шага.
 */
export class AnimationStepController
{
	#token: number = 0;
	#settledToken: number = 0;
	#timerId: number | null = null;
	#fallbackMs: number;
	#onAdvance: AdvanceHandler | null;
	#setTimeoutFn: typeof setTimeout;
	#clearTimeoutFn: typeof clearTimeout;

	constructor(options: AnimationStepControllerOptions = {})
	{
		const {
			fallbackMs = ANIMATION_STEP_FALLBACK_MS,
			onAdvance = null,
			// Таймеры по умолчанию связываем с глобальным объектом: нативные
			// setTimeout/clearTimeout требуют this === window, иначе браузер бросает
			// «Illegal invocation» при вызове как метода инстанса. Инъекция таймеров
			// для тестов (sinon) остаётся приоритетной и перекрывает значение по умолчанию.
			setTimeoutFn = globalThis.setTimeout.bind(globalThis),
			clearTimeoutFn = globalThis.clearTimeout.bind(globalThis),
		} = options;

		this.#fallbackMs = fallbackMs;
		this.#onAdvance = onAdvance;
		this.#setTimeoutFn = setTimeoutFn;
		this.#clearTimeoutFn = clearTimeoutFn;
	}

	setAdvanceHandler(onAdvance: AdvanceHandler | null): void
	{
		this.#onAdvance = onAdvance;
	}

	get currentToken(): number
	{
		return this.#token;
	}

	/**
	 * Открывает новый шаг: увеличивает токен и вооружает резервный таймер. Таймер
	 * от предыдущего незавершённого шага снимается. Возвращает токен нового шага.
	 */
	openStep(): number
	{
		this.#clearTimer();
		this.#token += 1;
		const token: number = this.#token;
		this.#timerId = this.#setTimeoutFn((): void => {
			this.#settle(token);
		}, this.#fallbackMs);

		return token;
	}

	/**
	 * Запрашивает продвижение для указанного токена шага (вызывается совпавшим
	 * переходом). Продвигает, только если токен всё ещё соответствует текущему
	 * незавершённому шагу; иначе запрос игнорируется. Возвращает, произошло ли
	 * продвижение.
	 */
	settle(token: number): boolean
	{
		return this.#settle(token);
	}

	#settle(token: number): boolean
	{
		if (token !== this.#token)
		{
			// Устаревший токен: относится к уже сменённому шагу.
			return false;
		}

		if (this.#settledToken >= token)
		{
			// Этот шаг уже был продвинут (гонка таймера и перехода).
			return false;
		}

		this.#settledToken = token;
		this.#clearTimer();
		this.#onAdvance?.();

		return true;
	}

	#clearTimer(): void
	{
		if (this.#timerId !== null)
		{
			this.#clearTimeoutFn(this.#timerId);
			this.#timerId = null;
		}
	}

	stop(): void
	{
		this.#clearTimer();
		this.#token = 0;
		this.#settledToken = 0;
	}
}
