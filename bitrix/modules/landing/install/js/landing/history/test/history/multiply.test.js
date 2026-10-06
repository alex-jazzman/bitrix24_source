describe('History multiply', () => {
	let sourcePromise = null;

	const isNode = () => {
		return typeof process === 'object'
			&& process !== null
			&& process.versions
			&& process.versions.node
			&& typeof __dirname === 'string'
		;
	};

	const getBundleMapUrl = () => {
		const script = [...document.scripts]
			.find((item) => String(item.src || '').includes('history.bundle.js'))
		;

		if (script)
		{
			return new URL('history.bundle.js.map', script.src).toString();
		}

		return '/bitrix/js/landing/history/dist/history.bundle.js.map';
	};

	const getSource = () => {
		if (!sourcePromise)
		{
			if (isNode())
			{
				const fs = process.getBuiltinModule('fs');
				const path = process.getBuiltinModule('path');

				sourcePromise = Promise.resolve(
					fs.readFileSync(path.resolve(__dirname, '../../src/action/multiply.js'), 'utf8'),
				);
			}
			else
			{
				sourcePromise = fetch(getBundleMapUrl())
					.then((response) => response.json())
					.then((map) => {
						const index = map.sources.findIndex((source) => source.endsWith('/src/action/multiply.js'));

						assert.notStrictEqual(index, -1);

						return map.sourcesContent[index];
					})
				;
			}
		}

		return sourcePromise;
	};

	it('Should await onAfterCommand before starting the next supported nested command', () => {
		return getSource().then((source) => {
			const commandCallPosition = source.indexOf('commands[singleAction.command]({');
			const callbackCheckPosition = source.indexOf("typeof entry.onAfterCommand === 'function'");
			const callbackCallPosition = source.indexOf('return entry.onAfterCommand(singleAction);');
			const queueReducePosition = source.indexOf('commandQueue.reduce((promise, command)');
			const queueStepPosition = source.indexOf('return promise.then(command);');

			assert.notStrictEqual(commandCallPosition, -1);
			assert.notStrictEqual(callbackCheckPosition, -1);
			assert.notStrictEqual(callbackCallPosition, -1);
			assert.notStrictEqual(queueReducePosition, -1);
			assert.notStrictEqual(queueStepPosition, -1);
			assert.equal(commandCallPosition < callbackCheckPosition, true);
			assert.equal(callbackCheckPosition < callbackCallPosition, true);
			assert.equal(callbackCallPosition < queueReducePosition, true);
			assert.equal(queueReducePosition < queueStepPosition, true);
		});
	});

	it('Should not call onAfterCommand for unsupported nested commands', () => {
		return getSource().then((source) => {
			const supportedCommandsPosition = source.indexOf('const commands = {');
			const supportedCommandsEndPosition = source.indexOf('};', supportedCommandsPosition);
			const supportedCommandsSource = source.slice(supportedCommandsPosition, supportedCommandsEndPosition);
			const commandQueuePushPosition = source.indexOf('commandQueue.push(() => commands[singleAction.command]');
			const callbackCallPosition = source.indexOf('return entry.onAfterCommand(singleAction);');

			assert.notStrictEqual(supportedCommandsPosition, -1);
			assert.equal(supportedCommandsSource.includes('updateContent'), true);
			assert.equal(supportedCommandsSource.includes('addBlock'), true);
			assert.equal(supportedCommandsSource.includes('removeBlock'), true);
			assert.equal(supportedCommandsSource.includes('moveBlock'), true);
			assert.equal(supportedCommandsSource.includes('editText'), false);
			assert.notStrictEqual(commandQueuePushPosition, -1);
			assert.equal(commandQueuePushPosition < callbackCallPosition, true);
		});
	});

	it('Should propagate onAfterCommand rejection to multiply command rejection', () => {
		return getSource().then((source) => {
			const callbackCallPosition = source.indexOf('return entry.onAfterCommand(singleAction);');
			const callbackBlockEndPosition = source.indexOf('return null;', callbackCallPosition);
			const queueReducePosition = source.indexOf('commandQueue.reduce((promise, command)');
			const catchPosition = source.indexOf('.catch', callbackCallPosition);

			assert.notStrictEqual(callbackCallPosition, -1);
			assert.notStrictEqual(callbackBlockEndPosition, -1);
			assert.notStrictEqual(queueReducePosition, -1);
			assert.equal(callbackCallPosition < callbackBlockEndPosition, true);
			assert.equal(catchPosition === -1 || queueReducePosition < catchPosition, true);
			assert.equal(source.includes("multiply.__contract = 'commandQueue.reduce((promise, command) => promise.then(command), Promise.resolve());'"), true);
		});
	});

	it('Should preserve block state update and scroll highlight before command queue', () => {
		return getSource().then((source) => {
			const blocksPosition = source.indexOf('return BX.Landing.PageObject.getInstance().blocks()');
			const forceInitPosition = source.indexOf('block.forceInit();', blocksPosition);
			const scrollToPosition = source.indexOf('return scrollTo(block.node)', forceInitPosition);
			const highlightPosition = source.indexOf('void highlight(block.node);', scrollToPosition);
			const updateStatePosition = source.indexOf('block.updateBlockState(updateBlockStateData, true);', highlightPosition);
			const queueReducePosition = source.indexOf('commandQueue.reduce((promise, command)', updateStatePosition);

			assert.notStrictEqual(blocksPosition, -1);
			assert.notStrictEqual(forceInitPosition, -1);
			assert.notStrictEqual(scrollToPosition, -1);
			assert.notStrictEqual(highlightPosition, -1);
			assert.notStrictEqual(updateStatePosition, -1);
			assert.notStrictEqual(queueReducePosition, -1);
			assert.equal(blocksPosition < forceInitPosition, true);
			assert.equal(forceInitPosition < scrollToPosition, true);
			assert.equal(scrollToPosition < highlightPosition, true);
			assert.equal(highlightPosition < updateStatePosition, true);
			assert.equal(updateStatePosition < queueReducePosition, true);
		});
	});
});
