type CreateBoardOptions = {
	folderId: number;
	parentWidget?: object;
};

declare function createBoard(options: CreateBoardOptions): Promise<void>;

export { CreateBoardOptions, createBoard };
