/**
 * @module mail/mailbox/folders-settings/src/folders-tree
 */
jn.define('mail/mailbox/folders-settings/src/folders-tree', (require, exports, module) => {
	class FoldersSettingsTree
	{
		normalizeAssignment(assignment)
		{
			if (!assignment || typeof assignment !== 'object')
			{
				return null;
			}

			return {
				dirMd5: String(assignment.dirMd5 || ''),
				formattedName: assignment.formattedName || '',
				path: assignment.path || '',
				type: assignment.type || 'custom',
			};
		}

		createAssignmentFromSelectorFolder(folder)
		{
			if (!folder)
			{
				return null;
			}

			return {
				dirMd5: String(folder.id),
				formattedName: folder.formattedName || folder.name,
				path: folder.path,
				type: folder.type || 'custom',
			};
		}

		normalizeFolders(items)
		{
			if (!Array.isArray(items))
			{
				return [];
			}

			return this.recalculateFolders(items.map((item) => this.createFolderNode(item)));
		}

		createFolderNode(folder, existingNode = null)
		{
			const existingChildren = Array.isArray(existingNode?.children) ? existingNode.children : [];
			const existingChildrenMap = new Map(existingChildren.map((child) => [child.dirMd5, child]));
			const serverChildren = Array.isArray(folder?.children) ? folder.children : [];
			const children = serverChildren.map((child) => this.createFolderNode(
				child,
				existingChildrenMap.get(String(child?.dirMd5 || '')),
			));

			return {
				id: Number(folder?.id || existingNode?.id || 0),
				dirMd5: String(folder?.dirMd5 || existingNode?.dirMd5 || ''),
				name: folder?.name || existingNode?.name || '',
				formattedName: folder?.formattedName || folder?.name || existingNode?.formattedName || existingNode?.name || '',
				path: folder?.path || existingNode?.path || '',
				level: Number(folder?.level || existingNode?.level || 1),
				isSync: existingNode?.isSync ?? folder?.isSync ?? false,
				isDisabled: folder?.isDisabled ?? existingNode?.isDisabled ?? false,
				isContainer: folder?.isContainer ?? existingNode?.isContainer ?? false,
				hasChild: Object.prototype.hasOwnProperty.call(folder || {}, 'hasChild')
					? folder.hasChild
					: Boolean(existingNode?.hasChild),
				type: folder?.type || existingNode?.type || 'custom',
				childrenLoaded: serverChildren.length > 0,
				expanded: existingNode?.expanded,
				isLoading: false,
				children,
			};
		}

		recalculateFolders(nodes)
		{
			return nodes.map((node) => {
				const children = this.recalculateFolders(Array.isArray(node.children) ? node.children : []);

				let totalChildrenCount = 0;
				let syncChildrenCount = 0;

				children.forEach((child) => {
					totalChildrenCount += 1 + child.totalChildrenCount;
					syncChildrenCount += (child.isSync ? 1 : 0) + child.syncChildrenCount;
				});

				return {
					...node,
					children,
					childrenLoaded: node.childrenLoaded || children.length > 0,
					totalChildrenCount,
					syncChildrenCount,
					expanded: node.expanded ?? (node.isContainer || syncChildrenCount > 0),
				};
			});
		}

		updateFolderTree(nodes, dirMd5, updater)
		{
			let changed = false;

			const nextNodes = nodes.map((node) => {
				if (node.dirMd5 === dirMd5)
				{
					changed = true;

					return updater(node);
				}

				if (Array.isArray(node.children) && node.children.length > 0)
				{
					const updatedChildren = this.updateFolderTree(node.children, dirMd5, updater);
					if (updatedChildren !== node.children)
					{
						changed = true;

						return {
							...node,
							children: updatedChildren,
						};
					}
				}

				return node;
			});

			return changed ? this.recalculateFolders(nextNodes) : nodes;
		}

		mergeLoadedChildren(nodes, dirMd5, children, hasChild)
		{
			const normalizedChildren = Array.isArray(children) ? children : [];

			return this.updateFolderTree(nodes, dirMd5, (node) => {
				const existingChildrenMap = new Map(
					(Array.isArray(node.children) ? node.children : []).map((child) => [child.dirMd5, child]),
				);

				return {
					...node,
					hasChild: Boolean(hasChild),
					childrenLoaded: true,
					isLoading: false,
					expanded: normalizedChildren.length > 0,
					children: normalizedChildren.map((child) => this.createFolderNode(
						child,
						existingChildrenMap.get(String(child?.dirMd5 || '')),
					)),
				};
			});
		}

		setAllFoldersSync(nodes, checked)
		{
			return this.recalculateFolders(nodes.map((node) => ({
				...node,
				isSync: node.isDisabled ? node.isSync : checked,
				children: this.setAllFoldersSync(Array.isArray(node.children) ? node.children : [], checked),
			})));
		}

		findFolder(nodes, dirMd5)
		{
			for (const node of nodes)
			{
				if (node.dirMd5 === dirMd5)
				{
					return node;
				}

				if (Array.isArray(node.children) && node.children.length > 0)
				{
					const child = this.findFolder(node.children, dirMd5);
					if (child)
					{
						return child;
					}
				}
			}

			return null;
		}

		collectAssignmentSelectorFolders(nodes, parentId = null, result = [])
		{
			nodes.forEach((node) => {
				let nextParentId = parentId;

				if (!node.isDisabled)
				{
					result.push({
						id: String(node.dirMd5),
						parentId,
						name: this.getFolderDisplayName(node),
						formattedName: node.formattedName || this.getFolderDisplayName(node),
						path: node.path,
						type: node.type,
						messageCount: 0,
					});

					nextParentId = String(node.dirMd5);
				}

				if (Array.isArray(node.children) && node.children.length > 0)
				{
					this.collectAssignmentSelectorFolders(node.children, nextParentId, result);
				}
			});

			return result;
		}

		collectSyncFolders(nodes, result = [])
		{
			nodes.forEach((node) => {
				if (!node.isDisabled)
				{
					result.push({
						dirMd5: node.dirMd5,
						value: node.isSync ? 1 : 0,
					});
				}

				if (Array.isArray(node.children) && node.children.length > 0)
				{
					this.collectSyncFolders(node.children, result);
				}
			});

			return result;
		}

		collectContainerFolders(nodes, result = [])
		{
			nodes.forEach((node) => {
				if (node.isContainer && node.hasChild && !node.childrenLoaded)
				{
					result.push(node.dirMd5);
				}

				if (Array.isArray(node.children) && node.children.length > 0)
				{
					this.collectContainerFolders(node.children, result);
				}
			});

			return result;
		}

		isAllSelected(nodes)
		{
			const folders = this.collectSyncFolders(nodes, []);

			return folders.length > 0 && folders.every((folder) => folder.value === 1);
		}

		hasUnloadedChildren(nodes)
		{
			for (const node of nodes)
			{
				if (node.hasChild && !node.childrenLoaded && !node.isDisabled)
				{
					return true;
				}

				if (Array.isArray(node.children) && node.children.length > 0)
				{
					if (this.hasUnloadedChildren(node.children))
					{
						return true;
					}
				}
			}

			return false;
		}

		canExpandNode(node, maxLevel)
		{
			const normalizedMaxLevel = Number(maxLevel || 0);

			if (!node.hasChild)
			{
				return false;
			}

			if (node.childrenLoaded && node.totalChildrenCount === 0)
			{
				return false;
			}

			if (normalizedMaxLevel > 0 && node.level >= normalizedMaxLevel)
			{
				return false;
			}

			return true;
		}

		getFolderDisplayName(node)
		{
			if (!node?.isContainer)
			{
				return node?.name || '';
			}

			return (node.name || '').replace(/^\[(.+)]$/, '$1');
		}
	}

	module.exports = { FoldersSettingsTree };
});
