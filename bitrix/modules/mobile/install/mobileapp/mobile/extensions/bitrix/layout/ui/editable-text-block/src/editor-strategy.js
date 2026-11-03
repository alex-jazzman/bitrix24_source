/**
 * @module layout/ui/editable-text-block/src/editor-strategy
 */
jn.define('layout/ui/editable-text-block/src/editor-strategy', (require, exports, module) => {
	const EditorType = Object.freeze({
		LEGACY: 'legacy',
		NATIVE: 'native',
	});

	const resolveEditorStrategy = ({
		editorProps = {},
		Feature = null,
		TextEditor: NativeTextEditor = null,
		isOffline = () => false,
	} = {}) => {
		const requested = editorProps.useNativeTextEditor === true;
		const hasNativeTextEditor = NativeTextEditor !== null && NativeTextEditor !== undefined;
		let supported = false;

		if (requested && hasNativeTextEditor)
		{
			try
			{
				supported = Feature?.isTextEditorSupported?.() === true;
			}
			catch
			{
				supported = false;
			}
		}

		const readOnly = editorProps.readOnly === true || isOffline() === true;

		return Object.freeze({
			editorType: requested && supported ? EditorType.NATIVE : EditorType.LEGACY,
			readOnly,
		});
	};

	const createEditorSessionGuard = () => {
		let currentSession = null;
		let nextSessionId = 0;

		const isCurrent = (session) => currentSession === session;

		const start = (strategy) => {
			nextSessionId += 1;
			currentSession = Object.freeze({
				id: nextSessionId,
				strategy: Object.freeze({
					editorType: strategy.editorType,
					readOnly: strategy.readOnly,
				}),
			});

			return currentSession;
		};

		const close = (session) => {
			if (isCurrent(session))
			{
				currentSession = null;
			}
		};

		const run = async (session, operation, publish) => {
			if (!isCurrent(session))
			{
				return false;
			}

			const result = await operation();
			if (!isCurrent(session))
			{
				return false;
			}

			await publish(result);

			return true;
		};

		return Object.freeze({
			start,
			close,
			isCurrent,
			run,
		});
	};

	module.exports = {
		EditorType,
		resolveEditorStrategy,
		createEditorSessionGuard,
	};
});
