// noinspection JSAnnotator

(function () {

    if (BX.IthiveGanttChart) {
        return;
    }

    //region IthiveGanttChart
    /*==================================GanttChart==================================*/
    BX.IthiveGanttChart = function (domNode, removeClosed ,currentDatetime, settings) {
        //Dom layout
        this.layout = {
            root: null,
            list: null,
            tree: null,
            treeStub: null,
            gutter: null,
            timelineInner: null,
            scalePrimary: null,
            scaleSecondary: null,
            timelineData: null,
            currentDay: null
        };
        this.isFirstRespon = true
        this.benchTime = new Date().getTime();
        this.settings = settings || {};
        this.removeClosed=removeClosed
        this.userProfileUrl = BX.type.isNotEmptyString(settings.userProfileUrl) ? settings.userProfileUrl : "";

        this.chartContainer = {
            element: BX.type.isDomNode(domNode) ? domNode : null,
            padding: 30,
            width: 0,
            pos: {left: 0, top: 0},
            minPageX: 0,
            maxPageX: 0
        };
        this.adjustChartContainer();

        this.gutterOffset = this.normalizeGutterOffset(BX.type.isNumber(settings.gutterOffset) ? settings.gutterOffset : 300);

        this.timelineDataOffset = null;
        this.dragClientX = 0;

        this.minBarWidth = 4;
        this.minGroupBarWidth = 8;
        this.arrowBarWidth = 4;
        this.firstDepthLevelOffset = 33;
        this.depthLevelOffset = 20;
        this.endlessBarDefaultDuration = 9;

        this.currentDatetime = BX.Tasks.Date.isDate(currentDatetime) ? BX.IthiveGanttChart.convertDateToUTC(currentDatetime) : BX.IthiveGanttChart.convertDateToUTC(new Date());
        this.currentDate = new Date(Date.UTC(this.currentDatetime.getUTCFullYear(), this.currentDatetime.getUTCMonth(), this.currentDatetime.getUTCDate(), 0, 0, 0, 0));

        this.timeline = new Timeline(this);
        this.calendar = new BX.Tasks.Calendar(this.settings);
        this.printSettings = null;
        this.canDragTasks = this.settings.canDragTasks === true;
        this.canCreateDependency = this.settings.canCreateDependency !== false;

        this.tasks = {};
        this.respons = {
            0: new GanttRespon(this, 0, "Default Respon")
        };
        this.dependencies = {};

        this.datetimeFormat = BX.type.isNotEmptyString(settings.datetimeFormat) ? settings.datetimeFormat : "DD.MM.YYYY HH:MI:SS";
        this.dateFormat = BX.type.isNotEmptyString(settings.dateFormat) ? settings.dateFormat : "DD.MM.YYYY";

        this.tooltip = new GanttTooltip(this);
        this.pointer = new DependencyPointer(this);
        this.allowRowHover = true;

        //Chart Events
        if (this.settings.events) {
            for (var eventName in this.settings.events) {
                if (this.settings.events.hasOwnProperty(eventName)) {
                    BX.addCustomEvent(this, eventName, this.settings.events[eventName]);
                }
            }
        }

        BX.bind(window, "resize", BX.proxy(this.onWindowResize, this));
    };

    BX.IthiveGanttChart.prototype.draw = function () {
        if (this.chartContainer.element === null) {
            return;
        }

        this.drawLayout();
        this.drawTasks();

        this.timeline.autoScroll();
    };
    BX.IthiveGanttChart.prototype.recalculateTimeInHours = function (time){
        let hours = time / 3600;
        if (hours % 1 !== 0) {
            hours = hours.toFixed(1);
        }
        return hours;
    }
    BX.IthiveGanttChart.prototype.drawLayout = function () {
        if (!this.chartContainer.element || this.layout.root != null) {
            return;
        }

        // noinspection JSAnnotator
        this.layout.root = BX.create("div", {
            props: {className: "task-gantt"}, style: {width: this.chartContainer.width + "px"}, children: [

                (this.layout.list = BX.create("div", {
                    props: {className: "task-gantt-list"},
                    style: {width: this.gutterOffset + "px"},
                    children: [
                        BX.create("div", {
                            props: {className: "task-gantt-list-title"},
                            //text: BX.message("TASKS_GANTT_CHART_TITLE"),
                            children: [
                                BX.create("div", {
                                    props: {className: "text-title"},
                                    children: [
                                        BX.create("div", {text: BX.message("TASKS_GANTT_CHART_TITLE")})
                                    ],
                                }),
                                BX.create("div", {
                                    style: {
                                        width: '70%',
                                        'margin-left': '30%'
                                    },
                                    children: [
                                        BX.create("div", {
                                            style: {
                                                width: '30%',
                                            },
                                            children: [
                                                BX.create("div", {props: {className: "icon-count", title: BX.message('ICON_COUNT')}})
                                            ],
                                        }),
                                        BX.create("div", {
                                            children: [
                                                BX.create("div", {props: {className: "icon-timeEmpty", title: BX.message('ICON_TIME_EMPTY')}})
                                            ],
                                        }),
                                        BX.create("div", {
                                            children: [
                                                BX.create("div", {props: {className: "icon-deadline", title: BX.message('ICON_DEADLINE')}})
                                            ],
                                        }),
                                        BX.create("div", {
                                            children: [
                                                BX.create("div", {props: {className: "icon-moderate", title: BX.message('ICON_MODERATE')}})
                                            ],
                                        }),
                                        BX.create("div", {
                                            style:{
                                                width: '8%',
                                            },
                                            children: [
                                                BX.create("div", {})
                                            ],
                                        }),
                                    ],
                                }),
                            ]
                        }),
                        (this.layout.tree = BX.create("div", {props: {className: "task-gantt-items"}})),
                        (this.layout.gutter = BX.create("div", {
                            props: {className: "task-gantt-gutter"}, events: {
                                mousedown: BX.proxy(this.onGutterMouseDown, this)
                            }
                        })),
                        (this.layout.treeStub = BX.create("div", {
                            props: {className: "task-gantt-item task-gantt-item-stub"},
                            attrs: {"data-respon-id": "stub"}
                        }))
                    ]
                })),

                (this.layout.timeline = BX.create("div", {
                    props: {
                        className: "task-gantt-timeline"
                    },
                    events: {
                        scroll: this.handleTimelineScroll.bind(this)
                    },
                    children: [
                        (this.layout.timelineInner = BX.create("div", {
                            props: {className: "task-gantt-timeline-inner"},
                            events: {
                                mousedown: BX.proxy(this.onTimelineMouseDown, this)
                            },
                            children: [
                                BX.create("div", {
                                    props: {className: "task-gantt-timeline-head"}, children: [
                                        (this.layout.scalePrimary = BX.create("div", {props: {className: "task-gantt-scale-primary"}})),
                                        (this.layout.scaleSecondary = BX.create("div", {props: {className: "task-gantt-scale-secondary"}}))
                                    ]
                                }),
                                (this.layout.timelineData = BX.create("div", {props: {className: "task-gantt-timeline-data"}})),
                                (this.layout.currentDay = BX.create("div", {props: {className: "task-gantt-current-day"}})),
                                this.tooltip.getLayout(),
                                this.pointer.getLayout()
                            ]
                        }))
                    ]
                }))
            ]
        });



        this.timeline.draw();
        this.chartContainer.element.appendChild(this.layout.root);
    };

    BX.IthiveGanttChart.prototype.drawTasks = function () {
        if (this.layout.root === null) {
            return;
        }

        var taskTree = document.createDocumentFragment();
        var taskData = document.createDocumentFragment();
        var respons = this.getSortedRespons();
        for (var i = 0; i < respons.length; i++) {
            if (respons[i].id != 0) {
                taskTree.appendChild(respons[i].createItem());
                taskData.appendChild(respons[i].createBars());
            }

            this.drawTasksRecursive(respons[i].tasks, taskTree, taskData);
        }

        BX.cleanNode(this.layout.tree);
        BX.cleanNode(this.layout.timelineData);

        this.layout.tree.appendChild(taskTree);
        this.layout.timelineData.appendChild(taskData);

        this.adjustChartContainer();
        this.drawDependencies();
    };

    BX.IthiveGanttChart.prototype.drawTasksRecursive = function (tasks, taskTree, taskData) {
        for (var i = 0, length = tasks.length; i < length; i++) {
            taskTree.appendChild(tasks[i].createItem());
            taskData.appendChild(tasks[i].createBars());
        }
    };

    BX.IthiveGanttChart.prototype.drawDependencies = function () {
        for (var dependency in this.dependencies) {
            if (this.dependencies.hasOwnProperty(dependency)) {
                this.dependencies[dependency].draw();
            }
        }
    };

    BX.IthiveGanttChart.prototype.autoExpandTimeline = function (dates) {
        this.timeline.autoExpandTimeline(dates);
    };

    BX.IthiveGanttChart.prototype.adjustChartContainer = function () {
        if (this.chartContainer.element != null) {
            var contWidth = this.chartContainer.width;
            this.chartContainer.width = this.chartContainer.element.offsetWidth;
            this.chartContainer.pos = BX.pos(this.chartContainer.element);
            this.adjustChartContainerPadding();

            if (this.layout.root !== null && contWidth !== this.chartContainer.width) {
                this.layout.root.style.width = this.chartContainer.width + "px";
                this.getTimeline().renderHeader();
            }
        }
    };

    BX.IthiveGanttChart.prototype.adjustChartContainerPadding = function () {
        if (this.chartContainer.element != null) {
            this.chartContainer.minPageX = this.chartContainer.pos.left + this.gutterOffset + this.chartContainer.padding;
            this.chartContainer.maxPageX = this.chartContainer.pos.left + this.chartContainer.width - this.chartContainer.padding;
        }
    };

    BX.IthiveGanttChart.prototype.addResponFromJSON = function (json) {
        if (!json || typeof (json) !== "object") {
            return null;
        }

        if (json.id && this.respons[json.id]) {
            return this.respons[json.id];
        }

        var respon = this.__createRespon(json.id, json.name);
        if (respon == null) {
            return null;
        }
        if (json.photo) {
            respon.photo = json.photo;
        }

        if (json.absence) {
            respon.absence = json.absence;
        }

        if (json.workHours) {
            respon.workHours = json.workHours;
        }
        if (BX.type.isBoolean(json.opened)) {
            respon.opened = json.opened;
        }

        if (BX.type.isBoolean(json.canCreateTasks)) {
            respon.canCreateTasks = json.canCreateTasks;
        }

        if (BX.type.isBoolean(json.canEditTasks)) {
            respon.canEditTasks = json.canEditTasks;
        }

        if (BX.type.isArray(json.menuItems)) {
            respon.menuItems = json.menuItems;
        }
        respon.extranet = json.extranet;
        respon.taskWithoutTime = json.taskWithoutTime;
        respon.myTaskWithoutTime = json.myTaskWithoutTime;
        this.__addRespon(respon);

        if (this.layout.root != null) {
            this.__addResponDynamic(respon);
        }

        return respon;
    };

    BX.IthiveGanttChart.prototype.addResponsFromJSON = function (arResponJSON) {
        if (BX.type.isArray(arResponJSON)) {
            for (var i = 0; i < arResponJSON.length; i++) {
                this.addResponFromJSON(arResponJSON[i]);
            }
        }
    };
    BX.IthiveGanttChart.prototype.__createRespon = function (id, name) {
        if (!BX.type.isNumber(id) || !BX.type.isNotEmptyString(name)) {
            return null;
        }

        return new GanttRespon(this, id, name);
    };

    BX.IthiveGanttChart.prototype.__addRespon = function (ganttRespon) {
        if (!ganttRespon || typeof (ganttRespon) != "object" || !(ganttRespon instanceof GanttRespon)) {
            return null;
        }

        if (this.respons[ganttRespon.id]) {
            return this.respons[ganttRespon.id];
        }

        this.respons[ganttRespon.id] = ganttRespon;

        return ganttRespon;
    };

    BX.IthiveGanttChart.prototype.__addResponDynamic = function (ganttRespon) {
        var item = ganttRespon.createItem();
        var row = ganttRespon.createBars();
        var respons = this.getSortedRespons();
        var position = null;
        for (var i = 0; i < respons.length; i++) {
            if (respons[i] === ganttRespon) {
                position = i;
                break;
            }
        }

        if (position !== null && respons[position + 1]) {
            this.layout.tree.insertBefore(item, respons[position + 1].layout.item);
            this.layout.timelineData.insertBefore(row, respons[position + 1].layout.row);
        } else {
            this.layout.tree.appendChild(item);
            this.layout.timelineData.appendChild(row);
        }
    };

    BX.IthiveGanttChart.prototype.addTask = function (id, name, status, dateCreated) {
        if (id && this.tasks[id])
            return this.tasks[id];

        var task = this.__createTask(id, name, status, dateCreated);
        if (!task)
            return null;

        task.setRespon(0);
        this.__addTask(task);

        this.drawTasks();

        return task;
    };

    BX.IthiveGanttChart.prototype.addTaskFromJSON = function (taskJson, redraw) {
        if (!taskJson || typeof (taskJson) != "object") {
            return null;
        }

        if (taskJson.id && this.tasks[taskJson.id]) {
            return this.tasks[taskJson.id];
        }

        var task = this.__createTask(taskJson.id, taskJson.name, taskJson.status, taskJson.dateCreated);
        if (task == null) {
            return null;
        }
        task.setTaskFromJSON(taskJson);
        task.setRespon(taskJson.responsibleId);
        task.access = taskJson.access
        this.__addTask(task);

        redraw = redraw !== false;

        if (redraw) {
            this.drawTasks();
        }

        return task;
    };

    BX.IthiveGanttChart.prototype.addTasksFromJSON = function (arTaskJSON) {
        if (BX.type.isArray(arTaskJSON)) {
            for (var i = 0; i < arTaskJSON.length; i++) {
                this.addTaskFromJSON(arTaskJSON[i], false);
            }

            this.drawTasks();
        }
    };

    BX.IthiveGanttChart.prototype.__createTask = function (id, name, status, dateCreated) {
        if (!BX.type.isNumber(id) || !BX.type.isNotEmptyString(name) || !BX.type.isNotEmptyString(status))
            return null;

        return new GanttTask(this, id, name, status, dateCreated);
    };

    BX.IthiveGanttChart.prototype.__addTask = function (ganttTask) {
        if (!ganttTask || typeof (ganttTask) != "object" || !(ganttTask instanceof GanttTask))
            return null;

        if (this.tasks[ganttTask.id])
            return this.tasks[ganttTask.id];

        this.tasks[ganttTask.id] = ganttTask;

        var taskMinDate = ganttTask.getMinDate();
        var taskMaxDate = ganttTask.getMaxDate();

        this.autoExpandTimeline([taskMinDate, taskMaxDate]);

        return ganttTask;
    };

    BX.IthiveGanttChart.prototype.removeTask = function (taskId) {
        var task = this.getTaskById(taskId);
        if (!task)
            return;

        if (task.respon != null) {
            task.respon.removeTask(task);
            task.respon.recalculateHours();
        }

        var dependencies = task.getDependencies();
        for (var i = 0; i < dependencies.length; i++) {
            var dependency = dependencies[i];
            this.removeDependency(dependency);
        }

        delete this.tasks[taskId];

        if (this.layout.root != null) {
            this.layout.tree.removeChild(task.layout.item);
            this.layout.timelineData.removeChild(task.layout.row);
        }

        this.drawDependencies();

        BX.onCustomEvent(this, "onTaskDelete", [task]);
    };

    BX.IthiveGanttChart.prototype.updateTask = function (taskId, json) {

        var task = this.getTaskById(taskId);
        if (!task) {
            return false;
        }
        if(((json.TIME_ESTIMATE<1||!json.ALLOW_TIME_TRACKING)&&json.status!=='completed')||
            (json.status==='completed'&&json.realStatus==='5')){
            if (this.removeClosed) {
                this.removeTask(taskId)
            } else {
                task.hoursInDay = 0
                var respon = this.getResponById(task.responsibleId);
                respon.recalculateHours();
            }
        }else{
        task.setTaskFromJSON(json);
        task.updateLags();
        task.redraw();
        BX.onCustomEvent(this, "onTaskUpdate", [task]);
        }
        return true;
    };

    BX.IthiveGanttChart.prototype.moveTask = function (taskId, targetId, after) {
        var task = this.getTaskById(taskId);
        var target = this.getTaskById(targetId);

        if (!task || !target || task === target) {
            return;
        }
        task.respon.removeTask(task);
        var children = target.respon.tasks;
        var index = BX.util.array_search(target, children);
        if (index < 0) {
            return;
        }


        task.responsibleId = target.responsibleId;
        task.respon = target.respon;

        this.drawTasks();
    };

    BX.IthiveGanttChart.prototype.moveTaskToRespon = function (taskId, responsibleId) {
        var task = this.getTaskById(taskId);
        var respon = this.getResponById(responsibleId);

        if (!task || !respon) {
            return;
        }
        task.respon.removeTask(task);

        respon.addTask(task);

        task.depthLevel = 1;
        task.responsibleId = respon.id;
        task.respon = respon;

        this.drawTasks();
    };

    BX.IthiveGanttChart.prototype.autoSchedule = function () {
        for (var i = 0, length = this.tasks.length; i < length; i++) {
            this.tasks[i].schedule();
        }
    };

    BX.IthiveGanttChart.prototype.addDependency = function (from, to, type) {
        if (!this.isValidDependency(from, to)) {
            return null;
        }

        var id = this.getDependencyId(from, to);
        if (this.dependencies[id]) {
            return this.dependencies[id];
        }

        var dependency = new GanttDependency(this, id, from, to, type);
        this.dependencies[dependency.id] = dependency;

        var predecessor = this.getTaskById(from);
        var successor = this.getTaskById(to);
        predecessor.addSuccessor(dependency);
        successor.addPredecessor(dependency);

        if (this.layout.root !== null) {
            dependency.draw();
        }

        return dependency;
    };

    BX.IthiveGanttChart.prototype.getDependency = function (from, to) {
        var id = this.getDependencyId(from, to);
        if (this.dependencies[id]) {
            return this.dependencies[id];
        }

        return null;
    };

    BX.IthiveGanttChart.prototype.getDependencyId = function (from, to) {
        var fromTask = this.getTaskById(from);
        var toTask = this.getTaskById(to);

        return fromTask && toTask ? fromTask.id + "_" + toTask.id : null;
    };

    BX.IthiveGanttChart.prototype.isValidDependency = function (from, to) {
        if (!BX.type.isNumber(from) || !BX.type.isNumber(to) || from === to) {
            return false;
        }

        var predecessor = this.getTaskById(from);
        var successor = this.getTaskById(to);
        if (!predecessor || !successor || !predecessor.isRealDateEnd || !successor.isRealDateEnd) {
            return false;
        }

        return !this.isCircularDependency(from, to);
    };

    BX.IthiveGanttChart.prototype.isCircularDependency = function (from, to) {
        var predecessor = this.getTaskById(from);
        var successor = this.getTaskById(to);

        return predecessor && successor && (predecessor.hasSuccessor(to) || successor.hasSuccessor(from))
    };

    BX.IthiveGanttChart.prototype.canAddDependency = function (from, to) {
        var predecessor = this.getTaskById(from);
        var successor = this.getTaskById(to);

        return predecessor && successor && predecessor.canEditPlanDates && successor.canEditPlanDates;
    };

    BX.IthiveGanttChart.prototype.addDependencyFromJSON = function (json) {
        if (!json || typeof (json) !== "object") {
            return null;
        }

        return this.addDependency(json.from, json.to, json.type);
    };

    BX.IthiveGanttChart.prototype.addDependenciesFromJSON = function (arDependencyJSON) {
        if (BX.type.isArray(arDependencyJSON)) {
            for (var i = 0; i < arDependencyJSON.length; i++) {
                this.addDependencyFromJSON(arDependencyJSON[i]);
            }
        }
    };

    BX.IthiveGanttChart.prototype.removeDependency = function (dependency) {
        if (!dependency || !dependency instanceof GanttDependency) {
            return;
        }

        var predecessor = this.getTaskById(dependency.from);
        var successor = this.getTaskById(dependency.to);

        predecessor && predecessor.removeSuccessor(dependency);
        successor && successor.removePredecessor(dependency);

        dependency.clear();
        delete this.dependencies[dependency.id];
    };

    /**
     *
     * @return {Timeline}
     */
    BX.IthiveGanttChart.prototype.getTimeline = function () {
        return this.timeline;
    };

    /**
     * Returns task by id
     * @param {Number} taskId
     * @returns {GanttTask}
     */
    BX.IthiveGanttChart.prototype.getTaskById = function (taskId) {
        if (this.tasks[taskId])
            return this.tasks[taskId];

        return null;
    };

    BX.IthiveGanttChart.prototype.getResponById = function (responsibleId) {
        if (this.respons[responsibleId])
            return this.respons[responsibleId];

        return null;
    };

    BX.IthiveGanttChart.prototype.getDefaultRespon = function () {
        return this.getResponById(0);
    };

    BX.IthiveGanttChart.prototype.getSortedRespons = function () {
        var respons = [];
        for (var responsibleId in this.respons) {
            respons.push(this.respons[responsibleId]);
        }

        return respons.sort(function (a, b) {
            return a.id - b.id
        });
    };

    BX.IthiveGanttChart.prototype.getLastRespon = function () {
        var sortedRespons = this.getSortedRespons();
        return sortedRespons[sortedRespons.length - 1];
    };

    BX.IthiveGanttChart.prototype.getPreviousRespon = function (currentresponsibleId) {
        var responsibleId = 0;
        var respons = this.getSortedRespons();
        for (var i = 0; i < respons.length; i++) {
            if (respons[i].id === currentresponsibleId) {
                break;
            }
            responsibleId = respons[i].id;
        }

        return this.getResponById(responsibleId);
    };

    /**
     * Returns root previous task
     * @param {Number} sourceTaskId
     * @returns {GanttTask|null}
     */
    BX.IthiveGanttChart.prototype.getPreviousTask = function (sourceTaskId) {
        var sourceTask = this.getTaskById(sourceTaskId);
        if (!sourceTask) {
            return null;
        }

        var prevTask = sourceTask.getPreviousTask();
        if (prevTask) {
            return prevTask;
        } else if (sourceTask.responsibleId === 0) {
            return null;
        }

        var prevRespons = [this.getDefaultRespon()];
        var respons = this.getSortedRespons();
        for (var i = 0; i < respons.length; i++) {
            if (respons[i].id === sourceTask.responsibleId) {
                break;
            }

            prevRespons.unshift(respons[i]);
        }

        for (i = 0; i < prevRespons.length; i++) {
            var prevRespon = prevRespons[i];
            var childrenCnt = prevRespon.tasks.length;
            if (childrenCnt) {
                return prevRespon.tasks[childrenCnt - 1];
            }
        }

        return null;
    };

    /**
     * Returns root next task
     * @param {Number} sourceTaskId
     * @returns {GanttTask|null}
     */
    BX.IthiveGanttChart.prototype.getNextTask = function (sourceTaskId) {
        var sourceTask = this.getTaskById(sourceTaskId);
        if (!sourceTask) {
            return null;
        }

        var nextTask = sourceTask.getNextTask();
        if (nextTask) {
            return nextTask;
        }

        var nextRespons = [];
        var respons = this.getSortedRespons();
        for (var i = 0, found = false; i < respons.length; i++) {
            if (found) {
                nextRespons.push(respons[i]);
            }

            if (respons[i].id === sourceTask.responsibleId) {
                found = true;
            }
        }

        for (i = 0; i < nextRespons.length; i++) {
            var nextRespon = nextRespons[i];
            var childrenCnt = nextRespon.tasks.length;
            if (childrenCnt) {
                return nextRespon.tasks[0];
            }
        }

        return null;
    };

    BX.IthiveGanttChart.prototype.profile = function (title) {
        if (typeof (console) !== "undefined") {
            var currentTime = new Date().getTime();
            this.benchTime = new Date().getTime();
        }
    };

    BX.IthiveGanttChart.prototype.normalizeGutterOffset = function (offset) {
        var minOffset = 500;
        var maxOffset = 500;
        return Math.min(Math.max(offset, minOffset), maxOffset > minOffset ? maxOffset : minOffset);
    };

    BX.IthiveGanttChart.prototype.setGutterOffset = function (offset) {
        this.gutterOffset = this.normalizeGutterOffset(offset);
        this.layout.list.style.width = this.gutterOffset + "px";
        return this.gutterOffset;
    };

    /*==========Handlers==========*/
    BX.IthiveGanttChart.prototype.onGutterMouseDown = function (event) {
        event = event || window.event;
        if (!BX.IthiveGanttChart.isLeftClick(event))
            return;

        BX.bind(document, "mouseup", BX.proxy(this.onGutterMouseUp, this));
        BX.bind(document, "mousemove", BX.proxy(this.onGutterMouseMove, this));

        this.gutterClientX = event.clientX;
        this.allowRowHover = false;

        document.onmousedown = BX.False;
        document.body.onselectstart = BX.False;
        document.body.ondragstart = BX.False;
        document.body.style.MozUserSelect = "none";
        document.body.style.cursor = "ew-resize";
    };

    BX.IthiveGanttChart.prototype.onGutterMouseUp = function (event) {
        event = event || window.event;

        BX.unbind(document, "mouseup", BX.proxy(this.onGutterMouseUp, this));
        BX.unbind(document, "mousemove", BX.proxy(this.onGutterMouseMove, this));

        this.allowRowHover = true;

        document.onmousedown = null;
        document.body.onselectstart = null;
        document.body.ondragstart = null;
        document.body.style.MozUserSelect = "";
        document.body.style.cursor = "default";

        BX.onCustomEvent(this, "onGutterResize", [this.gutterOffset]);
    };

    BX.IthiveGanttChart.prototype.onGutterMouseMove = function (event) {
        event = event || window.event;

        this.setGutterOffset(this.gutterOffset + (event.clientX - this.gutterClientX));
        this.adjustChartContainerPadding();
        this.gutterClientX = event.clientX;
    };

    BX.IthiveGanttChart.prototype.getTimelineDataOffset = function () {
        if (this.timelineDataOffset === null) {
            this.timelineDataOffset = this.layout.timelineData.offsetTop;
        }

        return this.timelineDataOffset;
    };

    BX.IthiveGanttChart.prototype.onTimelineMouseDown = function (event) {
        event = event || window.event;
        if (!BX.IthiveGanttChart.isLeftClick(event))
            return;

        //c onsole.log("onTimelineMouseDown");
        this.dragClientX = event.clientX;

        BX.TaskQuickInfo.hide();

        BX.IthiveGanttChart.startDrag(document.body, {
            mouseup: BX.proxy(this.onTimelineMouseUp, this),
            mousemove: BX.proxy(this.onTimelineMouseMove, this)
        });

        BX.PreventDefault(event);
    };

    BX.IthiveGanttChart.prototype.onTimelineMouseUp = function (event) {
        event = event || window.event;
        //c onsole.log("onTimelineMouseUp");
        BX.IthiveGanttChart.stopDrag(document.body, {
            mouseup: BX.proxy(this.onTimelineMouseUp, this),
            mousemove: BX.proxy(this.onTimelineMouseMove, this)
        });

        this.dragClientX = 0;
    };

    BX.IthiveGanttChart.prototype.onTimelineMouseMove = function (event) {
        event = event || window.event;
        //c onsole.log("onTimelineMouseMove");
        var scrollLeft = this.layout.timeline.scrollLeft + (this.dragClientX - event.clientX);
        this.layout.timeline.scrollLeft = scrollLeft < 0 ? 0 : scrollLeft;

        this.dragClientX = event.clientX;
    };

    BX.IthiveGanttChart.prototype.onWindowResize = function (event) {
        this.adjustChartContainer();
    };

    BX.IthiveGanttChart.prototype.onPrintClick = function (event) {
        if (this.printSettings === null) {
            this.printSettings = new BX.Scheduler.PrintSettings(this.getTimeline());
        }
        this.printSettings.show();
    };

    BX.IthiveGanttChart.prototype.handleTimelineScroll = function () {
        this.timeline.renderHeader();
    };

    /*========Static Methods=====*/
    BX.IthiveGanttChart.convertDateToUTC = function (date) {
        if (!date)
            return null;
        return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds(), 0));
    };

    BX.IthiveGanttChart.convertDateFromUTC = function (date) {
        if (!date)
            return null;
        return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds(), 0);
    };

    BX.IthiveGanttChart.allowSelection = function (domElement) {
        if (!BX.type.isDomNode(domElement))
            return;

        domElement.onselectstart = null;
        domElement.ondragstart = null;
        domElement.style.MozUserSelect = "";
    };

    BX.IthiveGanttChart.isLeftClick = function (event) {
        if (!event.which && event.button !== undefined) {
            if (event.button & 1)
                event.which = 1;
            else if (event.button & 4)
                event.which = 2;
            else if (event.button & 2)
                event.which = 3;
            else
                event.which = 0;
        }

        return event.which == 1 || (event.which == 0 && BX.browser.IsIE());
    };

    BX.IthiveGanttChart.denySelection = function (domElement) {
        if (!BX.type.isDomNode(domElement))
            return;

        domElement.onselectstart = BX.False;
        domElement.ondragstart = BX.False;
        domElement.style.MozUserSelect = "none";
    };

    BX.IthiveGanttChart.startDrag = function (domElement, events, cursor) {
        if (!domElement)
            return;

        if (events) {
            for (var eventId in events)
                BX.bind(document, eventId, events[eventId]);
        }

        BX.IthiveGanttChart.denySelection(domElement);
        domElement.style.cursor = BX.type.isString(cursor) ? cursor : "ew-resize";
    };

    BX.IthiveGanttChart.stopDrag = function (domElement, events, cursor) {
        if (!domElement)
            return;

        if (events) {
            for (var eventId in events)
                BX.unbind(document, eventId, events[eventId]);
        }

        BX.IthiveGanttChart.allowSelection(domElement);

        domElement.style.cursor = BX.type.isString(cursor) ? cursor : "default";
    };
    //endregion
    //region GanttRespon
    /**
     *
     * @param {BX.IthiveGanttChart} chart
     * @param {Number} id
     * @param {String} name
     * @constructor
     */
    var GanttRespon = function (chart, id, name) {
        this.chart = chart;
        this.id = id;
        this.name = name;
        this.tasks = [];
        this.menuItems = [];
        this.layout = {
            item: null,
            row: null
        };
        this.hoursInDays = [];
        this.opened = true;
        this.photo = 'data:image/svg+xml;charset=US-ASCII,%3Csvg%20viewBox%3D%220%200%2089%2089%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Ctitle%3Euserpic%3C/title%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Ccircle%20fill%3D%22%23535C69%22%20cx%3D%2244.5%22%20cy%3D%2244.5%22%20r%3D%2244.5%22/%3E%3Cpath%20d%3D%22M68.18%2071.062c0-3.217-3.61-16.826-3.61-16.826%200-1.99-2.6-4.26-7.72-5.585-1.734-.483-3.383-1.233-4.887-2.223-.33-.188-.28-1.925-.28-1.925l-1.648-.25c0-.142-.14-2.225-.14-2.225%201.972-.663%201.77-4.574%201.77-4.574%201.252.695%202.068-2.4%202.068-2.4%201.482-4.3-.738-4.04-.738-4.04.388-2.625.388-5.293%200-7.918-.987-8.708-15.847-6.344-14.085-3.5-4.343-.8-3.352%209.082-3.352%209.082l.942%202.56c-1.85%201.2-.564%202.65-.5%204.32.09%202.466%201.6%201.955%201.6%201.955.093%204.07%202.1%204.6%202.1%204.6.377%202.556.142%202.12.142%202.12l-1.786.217c.024.58-.023%201.162-.14%201.732-2.1.936-2.553%201.485-4.64%202.4-4.032%201.767-8.414%204.065-9.193%207.16-.78%203.093-3.095%2015.32-3.095%2015.32H68.18z%22%20fill%3D%22%23FFF%22/%3E%3C/g%3E%3C/svg%3E';
        this.canCreateTasks = true;
        this.canEditTasks = true;
        this.workHours = 8;
        this.folding
        this.taskInfo
        this.allSeconds = 0
        this.extranet = false;
        this.absence = [];

        this.taskEndPlanTime = 0
        this.taskWaiting = 0
        this.taskWithoutTime = 0

        this.myTaskEndPlanTime = 0
        this.myTaskWaiting = 0
        this.myTaskWithoutTime = 0
        this.myTaskCount = 0
    };

    GanttRespon.prototype.addTask = function (task) {
        if (!task || typeof (task) != "object" || !(task instanceof GanttTask)) {
            return false;
        }

        if (task.respon !== null && task.respon !== this) {
            task.respon.removeTask(task);
        }

        task.respon = this;
        task.responsibleId = this.id;
        this.tasks.push(task);
        this.allSeconds = this.allSeconds + task.timeEstimate
        if (task.dateEnd < new Date()) {
            this.taskEndPlanTime = this.taskEndPlanTime + 1
            if(task.directorId===this.chart.settings.user_id){
                this.myTaskEndPlanTime = this.myTaskEndPlanTime + 1
            }
        }
        if(task.status==='waiting'){
            this.taskWaiting = this.taskWaiting + 1
            if(task.directorId===this.chart.settings.user_id){
                this.myTaskWaiting = this.myTaskWaiting + 1
            }
        }
        if(task.directorId===this.chart.settings.user_id){
            this.myTaskCount = this.myTaskCount + 1
        }
        return true;
    };

    GanttRespon.prototype.removeTask = function (task) {
        for (var i = 0; i < this.tasks.length; i++) {
            if (this.tasks[i] === task) {
                this.tasks.splice(i, 1);
                this.allSeconds = this.allSeconds - task.timeEstimate
                break;
            }
        }
        if(this.tasks.length<1){
            this.folding.classList.add('folding-hidden')
        }
    };

    GanttRespon.prototype.collapse = function () {
        this.opened = false;
        BX.addClass(this.layout.item, "task-gantt-item-closed");
        for (var i = 0; i < this.tasks.length; i++) {
            this.tasks[i].hide();
        }

        BX.onCustomEvent(this.chart, "onResponOpen", [this]);

        this.chart.drawDependencies();
    };

    GanttRespon.prototype.expand = function () {
        this.opened = true;
        BX.removeClass(this.layout.item, "task-gantt-item-closed");
        for (var i = 0; i < this.tasks.length; i++) {
            this.tasks[i].show();
        }

        BX.onCustomEvent(this.chart, "onResponOpen", [this]);

        this.chart.drawDependencies();
    };

    GanttRespon.prototype.createBars = function () {
        if (this.layout.row !== null) {
            return this.layout.row;
        }
        this.layout.row = BX.create("div", {
            props: {className: "task-gantt-timeline-row respon", id: "task-gantt-timeline-row-p" + this.id},
            events: {
                mouseover: BX.proxy(this.onRowMouseOver, this),
                mouseout: BX.proxy(this.onRowMouseOut, this),
                contextmenu: BX.proxy(this.onRowContextMenu, this)
            },
        });
        if (this.chart.isFirstRespon) {
            this.chart.isFirstRespon = false
            this.layout.row.style = 'border-top:1px solid #edeef0'
        }
        var timeline = this.getTimeline();
        this.getColumns(timeline.getStart(), timeline.getEnd(), timeline.bottomUnit, timeline.bottomIncrement, timeline.firstWeekDay)
        return this.layout.row;
    };
    GanttRespon.prototype.recalculateHours = function(){
        this.hoursInDays = [];
        this.setHoursInDays();
        this.refreshTaskInfo();
        var timeline = this.getTimeline();
        this.getColumns(timeline.getStart(), timeline.getEnd(), timeline.bottomUnit, timeline.bottomIncrement, timeline.firstWeekDay);
    }
    GanttRespon.prototype.getColumns = function (startDate, endDate, unit, increment, firstWeekDay) {
        var result = '';
        while (startDate < endDate) {
            var nextDate = BX.Tasks.Date.getNext(startDate, unit, increment, firstWeekDay);
            result += this.getColumn(startDate, nextDate);
            startDate = nextDate;
        }
        this.layout.row.innerHTML = result;
    };
    GanttRespon.prototype.getTimeline = function (params) {
        return this.chart.getTimeline();
    };
    GanttRespon.prototype.getColumn = function (start, end) {
        var duration = BX.Tasks.Date.getDurationInUnit(start, end, this.getTimeline().snapUnit);
        var unitSize = this.getTimeline().getUnitInPixels(this.getTimeline().snapUnit);
        var hours = 0;
        var spanClass = '';
        let isAbsense = false
        this.absence.forEach((abs) => {
            if (abs.from <= start && start <= abs.to) {
                isAbsense = true
            }
        })
        if(this.getTimeline().isWeekend(start)||this.getTimeline().isHoliday(start)){
            hours = '';
            spanClass = 'too-few-hours';
        }else {
            start = Math.trunc(start / (1000 * 60 * 60 * 24));
            if (this.hoursInDays['d' + start]) {
                hours = this.hoursInDays['d' + start];
            }
            if (hours > this.workHours) {
                spanClass = 'too-much-hours';
            } else {
                if (hours > (this.workHours - 1)) {
                    spanClass = 'normal-hours';
                } else if (hours > (this.workHours - 2)) {
                    spanClass = 'normal-hours-2';
                } else if (hours > (this.workHours - 3)) {
                    spanClass = 'normal-hours-3';
                } else {
                    spanClass = 'too-few-hours';
                }
            }
            hours = hours.toFixed(1)
        }
        if (isAbsense) {
            spanClass += ' absence';
        }
        return '<span class="task-gantt-bottom-column ' + spanClass + '" style="width:' + (duration * unitSize) + 'px">' + hours + '</span>';
    };
    GanttRespon.prototype.createItem = function () {
        if (this.layout.item !== null) {
            return this.layout.item;
        }

        var itemClass = "task-gantt-item task-gantt-item-respon";
        if (!this.opened) {
            itemClass += " task-gantt-item-closed";
        }
        let nameClass = 'task-gantt-item-respon-name'
        if(this.extranet){
            nameClass = 'task-gantt-item-respon-name extranet'
        }
        this.folding = BX.create("div", {
            props: {className: "task-gantt-item-respon-folding"}
        })
        this.taskInfo = BX.create("div", {
            props: {className: "task-gantt-item-respon-info"},
            text: this.tasks.length,
            children: this.getTaskInfoChildren()
        })
        if (this.tasks.length<1){
            this.folding.classList.add('folding-hidden')
        }
        this.layout.item = BX.create("div", {
            props: {className: itemClass, id: "task-gantt-item-r" + this.id},
            attrs: {"data-respon-id": this.id},
            events: {
                mouseover: BX.proxy(this.onItemMouseOver, this),
                mouseout: BX.proxy(this.onItemMouseOut, this),
                click: BX.proxy(this.onFoldingClick, this)
            },
            children: [
                BX.create("div", {
                    props: {className: "task-respon-name-block"},
                    children: [
                        BX.create("a", {
                            props: {href: '/company/personal/user/' + this.id + '/'},
                            children: [
                                BX.create("img", {props: {className: "task-gantt-item-respon-photo", src: this.photo}}),
                            ]
                        }),
                        BX.create("span", {props: {className: nameClass,}, html: this.name}),
                    ]
                }),
                this.taskInfo,
                (this.layout.menu = this.menuItems.length > 0
                        ?
                        BX.create("div", {
                            props: {className: "task-gantt-item-actions"}, children: [
                                BX.create("span", {
                                    props: {className: "task-gantt-item-menu"}, events: {
                                        click: BX.proxy(this.onItemMenuClick, this)
                                    }
                                })
                            ]
                        })
                        : null
                )
            ]
        });

        return this.layout.item;
    };

    GanttRespon.prototype.onFoldingClick = function (event) {
        if (this.opened) {
            this.collapse();
            BX.removeClass(this.folding, 'folding-expand')
        } else {
            this.expand();
            BX.addClass(this.folding, 'folding-expand')
        }
    };

    GanttRespon.prototype.onItemMenuClick = function (event) {
        var menu = BX.PopupMenu.create("p" + this.id, this.layout.menu, this.menuItems, {
            offsetLeft: 8,
            bindOptions: {forceBindPosition: true},
            events: {onPopupClose: BX.proxy(this.onItemMenuClose, this)},
            chart: this.chart,
            respon: this
        });

        menu.getPopupWindow().setBindElement(this.layout.menu);
        menu.show();

        this.denyItemsHover();
        BX.addClass(this.layout.menu, "task-gantt-item-menu-selected");
    };

    GanttRespon.prototype.onItemMenuClose = function (popupWindow, event) {
        this.allowItemsHover(event);
        BX.removeClass(this.layout.menu, "task-gantt-item-menu-selected");
    };

    GanttRespon.prototype.onItemMouseOver = function (event) {
        if (!this.chart.allowRowHover)
            return;
        BX.addClass(this.layout.item, "task-gantt-item-tree-hover");
        BX.addClass(this.layout.row, "task-gantt-timeline-row-hover");
    };

    GanttRespon.prototype.onItemMouseOut = function (event) {
        if (!this.chart.allowRowHover)
            return;
        BX.removeClass(this.layout.item, "task-gantt-item-tree-hover");
        BX.removeClass(this.layout.row, "task-gantt-timeline-row-hover");
    };

    GanttRespon.prototype.onRowMouseOver = function (event) {
        if (!this.chart.allowRowHover)
            return;
        BX.addClass(this.layout.row, "task-gantt-timeline-row-hover");
    };

    GanttRespon.prototype.onRowMouseOut = function (event) {
        if (!this.chart.allowRowHover)
            return;

        BX.removeClass(this.layout.row, "task-gantt-timeline-row-hover");
    };

    GanttRespon.prototype.onRowContextMenu = function (event) {
        event = event || window.event;
        if (this.menuItems.length < 1 || event.ctrlKey)
            return;

        BX.TaskQuickInfo.hide();

        var menu = BX.PopupMenu.create("p" + this.id, event, this.menuItems, {
            offsetLeft: 1,
            autoHide: true,
            closeByEsc: true,
            bindOptions: {forceBindPosition: true},
            events: {onPopupClose: BX.proxy(this.onItemMenuClose, this)},
            chart: this.chart,
            respon: this
        });

        menu.getPopupWindow().setBindElement(event);
        menu.show();

        var target = event.target || event.srcElement;
        if (target && BX.hasClass(target, "task-gantt-timeline-row") && BX.type.isNotEmptyString(target.id)) {
            var respon = this.chart.getResponById(target.id.substr("task-gantt-timeline-row-p".length));
            if (respon != null)
                BX.addClass(respon.layout.row, "task-gantt-timeline-row-hover");
        }

        this.denyItemsHover();
        BX.PreventDefault(event);
    };

    GanttRespon.prototype.denyItemsHover = function () {
        this.chart.allowRowHover = false;
    };

    GanttRespon.prototype.allowItemsHover = function (event) {
        this.chart.allowRowHover = true;

        event = event || window.event || null;
        if (!event)
            return;

        var target = event.target || event.srcElement;
        if (target != this.layout.row && target.parentNode != this.layout.row && target.parentNode.parentNode != this.layout.row &&
            target != this.layout.item && target.parentNode != this.layout.item
        ) {
            BX.removeClass(this.layout.item, "task-gantt-item-tree-hover");
            BX.removeClass(this.layout.row, "task-gantt-timeline-row-hover");
        } else if (target != this.layout.item && target.parentNode != this.layout.item) {
            BX.removeClass(this.layout.item, "task-gantt-item-tree-hover");
        }

    };
    GanttRespon.prototype.setHoursInDaysOfTask = function (dateStart, dateEnd, hoursInDay) {
        while (dateStart <= dateEnd) {
            if (!this.hoursInDays['d'+dateStart]) this.hoursInDays['d'+dateStart] = 0;
            this.hoursInDays['d'+dateStart] += hoursInDay;
            dateStart++;
        }
    };
    GanttRespon.prototype.setHoursInDays = function () {
        var respon = this;
        this.tasks.forEach(function (item) {
            respon.setHoursInDaysOfTask(item.dayDateStart, item.dayDateEnd, item.hoursInDay);
        });
    };
    GanttRespon.prototype.refreshTaskInfo = function () {
        var respon = this;
        this.allSeconds = 0;
        this.taskEndPlanTime = 0;
        this.taskWaiting = 0;

        this.myTaskEndPlanTime = 0;
        this.myTaskWaiting = 0;
        this.myTaskCount = 0;

        if(!respon.chart.settings['hidden_without_time']) {
            this.taskWithoutTime = 0;
            this.myTaskWithoutTime = 0;
        }

        let needIcon
        this.tasks.forEach(function (item) {
            respon.allSeconds = respon.allSeconds + item.timeEstimate
            if(!!item.layout.infoBlock) {
                item.layout.infoBlock.querySelector('.icon-deadline').style.display = 'none'
                item.layout.infoBlock.querySelector('.icon-moderate').style.display = 'none'
                item.layout.infoBlock.querySelector('.icon-timeEmpty').style.display = 'none'
                item.layout.infoBlock.querySelector('.icon-count').style.display = 'none'
            }
            needIcon = true
            //region EndPlanTime
            if (item.dateEnd < new Date()) {
                respon.taskEndPlanTime = respon.taskEndPlanTime + 1
                if (item.directorId === respon.chart.settings.user_id) {
                    respon.myTaskEndPlanTime = respon.myTaskEndPlanTime + 1
                    if(!!item.layout.infoBlock){
                        item.layout.infoBlock.querySelector('.icon-deadline').style.display = 'block'
                    }
                    needIcon = false
                }
            }
            //endregion
            //region waiting
            if (item.status === 'waiting') {
                respon.taskWaiting = respon.taskWaiting + 1
                if (item.directorId === respon.chart.settings.user_id) {
                    respon.myTaskWaiting = respon.myTaskWaiting + 1
                    if(!!item.layout.infoBlock) {
                        item.layout.infoBlock.querySelector('.icon-moderate').style.display = 'block'
                    }
                    needIcon = false
                }
            }
            //endregion
            //region WithoutTime
            if(!respon.chart.settings['hidden_without_time']) {
                if (item.timeEstimate === 0 || !item.timeEstimate) {
                    respon.taskWithoutTime = respon.taskWithoutTime + 1
                    if (item.directorId === respon.chart.settings.user_id) {
                        respon.myTaskWithoutTime = respon.myTaskWithoutTime + 1
                        if (!!item.layout.infoBlock) {
                            item.layout.infoBlock.querySelector('.icon-timeEmpty').style.display = 'block'
                        }
                        needIcon = false
                    }
                }
            }
            //endregion
            if (item.directorId === respon.chart.settings.user_id) {
                respon.myTaskCount = respon.myTaskCount + 1
            }
            if(!!item.layout.infoBlock) {
                if ((needIcon)&&(item.directorId === respon.chart.settings.user_id)) {
                    item.layout.infoBlock.querySelector('.icon-count').style.display = 'block'
                }
            }
        });
        this.taskInfo.innerHTML = ''
        let children = this.getTaskInfoChildren()
        children.forEach((child)=>{
            this.taskInfo.appendChild(child)
        })
    }
    GanttRespon.prototype.getTaskInfoChildren = function () {
        let allHours = this.chart.recalculateTimeInHours(this.allSeconds)
        //region allcount
        let allCount = BX.create("div", {
            style:{
                width: '30%'
            },
            children:
                [
                    BX.create("span", {
                        props: {
                            className: "",
                            title: this.tasks.length
                        },
                        text: this.tasks.length
                    }),
                    BX.create("span", {
                        props: {
                            className: "icon-label",
                            title: '(' + allHours + BX.message('HOURS_LABEL') + ')'
                        },
                        text: '(' + allHours + BX.message('HOURS_LABEL') + ')'
                    }),
                ]
        });
        if(this.myTaskCount>0){
            allCount.appendChild(
                BX.create("span", {
                    style: {backgroundColor: '#91B33E'},
                    props: {className: "color-label", title: BX.message('MY_ICON_COUNT')+this.myTaskCount},
                    text: this.myTaskCount
                }),
            )
        }
        //endregion
        //region withouttime
        let withoutTime = BX.create("div", {
            children:
                [
                    BX.create("span", {props: {className: "", title: this.taskWithoutTime}, text: this.taskWithoutTime}),
                ]
        });
        if(this.myTaskWithoutTime>0){
            withoutTime.appendChild(
                BX.create("span", {
                    style: {backgroundColor: '#3BCAF2'},
                    props: {className: "color-label", title: BX.message('MY_ICON_TIME_EMPTY')+this.myTaskWithoutTime},
                    text: this.myTaskWithoutTime
                })
            )
        }
        //endregion
        //region enddateplan
        let endDatePlan = BX.create("div", {
            children:
                [
                    BX.create("span", {props: {className: "", title: this.taskWithoutTime}, text: this.taskEndPlanTime}),
                ]
        });
        if(this.myTaskEndPlanTime>0){
            endDatePlan.appendChild(
                BX.create("span", {
                    style: {backgroundColor: '#FF4C00'},
                    props: {className: "color-label", title: BX.message('MY_ICON_DEADLINE')+this.myTaskEndPlanTime},
                    text: this.myTaskEndPlanTime
                })
            )
        }
        //endregion
        //region enddateplan
        let taskWaiting = BX.create("div", {
            children:
                [
                    BX.create("span", {props: {className: "", title: this.taskWaiting}, text: this.taskWaiting}),
                ]
        });
        if(this.myTaskWaiting>0){
            taskWaiting.appendChild(
                BX.create("span", {
                    style: {backgroundColor: '#FFA800'},
                    props: {className: "color-label", title: BX.message('MY_ICON_MODERATE')+this.myTaskWaiting},
                    text: this.myTaskWaiting
                })
            )
        }
        //endregion
        return [
            allCount,
            withoutTime,
            endDatePlan,
            taskWaiting,
            this.folding
        ]
    }
    //endregion

    //region GanttTask
    /**
     *
     * @param {BX.IthiveGanttChart} chart
     * @param {Number} id
     * @param {String} name
     * @param {String} status
     * @param {Date} dateCreated
     * @constructor
     */
    var GanttTask = function (chart, id, name, status, dateCreated) {
        this.chart = chart;
        this.id = id;
        this.name = name;
        this.setStatus(status);
        this.initialStatus = this.status
        if(this.initialStatus === 'overdue'){
            this.initialStatus = 'accepted'
        }
        this.hoursInDay = 0;
        this.timeInDay = 0;
        this.days = 0;
        this.dayDateEnd = 0;
        this.dayDateStart = 0;
        this.dateCreated = BX.Tasks.Date.isDate(dateCreated) ? BX.IthiveGanttChart.convertDateToUTC(dateCreated) : this.chart.currentDatetime;

        this.dateStart = null;
        this.isRealDateStart = false;

        this.dateEnd = null;
        this.isRealDateEnd = false;
        this.timeEstimate = null;
        this.timeSpentInLogs = 0;
        this.__setDateStart(this.dateCreated, false, true);

        this.dateStarted = null;
        this.dateCompleted = null;
        this.dateDeadline = null;

        this.matchWorkTime = true;
        this.duration = null;

        this.files = [];
        this.responsible = "";
        this.responsibleId = 0;
        this.director = "";
        this.directorId = 0;
        this.priority = 1;

        this.depthLevel = 1;

        this.parentTask = null;
        this.parentTaskId = 0;

        this.respon = null;

        this.predecessors = {};
        this.succesors = {};

        this.menuItems = [];

        this.url = "";
        this.details = null;

        this.layout = {
            item: null,
            row: null,
            name: null,
            menu: null,
            planBar: null,
            realBar: null,
            deadlineBar: null,
            deadlineSlider: null,
            deadlineOverdue: null,
            realOverdue: null,
            completeFlag: null,
            pointStart: null,
            pointEnd: null,
            textBar: null,
        };

        this.opened = false;

        this.canEditDeadline = true;
        this.canEditPlanDates = true;
        this.canEdit = true;

        this.responPlanFromSubTasks = false;
        this.isParent = false;

        this.resizerOffsetX = 0;
        this.access = false
        this.resizerChangePos = false;
        this.resizerPageX = 0;
        this.resizerPageY = 0;

        this.autoResizeIntID = null;
        this.autoResizeTimeout = 50;
        this.autoResizeCallback = null;
        this.autoResizeEvent = null;

        this.highlightTimeout = null;
    };

    GanttTask.prototype.isGroup = function () {
        return this.responPlanFromSubTasks &&
            this.isRealDateEnd &&
            this.canEditPlanDates;
    };

    GanttTask.prototype.addPredecessor = function (dependency) {
        if (dependency instanceof GanttDependency) {
            this.predecessors[dependency.id] = dependency;
        }
    };

    GanttTask.prototype.addSuccessor = function (dependency) {
        if (dependency instanceof GanttDependency) {
            this.succesors[dependency.id] = dependency;
        }
    };

    GanttTask.prototype.removePredecessor = function (dependency) {
        if (dependency instanceof GanttDependency) {
            delete this.predecessors[dependency.id];
        }
    };

    GanttTask.prototype.removeSuccessor = function (dependency) {
        if (dependency instanceof GanttDependency) {
            delete this.succesors[dependency.id];
        }
    };

    GanttTask.prototype.hasSuccessor = function (successorId) {
        for (var linkId in this.succesors) {
            if (this.succesors.hasOwnProperty(linkId)) {
                var successor = this.chart.getTaskById(this.succesors[linkId].to);
                if (successor.id === successorId) {
                    return true;
                }

                if (successor.hasSuccessor(successorId)) {
                    return true;
                }
            }
        }

        return false;
    };
    GanttTask.prototype.getDependencies = function () {
        var dependencies = [];
        for (var id in this.predecessors) {
            if (this.predecessors.hasOwnProperty(id)) {
                dependencies.push(this.predecessors[id]);
            }
        }

        for (id in this.succesors) {
            if (this.succesors.hasOwnProperty(id)) {
                dependencies.push(this.succesors[id]);
            }
        }

        return dependencies;
    };

    GanttTask.prototype.getNextTask = function () {
        var children = this.respon.tasks;
        for (var i = 0; i < children.length; i++) {
            if (children[i] == this) {
                return children[i + 1] ? children[i + 1] : null;
            }
        }
    };

    GanttTask.prototype.getPreviousTask = function () {
        var children = this.respon.tasks;
        for (var i = 0; i < children.length; i++) {
            if (children[i] == this) {
                return i > 0 && children[i - 1] ? children[i - 1] : null;
            }
        }
    };

    GanttTask.prototype.setTaskFromJSON = function (json) {
        if (typeof (json) != "object") {
            return null;
        }
        this.setStatus(json.status);
        this.initialStatus = this.status
        if(this.initialStatus === 'overdue'){
            this.initialStatus = 'accepted'
        }
        this.setDateCompleted(json.dateCompleted);
        this.setDateDeadline(json.dateDeadline);
        this.setDateStarted(json.dateStarted);
        if (json.TIME_ESTIMATE){
            this.setTimeEstimate(json.TIME_ESTIMATE);
        }
        this.setTimeSpentInLogs(json.TIME_SPENT_IN_LOGS)
        this.setDateEnd(json.dateEnd);
        this.setDateStart(json.dateStart);
        this.setMatchWorkTime(json.matchWorkTime);
        this.setMenuItems(json.menuItems);
        this.setName(json.name);
        this.setUrl(json.url);
        this.setDetails(json.details || function () {
            if (BX.type.isNotEmptyString(this.url)) {
                window.top.location = this.url;
            }
        });
        this.setFiles(json.files);

        if (BX.type.isBoolean(json.opened)) {
            this.opened = json.opened;
        }

        if (BX.type.isBoolean(json.canEditDeadline)) {
            this.canEditDeadline = json.canEditDeadline;
        }

        if (BX.type.isBoolean(json.canEditPlanDates)) {
            this.canEditPlanDates = json.canEditPlanDates;
        }

        if (BX.type.isBoolean(json.canEdit)) {
            this.canEdit = json.canEdit;
        }

        if (json.parameters && BX.type.isBoolean(json.parameters.responPlanFromSubTasks)) {
            this.responPlanFromSubTasks = json.parameters.responPlanFromSubTasks;
        }

        if (BX.type.isBoolean(json.isParent)) {
            this.isParent = json.isParent;
        }

        if (json.responsible) {
            this.responsible = json.responsible;
        }

        if (json.responsibleId) {
            this.responsibleId = json.responsibleId;
        }

        if (json.director) {
            this.director = json.director;
        }


        if (json.directorId) {
            this.directorId = json.directorId;
        }

        if (BX.type.isNumber(json.priority)) {
            this.priority = json.priority;
        }
        return this;
    };

    GanttTask.prototype.setDateStart = function (date) {
        if (date === null) {
            this.isRealDateStart = false;
            return this.__setDateStart(this.dateCreated, false, true);
        }

        return this.__setDateStart(date, true, false);
    };

    GanttTask.prototype.__setDateStart = function (date, isRealStartDate, isUTC) {
        if (!BX.Tasks.Date.isDate(date))
            return;

        isUTC = !!isUTC;
        if (!isUTC)
            date = BX.IthiveGanttChart.convertDateToUTC(date);

        if (this.isRealDateEnd && date > this.dateEnd)
            return;

        this.isRealDateStart = isRealStartDate;
        this.dateStart = new Date(date.getTime());

        if (!this.isRealDateEnd) {
            if (this.status === "completed") {
                if (this.dateCompleted == null ||
                    this.dateCompleted <= this.dateStart ||
                    BX.Tasks.Date.getDurationInHours(this.dateStart, this.dateCompleted) < this.chart.endlessBarDefaultDuration
                ) {
                    this.dateEnd = BX.Tasks.Date.add(this.dateStart, BX.Tasks.Date.Unit.Hour, this.chart.endlessBarDefaultDuration);
                } else {
                    this.dateEnd = this.dateCompleted;
                }
            } else {
                this.dateEnd = BX.Tasks.Date.ceilDate(this.chart.currentDatetime, BX.Tasks.Date.Unit.Day, 1);
                if (this.dateEnd <= this.dateStart ||
                    BX.Tasks.Date.getDurationInHours(this.dateStart, this.dateEnd) < this.chart.endlessBarDefaultDuration) {
                    this.dateEnd = BX.Tasks.Date.add(this.dateStart, BX.Tasks.Date.Unit.Hour, this.chart.endlessBarDefaultDuration);
                }
            }
        }
    };

    GanttTask.prototype.setDateEnd = function (date) {
        if (date === null) {
            this.dateEnd = null;
            this.isRealDateEnd = false;
            this.__setDateStart(this.dateStart, this.isRealDateStart, true);
        } else if (BX.Tasks.Date.isDate(date)) {
            date = BX.IthiveGanttChart.convertDateToUTC(date);
            if (date > this.dateStart) {
                this.dateEnd = new Date(date.getTime());
                this.isRealDateEnd = true;
            }
        }
    };

    GanttTask.prototype.setDateCompleted = function (date) {
        if (date === null) {
            this.dateCompleted = null;
        } else if (BX.Tasks.Date.isDate(date)) {
            this.dateCompleted = BX.IthiveGanttChart.convertDateToUTC(date);
        }
    };

    GanttTask.prototype.setDateStarted = function (date) {
        if (date === null) {
            this.dateStarted = null;
        } else if (BX.Tasks.Date.isDate(date)) {
            this.dateStarted = BX.IthiveGanttChart.convertDateToUTC(date);
        }
    };

    GanttTask.prototype.setDateDeadline = function (date) {
        if (date === null) {
            this.dateDeadline = null;
        } else if (BX.Tasks.Date.isDate(date)) {
            this.dateDeadline = BX.IthiveGanttChart.convertDateToUTC(date);
        }
    };

    GanttTask.prototype.setRealDates = function () {
        if (this.isRealDateStart && this.isRealDateEnd) {
            return null;
        }

        if (this.matchWorkTime) {
            var duration = this.calculateDuration();
            var msInHour = BX.Tasks.Date.getUnitRatio(BX.Tasks.Date.Unit.Milli, BX.Tasks.Date.Unit.Hour);
            if (duration < this.chart.endlessBarDefaultDuration * msInHour) {
                duration = msInHour * this.chart.endlessBarDefaultDuration;
            }

            var calendar = this.chart.calendar;
            if (!this.isRealDateStart) {
                this.dateStart = calendar.getClosestWorkTime(this.dateStart, true);
                this.dateEnd = calendar.calculateEndDate(this.dateStart, duration);
                this.isRealDateEnd = true;
                this.isRealDateStart = true;
            } else if (!this.isRealDateEnd) {
                this.dateEnd = calendar.calculateEndDate(this.dateStart, duration);
                this.isRealDateEnd = true;
            }
        } else {
            this.isRealDateEnd = true;
            this.isRealDateStart = true;
        }

        this.redraw();

        return {
            dateStart: new Date(this.dateStart.getTime()),
            dateEnd: new Date(this.dateEnd.getTime())
        };
    };

    GanttTask.prototype.setName = function (name) {
        if (BX.type.isNotEmptyString(name)) {
            this.name = name;
        }
    };

    GanttTask.prototype.setMatchWorkTime = function (value) {
        if (value === true || value === false) {
            this.matchWorkTime = value;
        }
    };

    GanttTask.prototype.setUrl = function (url) {
        if (BX.type.isNotEmptyString(url))
            this.url = url;
    };

    GanttTask.prototype.setFiles = function (files) {
        if (!BX.type.isArray(files))
            return;

        this.files = [];
        for (var i = 0; i < files.length; i++) {
            var file = files[i];
            if (typeof (file) == "object" && BX.type.isNotEmptyString(file.name)) {
                this.files.push({
                    name: file.name,
                    url: file.url ? file.url : "",
                    size: file.size ? file.size : ""
                });
            }
        }
    };

    GanttTask.prototype.setDetails = function (callback) {
        if (BX.type.isFunction(callback))
            this.details = callback;
    };

    GanttTask.prototype.getTimeline = function (params) {
        return this.chart.getTimeline();
    };

    GanttTask.prototype.setMenuItems = function (menuItems) {
        if (BX.type.isArray(menuItems))
            this.menuItems = menuItems;
    };

    GanttTask.prototype.setStatus = function (status) {
        if (!BX.type.isNotEmptyString(status))
            return;

        this.status = status;
    };
    GanttTask.prototype.setTimeEstimate = function (timeEstimate) {
        if(!!timeEstimate){
            this.timeEstimate = timeEstimate;
        }else{
            this.timeEstimate = 0;
        }
    };
    GanttTask.prototype.setTimeSpentInLogs = function (timeSpentInLogs) {
        this.timeSpentInLogs = timeSpentInLogs;
    };
    GanttTask.prototype.allowEditDeadline = function () {
        this.canEditDeadline = true;
    };

    GanttTask.prototype.denyEditDeadline = function () {
        this.canEditDeadline = false;
    };

    GanttTask.prototype.allowEditPlanDates = function () {
        this.canEditPlanDates = true;
    };

    GanttTask.prototype.denyEditPlanDates = function () {
        this.canEditPlanDates = false;
    };

    GanttTask.prototype.setRespon = function (responsibleId) {
        var oldRespon = this.respon != null ? this.respon : null;

            var respon = this.chart.getResponById(BX.type.isNumber(responsibleId) ? responsibleId : 0);
            if (!respon) {
                respon = this.chart.getDefaultRespon();
            }

            this.responsibleId = respon.id;
            this.respon = respon;


        if (oldRespon !== null && oldRespon !== this.respon) {
            oldRespon.removeTask(this);
        }
        if(typeof this.respon.folding !=='undefined')
            this.folding.classList.remove('folding-hidden')

        this.respon.addTask(this);
    };

    GanttTask.prototype.createItem = function () {
        if (this.layout.item != null) {
            this.updateItem();
            return this.layout.item;
        }
        if (this.access) {
            this.layout.name = BX.create("a", {
                props: {className: "task-gantt-item-name", href: ""}, events: {
                    click: BX.proxy(this.onItemNameClick, this)
                }
            })
        } else {
            this.layout.name = BX.create("span", {})
        }
        this.layout.infoBlock = BX.create("div", {
            props:{
                className: 'infoBlock-task'
            },
            children: [
                BX.create("div", {props: {className: "icon-count", title: BX.message('ICON_COUNT_TASK')}}),
                BX.create("div", {props: {className: "icon-timeEmpty", title: BX.message('ICON_TIME_EMPTY_TASK')}}),
                BX.create("div", {props: {className: "icon-deadline", title: BX.message('ICON_DEADLINE_TASK')}}),
                BX.create("div", {props: {className: "icon-moderate", title: BX.message('ICON_MODERATE_TASK')}}),
            ]
        })
        this.layout.item = BX.create("div", {
            props: {id: "task-gantt-item-" + this.id},
            attrs: {"data-task-id": this.id},
            events: {
                mouseover: BX.proxy(this.onItemMouseOver, this),
                mouseout: BX.proxy(this.onItemMouseOut, this)
            },
            children: [
                this.chart.canDragTasks ? BX.create("span", {props: {className: "task-gantt-item-handle"}}) : null,
                this.layout.name,
                this.layout.infoBlock
            ]
        });
        if (this.access) {
            this.layout.item.appendChild(BX.create("div", {
                props: {className: "task-gantt-item-actions"}, children: [
                    (this.layout.menu = BX.create("span", {
                        props: {className: "task-gantt-item-menu"},
                        events: {
                            click: BX.proxy(this.onItemMenuClick, this)
                        }
                    }))
                ]
            }))
        }

        this.updateItem();

        return this.layout.item;
    };

    GanttTask.prototype.updateItem = function () {
        if (this.layout.item == null) {
            return null;
        }

        this.layout.name.innerHTML = this.name;
        this.layout.name.href = this.url;
        var itemClass = "task-gantt-item";

        if (this.isHidden()) {
            itemClass += " task-gantt-item-hidden";
        }

        if (this.opened) {
            itemClass += " task-gantt-item-opened";
        }

        if (this.canEdit) {
            itemClass += " task-gantt-item-can-edit";
        }

        if (this.status) {
            itemClass += " task-gantt-item-status-" + this.status;
        }

        this.layout.item.className = itemClass;

        if (this.menuItems.length < 1) {
            BX.addClass(this.layout.menu, "task-gantt-item-menu-empty");
        } else {
            BX.removeClass(this.layout.menu, "task-gantt-item-menu-empty");
        }

        return this.layout.item;
    };

    GanttTask.prototype.createBars = function () {
        if (this.layout.row !== null) {
            this.updateBars();
            return this.layout.row;
        }

        this.createRow();
        this.createPlanBars();
        this.createRealBar();
        this.createCompleteFlag();
        this.createDeadlineBars();

        BX.onCustomEvent(window, 'onGanttTaskCreateBars', this);

        return this.layout.row;
    };

    GanttTask.prototype.updateBars = function () {
        if (this.layout.row === null) {
            return null;
        }

        this.updateRow();
        this.updatePlanBars();
        this.updateRealBar();
        this.updateCompleteFlag();
        this.updateDeadlineBars();
        this.layout.textBar.innerHTML = this.getTaskHoursHtml();
        BX.onCustomEvent(window, 'onGanttTaskUpdateBars', this);
        return this.layout.row;
    };

    GanttTask.prototype.redraw = function () {
        if (!this.layout.item || !this.layout.row) {
            return;
        }

        this.chart.autoExpandTimeline([this.getMinDate(), this.getMaxDate()]);
        this.updateItem();
        this.updateBars();
        this.redrawDependencies();
    };

    GanttTask.prototype.redrawDependencies = function () {
        for (var linkId in this.predecessors) {
            if (this.predecessors.hasOwnProperty(linkId)) {
                this.predecessors[linkId].draw();
            }
        }

        for (linkId in this.succesors) {
            if (this.succesors.hasOwnProperty(linkId)) {
                this.succesors[linkId].draw();
            }
        }
    };

    GanttTask.prototype.updateLags = function () {
        for (var linkId in this.predecessors) {
            if (this.predecessors.hasOwnProperty(linkId)) {
                this.predecessors[linkId].updateLag();
            }
        }

        for (linkId in this.succesors) {
            if (this.succesors.hasOwnProperty(linkId)) {
                this.succesors[linkId].updateLag();
            }
        }
    };

    GanttTask.prototype.createRow = function () {
        if (this.layout.row != null)
            return;

        this.layout.row = BX.create("div", {
            props: {id: "task-gantt-timeline-row-" + this.id},
            events: {
                mouseover: BX.proxy(this.onRowMouseOver, this),
                mouseout: BX.proxy(this.onRowMouseOut, this),
                dblclick: BX.proxy(this.onRowDoubleClick, this),
                contextmenu: BX.proxy(this.onRowContextMenu, this)
            }
        });

        this.updateRow();
    };

    GanttTask.prototype.updateRow = function () {
        if (this.layout.row == null)
            return;

        var rowClass = "task-gantt-timeline-row";
        if (this.isHidden()) {
            rowClass += " task-gantt-item-hidden";
        }

        if (this.status) {
            rowClass += " task-gantt-item-status-" + this.status;
        }

        if (this.isGroup()) {
            rowClass += " task-gantt-row-group";
        }

        this.layout.row.className = rowClass;
    };

    GanttTask.prototype.createPlanBars = function () {
        if (this.layout.row == null)
            return;

        this.layout.planBar = BX.create("div", {
            attrs: {"data-task-id": this.id},
            events: {mousedown: BX.proxy(this.onPlanBarMouseDown, this)},
            children: [
                (this.layout.planBarStart = BX.create("div", {
                    props: {className: "task-gantt-bar-plan-start"}, style: {zIndex: 0}, events: {
                        mousedown: BX.proxy(this.onStartDateMouseDown, this)
                    }
                })),
                (this.layout.planBarEnd = BX.create("div", {
                    props: {className: "task-gantt-bar-plan-end"}, style: {zIndex: 0}, events: {
                        mousedown: BX.proxy(this.onEndDateMouseDown, this)
                    }
                })),
                (this.layout.pointStart = this.chart.canCreateDependency ?
                        BX.create("div", {
                            props: {className: "task-gantt-point task-gantt-point-start"}, style: {}, events: {
                                mousedown: BX.proxy(this.onStartPointMouseDown, this)
                            }
                        })
                        : null
                ),
                (this.layout.pointEnd = this.chart.canCreateDependency ?
                        BX.create("div", {
                            props: {className: "task-gantt-point task-gantt-point-end"}, style: {}, events: {
                                mousedown: BX.proxy(this.onEndPointMouseDown, this)
                            }
                        })
                        : null
                ),
            ],
        });
        var timeline = this.getTimeline();
        this.layout.row.appendChild(this.layout.textBar = BX.create("div", {
            props: {className: 'task-hours'},
            html: this.getTaskHoursHtml()
        }));
        this.chart.getResponById(this.responsibleId).getColumns(timeline.getStart(), timeline.getEnd(), timeline.bottomUnit, timeline.bottomIncrement, timeline.firstWeekDay);
        this.layout.row.appendChild(this.layout.planBar);
        this.updatePlanBars();
    };
    GanttTask.prototype.getDays = function (dateStart, dateEnd) {
        if (dateStart === null) {
            dateStart = this.dateCreated;
        }
        if (dateEnd === null) {
            dateEnd = new Date();
        }

        this.dayDateEnd = Math.trunc(dateEnd / (1000 * 60 * 60 * 24));
        this.dayDateStart = Math.trunc(dateStart / (1000 * 60 * 60 * 24));
        let days = 0
        let date = new Date(dateStart.getTime());
        while(date<=dateEnd){
            if(!this.getTimeline().isWeekend(date)&&!this.getTimeline().isHoliday(date)){
                days++;
            }
            date.setDate(date.getDate()+1)
        }
        return days;
    }

    GanttTask.prototype.getHoursInDay = function (dateStart, dateEnd, days) {
        if (days > 0) {
            this.timeInDay = this.timeEstimate / days
            this.hoursInDay = this.timeInDay / 3600
        } else {
            this.timeInDay = 0
            this.hoursInDay = 0
        }
        this.chart.getResponById(this.responsibleId).setHoursInDaysOfTask(this.dayDateStart, this.dayDateEnd, this.hoursInDay);
        return this.hoursInDay;
    };
    GanttTask.prototype.getTaskHoursHtml = function () {
        let oldDayDateEnd = this.dayDateEnd
        let oldDayDateStart = this.dayDateStart
        let oldDays = this.days
        this.days = this.getDays(this.dateStart, this.dateEnd)
        let isEndDateChange = ((oldDayDateEnd!==this.dayDateEnd)&&(oldDayDateStart===this.dayDateStart))
        if(isEndDateChange) {
            let newTimeEstimate = this.timeEstimate + (this.days - oldDays) * this.timeInDay
            switch (this.chart.settings['end_date_change_setting']) {
                case 2:
                    //Выделенное время на задачу менять с учетом фиксированной нагрузки
                    return this.getTaskHoursHtml_2(newTimeEstimate)
                case 3:
                    //Выделенное время на задачу менять с учетом фиксированной нагрузки только для начатых задач
                    return this.getTaskHoursHtml_3(newTimeEstimate)
                case 4:
                    //Спрашивать у пользователя
                    return this.getTaskHoursHtml_4(newTimeEstimate)
                default:
                    //Выделенное время на задачу не менять
                    return this.getTaskHoursHtml_1()
            }
        }else{
            return this.getTaskHoursHtml_1()
        }
    };
    GanttTask.prototype.getTaskHoursHtml_1 = function (){
        var hoursInDay = this.getHoursInDay(this.dateStart, this.dateEnd, this.days);
        let allHours = this.chart.recalculateTimeInHours(this.timeEstimate)
        if (hoursInDay % 1 !== 0) {
            hoursInDay = hoursInDay.toFixed(1);
        }
        var respon = this.chart.getResponById(this.responsibleId);
        respon.recalculateHours();
        return '<span>' + allHours + '/' + this.days + ' = ' + hoursInDay + '</span>';
    };
    GanttTask.prototype.getTaskHoursHtml_2 = function (newTimeEstimate) {
        this.timeEstimate = newTimeEstimate
        BX.onCustomEvent(this.chart, "onTaskChange", [[this.getEventObject(["timeEstimate"])]]);
        return this.getTaskHoursHtml_1()
    };
    GanttTask.prototype.getTaskHoursHtml_3 = function (newTimeEstimate) {
        if (this.timeSpentInLogs > 0) {
            return this.getTaskHoursHtml_2(newTimeEstimate)
        } else {
            return this.getTaskHoursHtml_1()
        }
    };
    GanttTask.prototype.getTaskHoursHtml_4 = function (newTimeEstimate) {
        let $this = this
        var Confirmer = new BX.PopupWindow("choice_action", null, {
            content: BX.message('CHOICE_ACTION_TEXT')
                .replaceAll('#OLD_HOURS_IN_DAY#', $this.hoursInDay.toFixed(1))
                .replaceAll('#OLD_TIME_ESTIMATE#', $this.chart.recalculateTimeInHours($this.timeEstimate))
                .replaceAll('#NEW_TIME_ESTIMATE#', $this.chart.recalculateTimeInHours(newTimeEstimate)),
            titleBar: {
                content: BX.create("span",
                    {
                        props: {'className': 'mess-title-bar'},
                        children: [
                            BX.create('span',
                                {
                                    html: BX.message('CHOICE_ACTION_TITLE')
                                })
                        ]
                    }
                )

            },
            zIndex: 0,
            offsetLeft: 0,
            offsetTop: 0,
            draggable: {restrict: false},
            overlay: {backgroundColor: 'black', opacity: '80'},

            buttons: [
                new BX.PopupWindowButton({
                    text: BX.message('YES'),
                    className: "error-button-closed",
                    events: {
                        click: function () {
                            $this.layout.textBar.innerHTML = $this.getTaskHoursHtml_2(newTimeEstimate)
                            Confirmer.destroy();
                            Confirmer.close();
                        }
                    }
                }),
                new BX.PopupWindowButton({
                    text: BX.message('NO'),
                    className: "error-button-closed",
                    events: {
                        click: function () {
                            $this.layout.textBar.innerHTML = $this.getTaskHoursHtml_1()
                            Confirmer.destroy();
                            Confirmer.close();
                        }
                    }
                })
            ]
        })
        Confirmer.show()
        return this.layout.textBar.innerHTML;
    };
    GanttTask.prototype.updatePlanBars = function () {
        if (this.layout.row == null)
            return;

        //var isEndless = (!this.isRealDateEnd && this.status != "completed") ||
        //				(this.status == "completed" && this.dateCompleted != null && this.dateCompleted <= this.dateStart);

        var isEndless = !this.isRealDateEnd;
        this.layout.planBar.className = "task-gantt-bar-plan" +
            (isEndless ? " task-gantt-bar-plan-endless" : "") +
            (!this.canEditPlanDates ? " task-gantt-bar-plan-read-only" : "");
        this.resizePlanBar(this.dateStart, this.dateEnd);
        this.resizeTextBar(this.dateStart, this.dateEnd);
    };

    GanttTask.prototype.createRealBar = function () {
        if (this.layout.row == null || this.dateStarted == null)
            return;

        this.layout.realBar = BX.create("div", {props: {className: "task-gantt-bar-real"}});
        this.layout.row.appendChild(this.layout.realBar);

        this.updateRealBar();
    };

    GanttTask.prototype.updateRealBar = function () {
        if (this.layout.row == null) {
            return;
        }

        if (this.dateStarted != null) {
            if (this.layout.realBar == null) {
                this.createRealBar();
            } else {
                var left = this.getTimeline().getPixelsFromDate(this.dateStarted);

                var dateRealBarEnd = this.dateCompleted != null ? this.dateCompleted : this.chart.currentDatetime;
                var width = dateRealBarEnd > this.dateStarted ? this.getTimeline().getPixelsFromDate(dateRealBarEnd) - left : 0;

                this.layout.realBar.style.left = left + "px";
                this.layout.realBar.style.width = width + "px";
            }
        } else {
            if (this.layout.realBar != null) {
                this.layout.row.removeChild(this.layout.realBar);
            }

            this.layout.realBar = null;
        }
    };

    GanttTask.prototype.createCompleteFlag = function () {
        if (this.layout.row == null || this.dateCompleted == null)
            return;

        this.layout.completeFlag = BX.create("div", {props: {className: "task-gantt-complete-flag"}});
        this.layout.row.appendChild(this.layout.completeFlag);

        this.updateCompleteFlag();
    };

    GanttTask.prototype.updateCompleteFlag = function () {
        if (this.layout.row == null) {
            return;
        }

        if (this.dateCompleted != null) {
            if (this.layout.completeFlag == null) {
                this.createCompleteFlag();
            } else {
                this.layout.completeFlag.style.left = this.getTimeline().getPixelsFromDate(this.dateCompleted) - 8 + "px";
            }
        } else {
            if (this.layout.completeFlag != null) {
                this.layout.row.removeChild(this.layout.completeFlag);
            }

            this.layout.completeFlag = null;
        }
    };

    GanttTask.prototype.createDeadlineBars = function () {
        if (this.layout.row == null || this.dateDeadline == null) {
            return;
        }

        this.layout.deadlineSlider = BX.create("div", {
            props: {className: "task-gantt-deadline-slider"},
            events: {mousedown: BX.proxy(this.onDeadlineMouseDown, this)}
        });

        this.layout.row.appendChild(this.layout.deadlineSlider);

        this.layout.deadlineBar = BX.create("div", {props: {className: "task-gantt-bar-deadline"}});
        this.layout.row.appendChild(this.layout.deadlineBar);

        this.layout.deadlineOverdue = BX.create("div", {props: {className: "task-gantt-bar-deadline-overdue"}});
        this.layout.row.appendChild(this.layout.deadlineOverdue);
        this.layout.realOverdue = BX.create("div", {props: {className: "task-gantt-bar-real-overdue"}});
        this.layout.row.appendChild(this.layout.realOverdue);

        this.updateDeadlineBars();
    };

    GanttTask.prototype.updateDeadlineBars = function () {
        if (this.layout.row == null) {
            return;
        }

        if (this.dateDeadline != null) {
            if (this.layout.deadlineSlider == null) {
                this.createDeadlineBars();
            } else {
                if (this.canEditDeadline) {
                    BX.removeClass(this.layout.deadlineSlider, "task-gantt-deadline-read-only");
                } else {
                    BX.addClass(this.layout.deadlineSlider, "task-gantt-deadline-read-only");
                }

                this.layout.deadlineSlider.style.left = this.getTimeline().getPixelsFromDate(this.dateDeadline) + "px";
                this.resizeDeadlineBar(this.dateDeadline);
                this.resizeDeadlineOverdueBar(this.dateDeadline);
                this.resizeRealOverdueBar(this.dateDeadline);
                if(this.layout.deadlineOverdue.offsetWidth>0&&this.status!=='waiting'){
                    this.status = 'overdue'
                }else{
                    this.status = this.initialStatus
                }
            }
        } else {
            if (this.layout.deadlineSlider != null) {
                this.layout.row.removeChild(this.layout.deadlineBar);
                this.layout.row.removeChild(this.layout.deadlineSlider);
                this.layout.row.removeChild(this.layout.deadlineOverdue);
                this.layout.row.removeChild(this.layout.realOverdue);
            }

            this.layout.deadlineBar = null;
            this.layout.deadlineSlider = null;
            this.layout.deadlineOverdue = null;
            this.layout.realOverdue = null;
        }
        this.updateItem();
    };

    GanttTask.prototype.offsetBars = function (offset) {
        this.resizerOffsetX += offset;

        if (this.layout.planBar)
            this.layout.planBar.style.left = (parseInt(this.layout.planBar.style.left) || 0) + offset + "px";

        if (this.layout.realBar)
            this.layout.realBar.style.left = (parseInt(this.layout.realBar.style.left) || 0) + offset + "px";

        if (this.layout.completeFlag)
            this.layout.completeFlag.style.left = (parseInt(this.layout.completeFlag.style.left) || 0) + offset + "px";

        if (this.layout.deadlineSlider) {
            this.layout.deadlineSlider.style.left = (parseInt(this.layout.deadlineSlider.style.left) || 0) + offset + "px";
            this.layout.deadlineBar.style.left = (parseInt(this.layout.deadlineBar.style.left) || 0) + offset + "px";
            this.layout.deadlineOverdue.style.left = (parseInt(this.layout.deadlineOverdue.style.left) || 0) + offset + "px";
            this.layout.realOverdue.style.left = (parseInt(this.layout.realOverdue.style.left) || 0) + offset + "px";
        }
    };

    /*==================Resize Task Bars=========*/
    GanttTask.prototype.resizePlanBar = function (dateStart, dateEnd) {
        if (this.layout.planBar == null)
            return;

        var left = this.getTimeline().getPixelsFromDate(dateStart);
        var right = this.getTimeline().getPixelsFromDate(dateEnd);
        var width = right - left;

        width = Math.max(width, this.chart.minBarWidth);
        if (!this.isRealDateEnd) {
            var widthWithArrow = width - this.chart.arrowBarWidth;
            if (widthWithArrow < this.chart.minBarWidth) {
                BX.removeClass(this.layout.planBar, "task-gantt-bar-plan-endless");
            } else {
                width = widthWithArrow;
                BX.addClass(this.layout.planBar, "task-gantt-bar-plan-endless");
            }
        }

        if (this.isGroup()) {
            if (width < this.chart.minGroupBarWidth) {
                BX.addClass(this.layout.planBar, "task-gantt-min-group-bar");
            } else {
                BX.removeClass(this.layout.planBar, "task-gantt-min-group-bar");
            }
        }

        this.layout.planBar.style.left = left + "px";
        this.layout.planBar.style.width = width + "px";
    };

    GanttTask.prototype.resizeDeadlineBar = function (dateDeadline) {
        if (this.layout.deadlineBar == null) {
            return;
        }

        var left = 0;
        var right = 0;
        if (dateDeadline > this.dateEnd) {
            left = this.getTimeline().getPixelsFromDate(this.dateEnd);
            right = this.getTimeline().getPixelsFromDate(dateDeadline);
        } else if (dateDeadline < this.dateStart) {
            left = this.getTimeline().getPixelsFromDate(this.dateDeadline);
            right = this.getTimeline().getPixelsFromDate(this.dateStart);
        }
        this.layout.deadlineBar.style.left = left + "px";
        this.layout.deadlineBar.style.width = (right - left) + "px";
    };

    GanttTask.prototype.resizeDeadlineOverdueBar = function (dateDeadline) {
        if (this.layout.deadlineOverdue == null) {
            return;
        }

        var left = 0;
        var right = 0;

        if (this.dateCompleted == null && this.chart.currentDatetime > dateDeadline) {
            left = this.getTimeline().getPixelsFromDate(dateDeadline);
            right = this.getTimeline().getPixelsFromDate(this.chart.currentDatetime);
        } else if (this.dateCompleted != null && this.dateCompleted > dateDeadline) {
            left = this.getTimeline().getPixelsFromDate(dateDeadline);
            right = this.getTimeline().getPixelsFromDate(this.dateCompleted);
        }

        this.layout.deadlineOverdue.style.left = left + "px";
        this.layout.deadlineOverdue.style.width = (right - left) + "px";
    };

    GanttTask.prototype.resizeRealOverdueBar = function (dateDeadline) {
        if (this.layout.realOverdue == null || this.dateStarted == null) {
            return;
        }

        if (this.dateStarted > dateDeadline) {
            dateDeadline = this.dateStarted;
        }

        var left = 0;
        var right = 0;
        if (this.dateCompleted == null && this.chart.currentDatetime > dateDeadline) {
            left = this.getTimeline().getPixelsFromDate(dateDeadline);
            right = this.getTimeline().getPixelsFromDate(this.chart.currentDatetime);
        } else if (this.dateCompleted != null && this.dateCompleted > dateDeadline) {
            left = this.getTimeline().getPixelsFromDate(dateDeadline);
            right = this.getTimeline().getPixelsFromDate(this.dateCompleted);
        }

        this.layout.realOverdue.style.left = left + "px";
        this.layout.realOverdue.style.width = (right - left) + "px";
    };
    GanttTask.prototype.resizeTextBar = function (dateStart, dateEnd) {
        if (this.layout.textBar == null)
            return;

        var left = this.getTimeline().getPixelsFromDate(dateStart);
        var right = this.getTimeline().getPixelsFromDate(dateEnd);
        left += (right - left) / 2;
        //
        // width = Math.max(width, this.chart.minBarWidth);

        this.layout.textBar.style.left = left + "px";
        //this.layout.textBar.style.width = width + "px";
    };

    GanttTask.prototype.onItemNameClick = function (event) {
        event = event || window.event;

        if (!BX.IthiveGanttChart.isLeftClick(event))
            return;

        if (!this.chart.settings.disableItemNameClickHandler && BX.type.isFunction(this.details)) {
            this.details({event: event});
            BX.PreventDefault(event);
        }
    };

    GanttTask.prototype.onItemMenuClick = function (event) {
        var menu = BX.PopupMenu.create(this.id, this.layout.menu, this.menuItems, {
            offsetLeft: 8,
            bindOptions: {forceBindPosition: true},
            events: {onPopupClose: BX.proxy(this.onItemMenuClose, this)},
            chart: this.chart,
            task: this
        });

        menu.getPopupWindow().setBindElement(this.layout.menu);
        menu.show();

        this.denyItemsHover();
        BX.addClass(this.layout.menu, "task-gantt-item-menu-selected");
    };

    GanttTask.prototype.onItemMenuClose = function (popupWindow, event) {
        this.allowItemsHover(event);
        BX.removeClass(this.layout.menu, "task-gantt-item-menu-selected");
    };

    GanttTask.prototype.onItemMouseOver = function (event) {
        if (!this.chart.allowRowHover)
            return;

        event = event || window.event;


        BX.addClass(this.layout.item, "task-gantt-item-hover task-gantt-item-tree-hover");
        BX.addClass(this.layout.row, "task-gantt-timeline-row-hover");
    };

    GanttTask.prototype.onItemMouseOut = function (event) {
        if (!this.chart.allowRowHover)
            return;

        if (this.isShowQuickInfo(event))
            BX.TaskQuickInfo.hide();

        BX.removeClass(this.layout.item, "task-gantt-item-hover task-gantt-item-tree-hover");
        BX.removeClass(this.layout.row, "task-gantt-timeline-row-hover");
    };

    GanttTask.prototype.onRowMouseOver = function (event) {
        if (!this.chart.allowRowHover)
            return;

        event = event || window.event;
        if (this.isShowQuickInfo(event)) {
            BX.fixEventPageX(event);

            BX.TaskQuickInfo.show(
                function () {

                    this.chart.adjustChartContainer();

                    var top = this.layout.row.offsetTop + this.chart.chartContainer.pos.top + 58;
                    var left = event.pageX;
                    var bottom = top + 27;

                    return {
                        left: left,
                        top: top,
                        bottom: bottom
                    };
                }.bind(this),
                this.getQuickInfoData(),
                {
                    dateFormat: this.chart.dateFormat,
                    dateInUTC: true,
                    onDetailClick: this.chart.settings.disableDetailClickHandler ? null : BX.proxy(this.onQuickInfoDetails, this),
                    userProfileUrl: this.chart.userProfileUrl
                }
            );
        }

        BX.addClass(this.layout.item, "task-gantt-item-hover");
        BX.addClass(this.layout.row, "task-gantt-timeline-row-hover");
    };

    GanttTask.prototype.onRowMouseOut = function (event) {
        if (!this.chart.allowRowHover)
            return;

        if (this.isShowQuickInfo(event))
            BX.TaskQuickInfo.hide();

        BX.removeClass(this.layout.item, "task-gantt-item-hover task-gantt-item-tree-hover");
        BX.removeClass(this.layout.row, "task-gantt-timeline-row-hover");
    };

    GanttTask.prototype.onRowDoubleClick = function (event) {
        event = event || window.event;
        if (BX.type.isFunction(this.details))
            return this.details({event: event});
    };

    GanttTask.prototype.onRowContextMenu = function (event) {
        event = event || window.event;
        if (this.menuItems.length < 1 || event.ctrlKey)
            return;

        BX.TaskQuickInfo.hide();

        BX.fireEvent(document.body, "click");

        BX.PopupMenu.destroy(this.id);

        var menu = BX.PopupMenu.create(this.id, event, this.menuItems, {
            offsetLeft: 1,
            autoHide: true,
            closeByEsc: true,
            bindOptions: {forceBindPosition: true},
            events: {onPopupClose: BX.proxy(this.onItemMenuClose, this)},
            chart: this.chart,
            task: this
        });

        menu.getPopupWindow().setBindElement(event);
        menu.show();

        var row = null;
        var target = event.target || event.srcElement;
        if (BX.hasClass(target, "task-gantt-timeline-row"))
            row = target;
        else if (BX.hasClass(target.parentNode, "task-gantt-timeline-row"))
            row = target.parentNode;
        else if (BX.hasClass(target.parentNode.parentNode, "task-gantt-timeline-row"))
            row = target.parentNode.parentNode;

        if (row != null && BX.type.isNotEmptyString(row.id)) {
            var task = this.chart.getTaskById(row.id.substr("task-gantt-timeline-row-".length));
            if (task != null) {
                BX.addClass(task.layout.item, "task-gantt-item-hover");
                BX.addClass(task.layout.row, "task-gantt-timeline-row-hover");
            }
        }

        this.denyItemsHover();

        BX.PreventDefault(event);
    };

    GanttTask.prototype.onQuickInfoDetails = function (event, popupWindow, quickInfo) {
        popupWindow.close();
        if (BX.type.isFunction(this.details))
            return this.details({event: event, popupWindow: popupWindow, quickInfo: quickInfo});
    };

    GanttTask.prototype.isShowQuickInfo = function (event) {
        if (this.chart.dragClientX != 0 || !this.chart.allowRowHover)
            return false;

        event = event || window.event;
        var target = event.target || event.srcElement;
        return target == this.layout.planBar ||
            target == this.layout.realBar ||
            target == this.layout.name ||
            target == this.layout.deadlineBar ||
            target == this.layout.deadlineOverdue ||
            target == this.layout.realOverdue ||
            target == this.layout.completeFlag ||
            target == this.layout.deadlineSlider;
    };

    GanttTask.prototype.getQuickInfoData = function () {
        var dateStart = this.isRealDateStart ? this.dateStart : null;
        var dateEnd = this.isRealDateEnd ? this.dateEnd : null;

        return {
            id: this.id,
            name: this.name,

            dateCreated: this.dateCreated,
            dateStart: dateStart,
            dateEnd: dateEnd,
            dateDeadline: this.dateDeadline,
            dateCompleted: this.dateCompleted,
            dateStarted: this.dateStarted,

            files: this.files,
            priority: this.priority,
            status: this.status,
            responsible: this.responsible,
            responsibleId: this.responsibleId,
            director: this.director,
            directorId: this.directorId,

            url: this.url
        };
    };

    GanttTask.prototype.denyItemsHover = function () {
        this.chart.allowRowHover = false;
    };

    GanttTask.prototype.allowItemsHover = function (event) {
        this.chart.allowRowHover = true;

        event = event || window.event || null;
        if (!event)
            return;

        var target = event.target || event.srcElement;

        if (event.keyCode == 27 ||
            (
                target != this.layout.row &&
                target.parentNode != this.layout.row &&
                target.parentNode.parentNode != this.layout.row &&
                target != this.layout.item && target.parentNode != this.layout.item
            )
        ) {
            BX.removeClass(this.layout.item, "task-gantt-item-hover task-gantt-item-tree-hover");
            BX.removeClass(this.layout.row, "task-gantt-timeline-row-hover");
        } else if (target != this.layout.item && target.parentNode != this.layout.item) {
            BX.removeClass(this.layout.item, "task-gantt-item-tree-hover");
        }
    };

    GanttTask.prototype.isHidden = function () {
        return this.respon.opened === false;
    };

    GanttTask.prototype.show = function () {
        BX.removeClass(this.layout.item, "task-gantt-item-hidden");
        BX.removeClass(this.layout.row, "task-gantt-item-hidden");
    };

    GanttTask.prototype.hide = function () {
        BX.addClass(this.layout.item, "task-gantt-item-hidden");
        BX.addClass(this.layout.row, "task-gantt-item-hidden");
    };

    GanttTask.prototype.highlight = function () {
        if (!this.highlightTimeout) {
            BX.addClass(this.layout.item, "task-gantt-item-highlighted");
            BX.addClass(this.layout.row, "task-gantt-row-highlighted");
            this.highlightTimeout = setTimeout(BX.proxy(this.stopHighlight, this), 1000);
        }
    };

    GanttTask.prototype.stopHighlight = function () {
        if (this.highlightTimeout) {
            clearTimeout(this.highlightTimeout);
        }

        this.highlightTimeout = null;
        BX.removeClass(this.layout.item, "task-gantt-item-highlighted");
        BX.removeClass(this.layout.row, "task-gantt-row-highlighted");
    };

    GanttTask.prototype.scrollIntoView = function (alignToTop) {
        this.layout.item.scrollIntoView(alignToTop);
    };

    GanttTask.prototype.getMinDate = function () {
        var dates = [this.dateStart, this.dateEnd, this.dateCreated, this.dateStarted, this.dateCompleted, this.dateDeadline];
        for (var i = dates.length - 1; i >= 0; i--)
            if (dates[i] == null)
                dates.splice(i, 1);

        return new Date(Math.min.apply(null, dates));
    };

    GanttTask.prototype.getMaxDate = function () {
        var dates = [this.dateStart, this.dateEnd, this.dateCreated, this.dateStarted, this.dateCompleted, this.dateDeadline];
        for (var i = dates.length - 1; i >= 0; i--)
            if (dates[i] == null)
                dates.splice(i, 1);

        return new Date(Math.max.apply(null, dates));
    };

    /*==================Handlers==============*/
    GanttTask.prototype.startResize = function (event, mouseUpHandler, mouseMoveHandler, cursor) {
        event = event || window.event;

        BX.bind(document, "mouseup", mouseUpHandler);
        BX.bind(document, "mousemove", mouseMoveHandler);

        document.body.onselectstart = BX.False;
        document.body.ondragstart = BX.False;
        document.body.style.MozUserSelect = "none";
        document.body.style.cursor = cursor ? cursor : "ew-resize";
        //this.chart.layout.root.style.cursor = "ew-resize";

        this.denyItemsHover();
        BX.TaskQuickInfo.hide();
        BX.PreventDefault(event);
    };

    GanttTask.prototype.endResize = function (event, mouseUpHandler, mouseMoveHandler) {
        event = event || window.event;

        BX.unbind(document, "mouseup", mouseUpHandler);
        BX.unbind(document, "mousemove", mouseMoveHandler);

        document.body.onselectstart = null;
        document.body.ondragstart = null;
        document.body.style.MozUserSelect = "";
        document.body.style.cursor = "default";
        //this.chart.layout.root.style.cursor = "default";

        this.stopAutoResize();
        this.allowItemsHover(event);
        this.chart.tooltip.hide();
    };

    /*==========================Dealine Resize=========================*/
    GanttTask.prototype.onDeadlineMouseDown = function (event) {
        if (!this.canEditDeadline) {
            return;
        }

        event = event || window.event;
        BX.fixEventPageX(event);
        if (!BX.IthiveGanttChart.isLeftClick(event)) {
            return;
        }

        this.resizerOffsetX = this.getTimeline().getPixelsFromDate(this.dateDeadline);
        this.resizerPageX = event.pageX;
        this.resizerChangePos = false;

        this.startResize(event, BX.proxy(this.onDeadlineMouseUp, this), BX.proxy(this.onDeadlineMouseMove, this));
    };

    GanttTask.prototype.onDeadlineMouseUp = function (event) {
        this.endResize(event, BX.proxy(this.onDeadlineMouseUp, this), BX.proxy(this.onDeadlineMouseMove, this));

        if (this.resizerChangePos) {
            if (this.matchWorkTime) {
                this.dateDeadline = this.chart.calendar.getClosestWorkTime(this.dateDeadline, true);
                this.redraw();
            }

            BX.onCustomEvent(this.chart, "onTaskChange", [[this.getEventObject(["dateDeadline"])]]);
        }
    };

    GanttTask.prototype.onDeadlineMouseMove = function (event) {
        this.autoResize(event, this.resizeDeadlineDate);
    };

    GanttTask.prototype.resizeDeadlineDate = function (offset) {
        this.resizerOffsetX = this.resizerOffsetX + offset;
        this.layout.deadlineSlider.style.left = this.resizerOffsetX + "px";

        this.dateDeadline = this.getTimeline().getDateFromPixels(this.resizerOffsetX);

        this.resizeDeadlineBar(this.dateDeadline);
        this.resizeDeadlineOverdueBar(this.dateDeadline);
        this.resizeRealOverdueBar(this.dateDeadline);

        this.chart.tooltip.show(this.resizerOffsetX, this);

        this.chart.autoExpandTimeline(this.dateDeadline);
    };

    /*=========================== Date Start Resize =====================*/
    GanttTask.prototype.onStartDateMouseDown = function (event) {
        if (!this.canEditPlanDates || this.isGroup()) {
            return;
        }

        event = event || window.event;
        BX.fixEventPageX(event);
        if (!BX.IthiveGanttChart.isLeftClick(event)) {
            return;
        }

        this.layout.planBarStart.style.zIndex = parseInt(this.layout.planBarEnd.style.zIndex) + 1;
        this.resizerOffsetX = this.getTimeline().getPixelsFromDate(this.dateStart);
        this.resizerPageX = event.pageX;
        this.resizerChangePos = false;

        this.startResize(event, BX.proxy(this.onStartDateMouseUp, this), BX.proxy(this.onStartDateMouseMove, this));
    };

    GanttTask.prototype.onStartDateMouseUp = function (event) {
        this.endResize(event, BX.proxy(this.onStartDateMouseUp, this), BX.proxy(this.onStartDateMouseMove, this));

        if (this.resizerChangePos) {
            this.matchWorkingTime(this.dateStart);
            this.schedule();
            this.chart.drawDependencies();
            BX.onCustomEvent(this.chart, "onTaskChange", [[this.getEventObject(["dateStart"])]]);
            this.resizeTextBar(this.dateStart, this.dateEnd);
        }
    };

    GanttTask.prototype.onStartDateMouseMove = function (event) {
        this.autoResize(event, this.resizeStartDate);
    };

    GanttTask.prototype.resizeStartDate = function (offset) {
        this.resizerOffsetX = this.resizerOffsetX + offset;
        var dateEndOffset = this.getTimeline().getPixelsFromDate(this.dateEnd);
        if ((dateEndOffset - this.resizerOffsetX) < this.chart.minBarWidth) {
            this.dateStart = this.getTimeline().getDateFromPixels(dateEndOffset - this.chart.minBarWidth);
            this.isRealDateStart = true;
            this.resizePlanBar(this.dateStart, this.dateEnd);
            this.resizeDeadlineBar(this.dateDeadline);
            this.chart.tooltip.show(this.resizerOffsetX, this);
        } else {
            this.dateStart = this.getTimeline().getDateFromPixels(this.resizerOffsetX);
            this.isRealDateStart = true;
            this.resizePlanBar(this.dateStart, this.dateEnd);
            this.resizeDeadlineBar(this.dateDeadline);
            this.chart.tooltip.show(this.resizerOffsetX, this);
            this.chart.autoExpandTimeline(this.dateStart);
        }

        this.redrawDependencies();
    };

    /*===========================Date End Resize=========================*/
    GanttTask.prototype.onEndDateMouseDown = function (event) {
        if (!this.canEditPlanDates || this.isGroup()) {
            return;
        }

        event = event || window.event;
        BX.fixEventPageX(event);
        if (!BX.IthiveGanttChart.isLeftClick(event))
            return;

        this.layout.planBarEnd.style.zIndex = parseInt(this.layout.planBarStart.style.zIndex) + 1;
        this.resizerOffsetX = this.getTimeline().getPixelsFromDate(this.dateEnd);
        this.resizerPageX = event.pageX;
        this.resizerChangePos = false;

        this.startResize(event, BX.proxy(this.onEndDateMouseUp, this), BX.proxy(this.onEndDateMouseMove, this));
    };

    GanttTask.prototype.onEndDateMouseUp = function (event) {
        this.endResize(event, BX.proxy(this.onEndDateMouseUp, this), BX.proxy(this.onEndDateMouseMove, this));

        if (this.resizerChangePos) {
            this.matchWorkingTime(null, this.dateEnd);
            this.schedule();
            this.chart.drawDependencies();
            BX.onCustomEvent(this.chart, "onTaskChange", [[this.getEventObject(["dateEnd"])]]);
            this.resizeTextBar(this.dateStart, this.dateEnd);
        }
    };

    GanttTask.prototype.onEndDateMouseMove = function (event) {
        if (!this.isRealDateEnd) {
            this.isRealDateEnd = true;
            BX.removeClass(this.layout.planBar, "task-gantt-bar-plan-endless");
        }

        this.autoResize(event, this.resizeEndDate);
    };

    GanttTask.prototype.resizeEndDate = function (offset) {
        this.resizerOffsetX = this.resizerOffsetX + offset;
        var dateStartOffset = this.getTimeline().getPixelsFromDate(this.dateStart);
        if ((this.resizerOffsetX - dateStartOffset) < this.chart.minBarWidth) {
            //Min Task Width
            this.dateEnd = this.getTimeline().getDateFromPixels(dateStartOffset + this.chart.minBarWidth);
            this.resizePlanBar(this.dateStart, this.dateEnd);
            this.resizeDeadlineBar(this.dateDeadline);
            this.chart.tooltip.show(this.resizerOffsetX, this);
        } else {
            this.dateEnd = this.getTimeline().getDateFromPixels(this.resizerOffsetX);
            this.resizePlanBar(this.dateStart, this.dateEnd);
            this.resizeDeadlineBar(this.dateDeadline);
            this.chart.tooltip.show(this.resizerOffsetX, this);
            this.chart.autoExpandTimeline(this.dateEnd);
        }

        this.redrawDependencies();
    };

    /* Move Plan Bar */
    GanttTask.prototype.onPlanBarMouseDown = function (event) {
        if (!this.canEditPlanDates) {
            return;
        }

        event = event || window.event;
        BX.fixEventPageX(event);
        if (!BX.IthiveGanttChart.isLeftClick(event)) {
            return;
        }

        this.resizerOffsetX = this.getTimeline().getPixelsFromDate(this.dateStart);
        this.resizerPageX = event.pageX;
        this.resizerChangePos = false;

        this.startResize(event, BX.proxy(this.onPlanBarMouseUp, this), BX.proxy(this.onPlanBarMouseMove, this), "move");

        this.duration = this.calculateDuration();
    };

    GanttTask.prototype.onPlanBarMouseUp = function (event) {
        this.endResize(event, BX.proxy(this.onPlanBarMouseUp, this), BX.proxy(this.onPlanBarMouseMove, this));

        if (this.resizerChangePos) {
            this.matchWorkingTime(this.dateStart, this.dateEnd, this.duration);
            this.schedule();
            this.chart.drawDependencies();
            BX.onCustomEvent(this.chart, "onTaskChange", [[this.getEventObject(["dateStart", "dateEnd"])]]);
            this.resizeTextBar(this.dateStart, this.dateEnd);
        }
    };

    GanttTask.prototype.onPlanBarMouseMove = function (event) {
        if (!this.isRealDateEnd) {
            this.isRealDateEnd = true;
            BX.removeClass(this.layout.planBar, "task-gantt-bar-plan-endless");
            this.redraw();
        }

        this.autoResize(event, this.resizeStartEndDate, true);
    };

    GanttTask.prototype.resizeStartEndDate = function (offset) {
        this.resizerOffsetX = this.resizerOffsetX + offset;

        var edges = this.getCoords();

        //var left = parseInt(this.layout.planBar.style.left);
        //this.layout.planBar.style.left = left + offset + "px";

        this.dateStart = this.getTimeline().getDateFromPixels(edges.startX + offset);
        this.dateEnd = this.getTimeline().getDateFromPixels(edges.endX + offset);
        this.layout.planBar.style.left = edges.startX + offset + "px";

        this.isRealDateStart = true;
        this.isRealDateEnd = true;

        this.resizeDeadlineBar(this.dateDeadline);

        //this.chart.tooltip.show(this.resizerOffsetX, this);
        this.chart.tooltip.show(
            this.autoResizeEvent.pageX
            - this.chart.chartContainer.pos.left - this.chart.gutterOffset
            + this.getTimeline().getScrollLeft(), this);

        this.chart.autoExpandTimeline([this.dateStart, this.dateEnd]);

        this.redrawDependencies();
    };

    GanttTask.prototype.onStartPointMouseDown = function (event) {
        this.chart.pointer.startDrag(this, true, event);
    };

    GanttTask.prototype.onEndPointMouseDown = function (event) {
        this.chart.pointer.startDrag(this, false, event);
    };

    /*============== Auto Resize =========================================*/
    GanttTask.prototype.autoResize = function (event, autoResizeCallback, skipSnap) {
        event = event || window.event;
        BX.fixEventPageXY(event);
        this.autoResizeEvent = {
            clientX: event.clientX,
            clientY: event.clientY,
            pageX: event.pageX,
            pageY: event.pageY
        };

        this.autoResizeCallback = autoResizeCallback;
        this.resizerChangePos = true;
        skipSnap = !!skipSnap;

        if (event.pageX > this.chart.chartContainer.maxPageX && (event.pageX - this.resizerPageX) > 0 && !this.autoResizeIntID) {
            this.stopAutoResize();
            if (!skipSnap) {
                var maxOffset = this.chart.chartContainer.width - this.chart.chartContainer.padding - this.chart.gutterOffset + this.getTimeline().getScrollLeft();
                this.autoResizeCallback(maxOffset - this.resizerOffsetX, event.pageY - this.resizerPageY);
                this.resizerPageX = this.chart.chartContainer.maxPageX;
                this.resizerPageY = event.pageY;
            }

            this.autoResizeIntID = setInterval(BX.proxy(this.autoResizeRight, this), this.autoResizeTimeout);
        } else if (event.pageX < this.chart.chartContainer.minPageX && (event.pageX - this.resizerPageX) < 0 && !this.autoResizeIntID) {
            this.stopAutoResize();
            if (!skipSnap) {
                var minOffset = this.chart.chartContainer.padding + this.getTimeline().getScrollLeft();
                this.autoResizeCallback(minOffset - this.resizerOffsetX, event.pageY - this.resizerPageY);
                this.resizerPageX = this.chart.chartContainer.minPageX;
                this.resizerPageY = event.pageY;
            }

            this.autoResizeIntID = setInterval(BX.proxy(this.autoResizeLeft, this), this.autoResizeTimeout);
        } else if ((event.pageX > this.chart.chartContainer.minPageX && event.pageX < this.chart.chartContainer.maxPageX) || !this.autoResizeIntID) {
            this.stopAutoResize();
            this.autoResizeCallback(event.pageX - this.resizerPageX, event.pageY - this.resizerPageY);
            this.resizerPageX = event.pageX;
            this.resizerPageY = event.pageY;
        } else {
            this.resizerPageX = event.pageX;
            this.resizerPageY = event.pageY;
        }
    };

    GanttTask.prototype.stopAutoResize = function () {
        if (this.autoResizeIntID)
            clearInterval(this.autoResizeIntID);
        this.autoResizeIntID = null;
    };

    GanttTask.prototype.autoResizeRight = function () {
        this.getTimeline().setScrollLeft(this.getTimeline().getScrollLeft() + this.chart.chartContainer.padding);
        this.autoResizeCallback(this.chart.chartContainer.padding, 0);
    };

    GanttTask.prototype.autoResizeLeft = function () {
        this.getTimeline().setScrollLeft(this.getTimeline().getScrollLeft() - this.chart.chartContainer.padding);
        this.autoResizeCallback(-this.chart.chartContainer.padding, 0);
    };

    GanttTask.prototype.getMouseOffset = function (event) {
        return event.pageX - (this.chart.chartContainer.pos.left + this.chart.gutterOffset) + this.getTimeline().getScrollLeft();
    };

    GanttTask.prototype.getRealDates = function () {
        var dateStart = this.isRealDateStart ? this.dateStart : null;
        var dateEnd = this.isRealDateEnd ? this.dateEnd : null;

        return {
            dateCreated: BX.IthiveGanttChart.convertDateFromUTC(this.dateCreated),
            dateStart: BX.IthiveGanttChart.convertDateFromUTC(dateStart),
            dateEnd: BX.IthiveGanttChart.convertDateFromUTC(dateEnd),
            dateDeadline: BX.IthiveGanttChart.convertDateFromUTC(this.dateDeadline),
            dateCompleted: BX.IthiveGanttChart.convertDateFromUTC(this.dateCompleted),
            dateStarted: BX.IthiveGanttChart.convertDateFromUTC(this.dateStarted)
        };
    };

    GanttTask.prototype.getEventObject = function (changes) {
        var obj = this.getRealDates();
        obj.timeEstimate = this.timeEstimate
        obj.task = this;
        obj.changes = BX.type.isArray(changes) ? changes : [];
        return obj;
    };

    GanttTask.prototype.getCoords = function () {
        var x = this.layout.planBar.offsetLeft;
        var y = this.layout.row.offsetTop + 16;
        return {
            startX: x,
            startY: y,
            endX: x + this.layout.planBar.offsetWidth,
            endY: y
        };
    };

    GanttTask.prototype.schedule = function (constraint, transaction) {
        if (!this.canEditPlanDates) {
            return;
        }

        transaction = transaction || new Date().getTime();
        if (constraint && this.transaction !== transaction) {
            var startDate = constraint.getMinDate();
            var duration = this.calculateDuration();
            var endDate = BX.Tasks.Date.add(startDate, BX.Tasks.Date.Unit.Milli, duration);

            this.setTaskFromJSON({
                dateStart: BX.IthiveGanttChart.convertDateFromUTC(startDate),
                dateEnd: BX.IthiveGanttChart.convertDateFromUTC(endDate)
            });

            this.correctWorkTime(startDate, endDate, duration);
            this.redraw();
        }

        this.transaction = transaction;

        for (var linkId in this.predecessors) {
            if (this.predecessors.hasOwnProperty(linkId)) {
                var predecessor = this.predecessors[linkId];
                predecessor.updateLag();
            }
        }

        for (linkId in this.succesors) {
            if (this.succesors.hasOwnProperty(linkId)) {
                var successor = this.chart.getTaskById(this.succesors[linkId].to);
                successor.schedule(this.succesors[linkId], transaction);
            }
        }
    };

    GanttTask.prototype.calculateDuration = function () {
        if (this.matchWorkTime) {
            var duration = this.chart.calendar.calculateDuration(this.dateStart, this.dateEnd);
            return duration > 0 ? duration : this.dateEnd - this.dateStart;
        } else {
            return this.dateEnd - this.dateStart;
        }
    };

    GanttTask.prototype.getMinimalStartDate = function () {
        var minStartDate = null;
        for (var linkId in this.predecessors) {
            if (!this.predecessors.hasOwnProperty(linkId)) {
                continue;
            }

            var link = this.predecessors[linkId];
            var date = link.getMinDate();
            if (minStartDate === null || minStartDate < date) {
                minStartDate = date;
            }
        }

        return minStartDate;
    };

    GanttTask.prototype.correctWorkTime = function (startDate, endDate, duration) {
        if (!this.matchWorkTime) {
            return;
        }

        var calendar = this.chart.calendar;
        if (!calendar.isWorkTime(startDate)) {
            this.dateStart = calendar.getClosestWorkTime(startDate, true);
            this.dateEnd = calendar.calculateEndDate(startDate, duration);
        } else {
            this.dateEnd = calendar.calculateEndDate(startDate, duration);
        }
    };

    GanttTask.prototype.matchWorkingTime = function (startDate, endDate, duration) {
        if (!this.matchWorkTime) {
            return;
        }

        if (startDate && endDate) {
            this.correctWorkTime(startDate, endDate, duration);
        } else if (startDate) {
            this.dateStart = this.chart.calendar.getClosestWorkTime(startDate, true);
            if (this.dateStart > this.dateEnd) {
                this.dateEnd = this.chart.calendar.calculateEndDate(startDate, this.dateEnd - startDate);
            }
        } else if (endDate) {
            this.dateEnd = this.chart.calendar.getClosestWorkTime(endDate, false);
            if (this.dateStart > this.dateEnd) {
                this.dateStart = this.chart.calendar.calculateStartDate(this.dateEnd, endDate - this.dateStart);
            }
        }

        this.redraw();
    };
    //endregion
    //region Timeline
    /**
     *
     * @param {BX.IthiveGanttChart} chart
     * @constructor
     */
    var Timeline = function (chart) {
        this.chart = chart;
        this.firstWeekDay = 1;

        this.setFirstWeekDay(chart.settings.firstWeekDay);

        this.headerViewportWidth = null;

        this.configure();
    };

    Timeline.prototype.configure = function () {
        //Scale options
        this.topUnit = BX.Tasks.Date.Unit.Month;
        this.topIncrement = 1;
        this.topDateFormat = "F Y";

        this.bottomUnit = BX.Tasks.Date.Unit.Day;
        this.bottomIncrement = 1;
        this.bottomDateFormat = "j";

        this.snapUnit = BX.Tasks.Date.Unit.Hour;
        this.snapIncrement = 1;
        this.snapWidth = 1;
        this.columnWidth = 24;

        //Start-End
        var currentDateMin = BX.Tasks.Date.floorDate(this.chart.currentDatetime, this.topUnit, this.firstWeekDay);
        var currentDateMax = BX.Tasks.Date.ceilDate(this.chart.currentDatetime, this.topUnit, this.topIncrement, this.firstWeekDay);

        var snapUnitsInViewport = Math.ceil(this.chart.chartContainer.width / this.getUnitInPixels(this.snapUnit));
        var snapUnitsInTopHeader = BX.Tasks.Date.getDurationInUnit(currentDateMin, currentDateMax, this.snapUnit);

        var increment = Math.ceil(snapUnitsInViewport / snapUnitsInTopHeader);
        this.startDate = BX.Tasks.Date.add(currentDateMin, this.topUnit, -increment);
        this.endDate = BX.Tasks.Date.add(currentDateMax, this.topUnit, increment);
    };

    Timeline.prototype.setFirstWeekDay = function (day) {
        if (BX.type.isNumber(day) && day >= 0 && day <= 6) {
            this.firstWeekDay = day;
        }
    };

    Timeline.prototype.draw = function () {
        this.setTimelineWidth();
    };

    Timeline.prototype.getTimelineWidth = function () {
        return this.getTimespanInPixels(this.startDate, this.endDate, this.snapUnit);
    };

    Timeline.prototype.getTimespanWidth = function (startDate, endDate) {
        return this.getTimespanInPixels(startDate, endDate, this.snapUnit);
    };

    Timeline.prototype.getTimespanInPixels = function (startDate, endDate, unit) {
        var duration = BX.Tasks.Date.getDurationInUnit(startDate, endDate, unit);
        var unitSize = this.getUnitInPixels(unit);

        return duration * unitSize;
    };

    Timeline.prototype.setTimelineWidth = function () {
        this.chart.layout.timelineInner.style.width = this.getTimelineWidth() + "px";
    };

    Timeline.prototype.getColumnWidth = function () {
        return this.chart.gutterOffset;
    };

    Timeline.prototype.getScrollHeight = function () {
        return this.chart.layout.root.scrollHeight;
    };

    /**
     *
     * @return {Element}
     */
    Timeline.prototype.getRootContainer = function () {
        return this.chart.layout.root;
    };

    Timeline.prototype.autoExpandTimeline = function (dates, changeOnlyDates) {
        if (!BX.type.isArray(dates)) {
            dates = [dates];
        }

        var snapUnitsInViewport = Math.ceil(this.chart.chartContainer.width / this.getUnitInPixels(this.snapUnit));
        for (var i = 0; i < dates.length; i++) {
            var date = dates[i];

            var currentDateMin = BX.Tasks.Date.floorDate(date, this.topUnit, this.firstWeekDay);
            var currentDateMax = BX.Tasks.Date.ceilDate(date, this.topUnit, this.topIncrement, this.firstWeekDay);
            var snapUnitsInTopHeader = BX.Tasks.Date.getDurationInUnit(currentDateMin, currentDateMax, this.snapUnit);
            var increment = Math.ceil(snapUnitsInViewport / snapUnitsInTopHeader);

            var duration = BX.Tasks.Date.getDurationInUnit(this.startDate, date, this.snapUnit);
            if (duration <= snapUnitsInViewport) {
                var newStartDate = BX.Tasks.Date.add(currentDateMin, this.topUnit, -increment);
                this.expandTimelineLeft(newStartDate, changeOnlyDates);
                continue;
            }

            duration = BX.Tasks.Date.getDurationInUnit(date, this.endDate, this.snapUnit);
            if (duration <= snapUnitsInViewport) {
                var newEndDate = BX.Tasks.Date.add(currentDateMax, this.topUnit, increment);
                this.expandTimelineRight(newEndDate, changeOnlyDates);
            }
        }
    };

    Timeline.prototype.expandTimelineLeft = function (date, changeOnlyDate) {
        if (date >= this.startDate) {
            return;
        }

        var oldDate = new Date(this.startDate.getTime());
        this.startDate = date;
        if (this.chart.layout.root === null || changeOnlyDate === true) {
            return;
        }

        var duration = BX.Tasks.Date.getDurationInUnit(this.startDate, oldDate, this.snapUnit);
        var unitSize = this.getUnitInPixels(this.snapUnit);
        var offset = duration * unitSize;

        var scrollLeft = this.getScrollLeft();
        this.setTimelineWidth();
        for (var taskId in this.chart.tasks) {
            this.chart.tasks[taskId].offsetBars(offset);
        }

        this.chart.drawDependencies();
        this.chart.pointer.offsetLine(offset);

        this.setScrollLeft(scrollLeft + offset);
    };

    Timeline.prototype.expandTimelineRight = function (date, changeOnlyDate) {
        if (date <= this.endDate) {
            return;
        }

        this.endDate = date;
        if (this.chart.layout.root === null || changeOnlyDate === true) {
            return;
        }

        var scrollLeft = this.getScrollLeft();
        this.setTimelineWidth();
        this.setScrollLeft(scrollLeft);
    };

    Timeline.prototype.getStart = function () {
        return this.startDate;
    };

    Timeline.prototype.getEnd = function () {
        return this.endDate;
    };

    Timeline.prototype.getHeaderViewportWidth = function () {
        return this.headerViewportWidth !== null ? this.headerViewportWidth : this.chart.chartContainer.width;
    };

    Timeline.prototype.setHeaderViewportWidth = function (width) {
        if (BX.type.isNumber(width) || width === null) {
            this.headerViewportWidth = width;
        }
    };

    Timeline.prototype.renderHeader = function () {
        var viewport = this.getHeaderViewportWidth();
        var scrollLeft = this.getScrollLeft();

        var startDate = this.getDateFromPixels(scrollLeft);
        var endDate = this.getDateFromPixels(scrollLeft + viewport);

        startDate = BX.Tasks.Date.floorDate(startDate, this.topUnit, this.firstWeekDay);
        endDate = BX.Tasks.Date.ceilDate(endDate, this.topUnit, this.topIncrement, this.firstWeekDay);

        var topUnitsInViewport = Math.ceil(viewport / this.getUnitInPixels(this.topUnit));
        startDate = BX.Tasks.Date.add(startDate, this.topUnit, -topUnitsInViewport);
        endDate = BX.Tasks.Date.add(endDate, this.topUnit, topUnitsInViewport);
        startDate = BX.Tasks.Date.max(startDate, this.getStart());
        endDate = BX.Tasks.Date.min(endDate, this.getEnd());
        this.chart.layout.scalePrimary.innerHTML =
            this.createHeader(startDate, endDate, "top", this.topUnit, this.topIncrement);

        this.chart.layout.scaleSecondary.innerHTML =
            this.createHeader(startDate, endDate, "bottom", this.bottomUnit, this.bottomIncrement);
    };

    Timeline.prototype.createHeader = function (start, end, position, unit, increment) {
        var startDate = this.getStart();
        var endDate = end;
        var result = "";

        var offset = 0;
        while (startDate < endDate) {
            var nextDate = BX.Tasks.Date.min(BX.Tasks.Date.getNext(startDate, unit, increment, this.firstWeekDay), endDate);

            if (startDate >= start) {
                result += position === "top" ? this.renderTopHeader(startDate, nextDate) : this.renderBottomHeader(startDate, nextDate);
            } else {
                var duration = BX.Tasks.Date.getDurationInUnit(startDate, nextDate, this.snapUnit);
                var unitSize = this.getUnitInPixels(this.snapUnit);
                offset += this.getTimespanInPixels(startDate, nextDate, this.snapUnit);
            }

            startDate = nextDate;
        }

        return '<div style="position: absolute; left: ' + offset + 'px">' + result + '</div>';
    };

    Timeline.prototype.renderTopHeader = function (start, end) {

        var duration = BX.Tasks.Date.getDurationInUnit(start, end, this.snapUnit);
        var unitSize = this.getUnitInPixels(this.snapUnit);

        return '<span class="task-gantt-top-column" ' +
            'style="width:' + (duration * unitSize) + 'px"><span class="task-gantt-scale-month-text">' +
            BX.date.format(this.topDateFormat, start, null, true) + '</span></span>';
    };

    Timeline.prototype.renderBottomHeader = function (start, end) {
        var duration = BX.Tasks.Date.getDurationInUnit(start, end, this.snapUnit);
        var unitSize = this.getUnitInPixels(this.snapUnit);
        var columnClass = "task-gantt-bottom-column";
        if (this.bottomUnit !== BX.Tasks.Date.Unit.Month &&
            this.bottomUnit !== BX.Tasks.Date.Unit.Quarter &&
            this.bottomUnit !== BX.Tasks.Date.Unit.Year) {
            if (this.isToday(start, end)) {
                columnClass += " task-gantt-today-column";
            }

            if (this.isWeekend(start, end)) {
                columnClass += " task-gantt-weekend-column";
            }

            if (this.isHoliday(start, end)) {
                columnClass += " task-gantt-holiday-column";
            }
        }

        return '<span class="' + columnClass + '" style="width:' + (duration * unitSize) + 'px">' +
            BX.date.format(this.bottomDateFormat, start, null, true) +
            '</span>';
    };

    Timeline.prototype.isToday = function (start, end) {
        return this.chart.currentDate.getUTCMonth() === start.getUTCMonth() &&
            this.chart.currentDate.getUTCDate() === start.getUTCDate();

    };

    Timeline.prototype.isHoliday = function (start, end) {
        return this.chart.calendar.isHoliday(start);
    };

    Timeline.prototype.isWeekend = function (start, end) {
        return this.chart.calendar.isWeekend(start);
    };

    Timeline.prototype.getPixelsFromDate = function (date) {
        var duration = BX.Tasks.Date.getDurationInUnit(this.startDate, date, this.snapUnit);
        return duration * this.getUnitInPixels(this.snapUnit);
    };

    Timeline.prototype.getDateFromPixels = function (pixels) {
        var date = BX.Tasks.Date.add(this.startDate, this.snapUnit, Math.floor(pixels / this.getUnitInPixels(this.snapUnit)));
        return this.snapDate(date);

    };

    Timeline.prototype.getUnitInPixels = function (unit) {
        return BX.Tasks.Date.getUnitRatio(this.bottomUnit, unit) * this.columnWidth / this.bottomIncrement;
    };

    Timeline.prototype.snapDate = function (date) {
        var newDate = new Date(date.getTime());
        if (this.snapUnit === BX.Tasks.Date.Unit.Day) {
            var days = BX.Tasks.Date.getDurationInDays(this.startDate, newDate);
            var snappedDays = Math.round(days / this.snapIncrement) * this.snapIncrement;
            newDate = BX.Tasks.Date.add(this.startDate, BX.Tasks.Date.Unit.Day, snappedDays);
        } else if (this.snapUnit === BX.Tasks.Date.Unit.Hour) {
            var hours = BX.Tasks.Date.getDurationInHours(this.startDate, newDate);
            var snappedHours = Math.round(hours / this.snapIncrement) * this.snapIncrement;
            newDate = BX.Tasks.Date.add(this.startDate, BX.Tasks.Date.Unit.Minute, snappedHours * 60);
        } else if (this.snapUnit === BX.Tasks.Date.Unit.Minute) {
            var minutes = BX.Tasks.Date.getDurationInMinutes(this.startDate, newDate);
            var snappedMinutes = Math.round(minutes / this.snapIncrement) * this.snapIncrement;
            newDate = BX.Tasks.Date.add(this.startDate, BX.Tasks.Date.Unit.Second, snappedMinutes * 60);
        } else if (this.snapUnit === BX.Tasks.Date.Unit.Week) {
            newDate.setUTCHours(0, 0, 0, 0);
            var firstWeekDayDelta = newDate.getUTCDay() - this.firstWeekDay;
            if (firstWeekDayDelta < 0) {
                firstWeekDayDelta = 7 + firstWeekDayDelta;
            }
            var daysToSnap = Math.round(firstWeekDayDelta / 7) === 1 ? 7 - firstWeekDayDelta : -firstWeekDayDelta;
            newDate = BX.Tasks.Date.add(newDate, BX.Tasks.Date.Unit.Day, daysToSnap);
        } else if (this.snapUnit === BX.Tasks.Date.Unit.Month) {
            var months = BX.Tasks.Date.getDurationInMonths(this.startDate, newDate) + (newDate.getUTCDate() / BX.Tasks.Date.getDaysInMonth(newDate));
            var snappedMonth = Math.round(months / this.snapIncrement) * this.snapIncrement;
            newDate = BX.Tasks.Date.add(this.startDate, BX.Tasks.Date.Unit.Month, snappedMonth);
        } else if (this.snapUnit === BX.Tasks.Date.Unit.Second) {
            var seconds = BX.Tasks.Date.getDurationInSeconds(this.startDate, newDate);
            var snappedSeconds = Math.round(seconds / this.snapIncrement) * this.snapIncrement;
            newDate = BX.Tasks.Date.add(this.startDate, BX.Tasks.Date.Unit.Milli, snappedSeconds * 1000);
        } else if (this.snapUnit === BX.Tasks.Date.Unit.Milli) {
            var millis = BX.Tasks.Date.getDurationInMilliseconds(this.startDate, newDate);
            var snappedMilli = Math.round(millis / this.snapIncrement) * this.snapIncrement;
            newDate = BX.Tasks.Date.add(this.startDate, BX.Tasks.Date.Unit.Milli, snappedMilli);
        } else if (this.snapUnit === BX.Tasks.Date.Unit.Year) {
            var years = BX.Tasks.Date.getDurationInYears(this.startDate, newDate);
            var snappedYears = Math.round(years / this.snapIncrement) * this.snapIncrement;
            newDate = BX.Tasks.Date.add(this.startDate, BX.Tasks.Date.Unit.Year, snappedYears);
        } else if (this.snapUnit === BX.Tasks.Date.Unit.Quarter) {
            newDate.setUTCHours(0, 0, 0, 0);
            newDate.setDate(1);
            newDate = BX.Tasks.Date.add(newDate, BX.Tasks.Date.Unit.Month, 3 - (newDate.getUTCMonth() % 3));
        }

        return newDate;
    };

    Timeline.prototype.scrollToDate = function (date) {
        if (!BX.Tasks.Date.isDate(date) || date < this.startDate || date > this.endDate) {
            return;
        }

        var maxScrollLeft = this.getMaxScrollLeft();
        var dateOffset = this.getPixelsFromDate(date);
        this.setScrollLeft(dateOffset > maxScrollLeft ? maxScrollLeft : dateOffset);
    };

    Timeline.prototype.scrollTo = function (x) {
        this.setScrollLeft(Math.min(Math.max(0, x), this.getMaxScrollLeft()));
        this.renderHeader();
    };

    Timeline.prototype.getScrollLeft = function () {
        return this.chart.layout.timeline.scrollLeft;
    };

    Timeline.prototype.setScrollLeft = function (offset) {
        this.chart.layout.timeline.scrollLeft = offset;
    };

    Timeline.prototype.getMaxScrollLeft = function () {
        var scrollWidth = this.getPixelsFromDate(this.endDate);
        var viewport = this.getViewportWidth();
        return scrollWidth - viewport;
    };

    Timeline.prototype.autoScroll = function () {
        var viewport = this.getViewportWidth();
        var currentDateInPixels = this.getPixelsFromDate(BX.Tasks.Date.floorDate(this.chart.currentDatetime, this.snapUnit, this.firstWeekDay));
        this.scrollToDate(this.getDateFromPixels(currentDateInPixels - viewport / 4));
    };

    Timeline.prototype.getViewportWidth = function () {
        return this.chart.chartContainer.width - this.chart.gutterOffset;
    };

    Timeline.prototype.getRelativeXY = function (event) {
        BX.fixEventPageXY(event);

        return {
            x: event.pageX - this.chart.chartContainer.pos.left - this.chart.gutterOffset + this.getScrollLeft(),
            y: event.pageY - this.chart.chartContainer.pos.top + this.chart.layout.timeline.scrollTop
        };
    };
    //endregion
    //region GanttDependency
    /**
     *
     * @param {BX.IthiveGanttChart} chart
     * @param {String} id
     * @param {Number} from
     * @param {Number} to
     * @param {GanttDependency.Type} type
     * @constructor
     */
    var GanttDependency = function (chart, id, from, to, type) {
        this.chart = chart;
        this.id = id;
        this.from = from;
        this.to = to;
        this.type = typeof (type) !== "undefined" ? type : GanttDependency.Type.EndToStart;
        this.layout = null;

        this.fromTask = this.chart.getTaskById(this.from);
        this.toTask = this.chart.getTaskById(this.to);
        this.matchWorkTime = this.toTask.matchWorkTime;

        this.updateLag();
    };

    GanttDependency.prototype.updateLag = function () {
        if (this.type === GanttDependency.Type.StartToStart) {
            if (this.matchWorkTime) {
                this.lag = this.chart.calendar.calculateDuration(this.fromTask.dateStart, this.toTask.dateStart);
            } else {
                this.lag = this.toTask.dateStart - this.fromTask.dateStart;
            }
        } else if (this.type === GanttDependency.Type.StartToEnd) {
            if (this.matchWorkTime) {
                this.lag = this.chart.calendar.calculateDuration(this.fromTask.dateStart, this.toTask.dateEnd);
            } else {
                this.lag = this.toTask.dateEnd - this.fromTask.dateStart;
            }
        } else if (this.type === GanttDependency.Type.EndToEnd) {
            if (this.matchWorkTime) {
                this.lag = this.chart.calendar.calculateDuration(this.fromTask.dateEnd, this.toTask.dateEnd);
            } else {
                this.lag = this.toTask.dateEnd - this.fromTask.dateEnd;
            }
        } else {
            if (this.matchWorkTime) {
                this.lag = this.chart.calendar.calculateDuration(this.fromTask.dateEnd, this.toTask.dateStart);
            } else {
                this.lag = this.toTask.dateStart - this.fromTask.dateEnd;
            }
        }
    };

    GanttDependency.Type = {
        StartToStart: 0,
        StartToEnd: 1,
        EndToStart: 2,
        EndToEnd: 3
    };

    GanttDependency.prototype.draw = function () {
        var lines = this.getPath();
        if (!lines.length) {
            return;
        }

        if (this.fromTask.isHidden() || this.toTask.isHidden()) {
            if (this.layout !== null) {
                BX.cleanNode(this.layout, true);
                this.layout = null;
            }

            return;
        }

        var divs = document.createDocumentFragment();
        var line = null;
        for (var i = 0, length = lines.length; i < length; i++) {
            line = lines[i];

            var div = document.createElement("div");
            div.className = "task-gantt-link-line";
            div.style.left = line.x + "px";
            div.style.top = line.y + "px";

            if (line.direction === "left") {
                div.style.left = (line.x - line.size) + "px";
                div.style.width = line.size + "px";
                div.style.height = "2px";
            } else if (line.direction === "right") {
                div.style.width = line.size + "px";
                div.style.height = "2px";
            } else if (line.direction === "up") {
                div.style.top = (line.y - line.size) + "px";
                div.style.height = line.size + "px";
                div.style.width = "2px";
            } else {
                div.style.height = line.size + "px";
                div.style.width = "2px";
            }

            divs.appendChild(div);
        }

        var arrow = document.createElement("div");
        if (line.direction === "right") {
            arrow.style.left = line.x + line.size - 6 + "px";
            arrow.style.top = line.y - 5 + "px";
            arrow.className = "task-gantt-link-arrow task-gantt-link-arrow-right";
        } else {
            arrow.style.left = line.x - line.size - 6 + "px";
            arrow.style.top = line.y - 5 + "px";
            arrow.className = "task-gantt-link-arrow task-gantt-link-arrow-left";
        }

        divs.appendChild(arrow);

        if (this.layout === null) {
            var readOnly = !this.chart.canAddDependency(this.fromTask.id, this.toTask.id);

            this.layout = document.createElement("div");
            this.layout.className = "task-gantt-link" + (readOnly ? " task-gantt-link-read-only" : "");

            if (!readOnly) {
                BX.bind(this.layout, "click", BX.proxy(this.onMenuClick, this));
            }

            this.chart.layout.timelineData.appendChild(this.layout);
        } else {
            if (!this.layout.parentNode) {
                this.chart.layout.timelineData.appendChild(this.layout);
            }

            BX.cleanNode(this.layout, false);
        }

        this.layout.appendChild(divs);
    };

    GanttDependency.prototype.clear = function () {
        if (this.layout !== null) {
            BX.cleanNode(this.layout, true);
            this.layout = null;
        }
    };

    GanttDependency.prototype.getPath = function () {
        var edges = this.getEdges();

        var tail = 20;
        var rowHeight = 32;

        var deltaX = edges.endX - edges.startX;
        var deltaY = Math.abs(edges.endY - edges.startY);

        var forward = edges.endX > edges.startX;
        var verticalDirection = edges.endY > edges.startY ? "down" : "up";

        var path = new DependencyPath(edges.startX, edges.startY);

        if (this.type == GanttDependency.Type.StartToStart) {
            path.addPoint("left", tail);
            if (forward) {
                path.addPoint(verticalDirection, deltaY);
                path.addPoint("right", deltaX);
            } else {
                path.addPoint("left", Math.abs(deltaX));
                path.addPoint(verticalDirection, deltaY);
            }

            path.addPoint("right", tail);
        } else if (this.type == GanttDependency.Type.StartToEnd) {
            forward = (edges.endX > (edges.startX - 2 * tail));
            path.addPoint("left", tail);
            if (forward) {
                deltaX += 2 * tail;
                path.addPoint(verticalDirection, rowHeight / 2);
                path.addPoint("right", deltaX);
                path.addPoint(verticalDirection, deltaY - (rowHeight / 2));
                path.addPoint("left", tail);
            } else {
                deltaX += tail;
                path.addPoint(verticalDirection, deltaY);
                path.addPoint("left", Math.abs(deltaX));
            }
        } else if (this.type == GanttDependency.Type.EndToStart) {
            forward = (edges.endX > (edges.startX + 2 * tail));
            path.addPoint("right", tail);
            if (forward) {
                path.addPoint(verticalDirection, deltaY);
                path.addPoint("right", deltaX - tail);
            } else {
                deltaX -= 2 * tail;

                path.addPoint(verticalDirection, rowHeight / 2);
                path.addPoint("left", Math.abs(deltaX));
                path.addPoint(verticalDirection, deltaY - (rowHeight / 2));
                path.addPoint("right", tail);
            }
        } else if (this.type == GanttDependency.Type.EndToEnd) {
            path.addPoint("right", tail);
            if (forward) {
                path.addPoint("right", deltaX);
                path.addPoint(verticalDirection, deltaY);
            } else {
                path.addPoint(verticalDirection, deltaY);
                path.addPoint("left", Math.abs(deltaX));
            }

            path.addPoint("left", tail);
        }

        return path.getPath();
    };

    GanttDependency.prototype.getEdges = function () {
        var from = this.fromTask.getCoords();
        var to = this.toTask.getCoords();

        if (this.type === GanttDependency.Type.StartToStart) {
            return {
                startX: from.startX,
                startY: from.startY,
                endX: to.startX,
                endY: to.startY
            };
        } else if (this.type === GanttDependency.Type.StartToEnd) {
            return {
                startX: from.startX,
                startY: from.startY,
                endX: to.endX,
                endY: to.endY
            };
        } else if (this.type === GanttDependency.Type.EndToEnd) {
            return {
                startX: from.endX,
                startY: from.endY,
                endX: to.endX,
                endY: to.endY
            };
        } else {
            return {
                startX: from.endX,
                startY: from.endY,
                endX: to.startX,
                endY: to.startY
            };
        }
    };

    GanttDependency.prototype.getMinDate = function () {
        var startDate = null;
        var duration = this.toTask.calculateDuration();

        if (this.type === GanttDependency.Type.StartToStart) {
            startDate = this.fromTask.dateStart;
        } else if (this.type === GanttDependency.Type.StartToEnd) {
            if (this.matchWorkTime) {
                startDate = this.chart.calendar.calculateStartDate(this.fromTask.dateStart, duration);
            } else {
                startDate = BX.Tasks.Date.add(this.fromTask.dateStart, BX.Tasks.Date.Unit.Milli, -duration);
            }

        } else if (this.type === GanttDependency.Type.EndToEnd) {
            if (this.matchWorkTime) {
                startDate = this.chart.calendar.calculateStartDate(this.fromTask.dateEnd, duration);
            } else {
                startDate = BX.Tasks.Date.add(this.fromTask.dateEnd, BX.Tasks.Date.Unit.Milli, -duration);
            }
        } else {
            startDate = this.fromTask.dateEnd;
        }

        if (this.matchWorkTime) {
            return this.lag > 0 ?
                this.chart.calendar.calculateEndDate(startDate, this.lag) :
                this.chart.calendar.calculateStartDate(startDate, Math.abs(this.lag));
        } else {
            return BX.Tasks.Date.add(startDate, BX.Tasks.Date.Unit.Milli, this.lag);
        }
    };

    GanttDependency.prototype.onMenuClick = function (event) {
        // noinspection JSAnnotator
        BX.PopupMenu.show("task-dep-menu", event,
            [{
                text: BX.message("TASKS_GANTT_DELETE_DEPENDENCY"),
                title: BX.message("TASKS_GANTT_DELETE_DEPENDENCY"),
                className: "menu-popup-item-delete",
                onclick: BX.proxy(function () {
                    this.chart.removeDependency(this);
                    BX.onCustomEvent(this.chart, "onDependencyDelete", [this]);
                    BX.PopupMenu.destroy("task-dep-menu");
                }, this)
            }],
            {
                offsetTop: 5,
                offsetLeft: 0,
                angle: true,
                autoHide: true,
                closeByEsc: true,

                bindOptions: {forceBindPosition: true},
                events: {onPopupClose: BX.proxy(this.onMenuClose, this)}
            }
        );
        BX.addClass(this.layout, "task-gantt-link-selected");
    };

    GanttDependency.prototype.onMenuClose = function (popupWindow, event) {
        BX.removeClass(this.layout, "task-gantt-link-selected");
        BX.PopupMenu.destroy("task-dep-menu");
    };
    //endregion
    //region DependencyPointer
    /**
     *
     * @param {BX.IthiveGanttChart} chart
     * @constructor
     */
    function DependencyPointer(chart) {
        this.chart = chart;
        this.layout = BX.create("div", {props: {className: "task-gantt-pointer"}});

        /**
         * @var {GanttTask}
         */
        this.fromTask = null;
        this.fromStart = null;

        /**
         * @var {GanttTask}
         */
        this.toTask = null;
        this.toStart = null;
        this.edges = null;
        this.error = null;

        this.startX = 0;
        this.startY = 0;

        this.popup = new DependencyPopup(this);
    }

    DependencyPointer.prototype.getLayout = function () {
        return this.layout;
    };

    DependencyPointer.prototype.getTimeline = function (params) {
        return this.chart.getTimeline();
    };

    DependencyPointer.prototype.startDrag = function (fromTask, fromStart, event) {
        event = event || window.event;
        BX.fixEventPageXY(event);
        if (!BX.IthiveGanttChart.isLeftClick(event)) {
            return;
        }

        this.chart.adjustChartContainer();

        this.fromTask = fromTask;
        this.fromStart = fromStart;
        this.toTask = null;
        this.toStart = null;
        this.edges = this.fromTask.getCoords();

        this.startX = this.fromStart ? this.edges.startX - 9 : this.edges.endX + (this.fromTask.isRealDateEnd ? 8 : 12);
        this.startY = (this.fromStart ? this.edges.startY : this.edges.endY) + this.chart.getTimelineDataOffset();

        this.fromTask.startResize(event, BX.proxy(this.endDrag, this), BX.proxy(this.onDrag, this), "default");
    };

    DependencyPointer.prototype.onDrag = function (event) {
        this.markDraggableTask();
        this.fromTask.autoResize(event, BX.proxy(this.resizePointer, this));
        this.popup.move(event);
    };

    DependencyPointer.prototype.endDrag = function (event) {
        this.hidePointerLine();
        this.unmarkDraggableTask();
        this.unmarkDroppableTask();
        this.popup.hide();

        this.fromTask.endResize(event, BX.proxy(this.endDrag, this), BX.proxy(this.onDrag, this));

        if (this.toTask) {
            this.fromTask.setRealDates();
            this.toTask.setRealDates();

            var dependency = this.chart.addDependency(this.fromTask.id, this.toTask.id, this.getType());
            BX.onCustomEvent(this.chart, "onDependencyAdd", [dependency]);
        }
    };

    DependencyPointer.prototype.getType = function () {
        if (this.fromStart === false && this.toStart === true) {
            return GanttDependency.Type.EndToStart;
        } else if (this.fromStart === true && this.toStart === true) {
            return GanttDependency.Type.StartToStart;
        } else if (this.fromStart === false && this.toStart === false) {
            return GanttDependency.Type.EndToEnd;
        } else if (this.fromStart === true && this.toStart === false) {
            return GanttDependency.Type.StartToEnd;
        } else {
            return GanttDependency.Type.EndToStart;
        }
    };

    DependencyPointer.prototype.resizePointer = function (offsetX, offsetY) {
        this.markDroppableTask();

        var point = this.getTimeline().getRelativeXY(this.fromTask.autoResizeEvent);
        this.drawPointerLine(this.startX, this.startY, point.x, point.y);
    };

    DependencyPointer.prototype.offsetLine = function (offset) {
        this.startX += offset;
        this.layout.style.left = (parseInt(this.layout.style.left) || 0) + offset + "px";
    };

    DependencyPointer.prototype.markDraggableTask = function () {
        BX.addClass(
            this.fromTask.layout.planBar,
            "task-gantt-bar-plan-draggable task-gantt-pointer-" + (this.fromStart ? "start" : "end")
        );
    };

    DependencyPointer.prototype.unmarkDraggableTask = function () {
        BX.removeClass(
            this.fromTask.layout.planBar,
            "task-gantt-bar-plan-draggable task-gantt-pointer-" + (this.fromStart ? "start" : "end")
        );
    };

    DependencyPointer.prototype.markDroppableTask = function () {
        this.error = null;

        this.layout.hidden = true;

        var droppableBar = null;
        var droppablePoint = null;
        var element = document.elementFromPoint(this.fromTask.autoResizeEvent.clientX, this.fromTask.autoResizeEvent.clientY);
        if (!element) {
            droppablePoint = null;
            droppableBar = null;
        } else if (BX.hasClass(element, "task-gantt-bar-plan")) {
            droppablePoint = null;
            droppableBar = element;
        } else if (BX.hasClass(element.parentNode, "task-gantt-bar-plan")) {
            droppablePoint = element;
            droppableBar = element.parentNode;
        } else if (BX.hasClass(element.parentNode.parentNode, "task-gantt-bar-plan")) {
            droppablePoint = element.parentNode;
            droppableBar = element.parentNode.parentNode;
        }

        if (droppableBar) {
            if (this.droppable) {
                BX.removeClass(this.droppable, "task-gantt-bar-plan-droppable");
            }

            this.droppable = droppableBar;
            var droppableTask = this.chart.getTaskById(this.droppable.getAttribute("data-task-id"));

            if (!droppableTask || droppableTask === this.fromTask) {
                this.droppable = null;
                this.toTask = null;
                this.toStart = null;
            } else if (this.chart.isCircularDependency(this.fromTask.id, droppableTask.id)) {
                this.toTask = null;
                this.toStart = null;
                // noinspection JSAnnotator
                this.error = BX.message("TASKS_GANTT_CIRCULAR_DEPENDENCY");
            } else if (!this.chart.canAddDependency(this.fromTask.id, droppableTask.id)) {
                this.toTask = null;
                this.toStart = null;
                // noinspection JSAnnotator
                this.error = BX.message("TASKS_GANTT_PERMISSION_ERROR");
            } else if (droppablePoint !== null && BX.hasClass(droppablePoint, "task-gantt-point-start")) {
                BX.addClass(this.droppable, "task-gantt-pointer-start");
                this.toTask = droppableTask;
                this.toStart = true;
            } else if (droppablePoint !== null && BX.hasClass(droppablePoint, "task-gantt-point-end")) {
                BX.addClass(this.droppable, "task-gantt-pointer-end");
                this.toTask = droppableTask;
                this.toStart = false;
            } else {
                BX.removeClass(this.droppable, "task-gantt-pointer-start task-gantt-pointer-end");
                this.toTask = null;
                this.toStart = null;
            }

            if (this.droppable) {
                BX.addClass(this.droppable, "task-gantt-bar-plan-droppable");
            }
        } else if (this.droppable) {
            BX.removeClass(this.droppable, "task-gantt-bar-plan-droppable task-gantt-pointer-start task-gantt-pointer-end");
            this.droppable = null;
            this.toTask = null;
            this.toStart = null;
            this.error = null;
        }

        this.layout.hidden = false;
    };

    DependencyPointer.prototype.unmarkDroppableTask = function () {
        if (this.droppable) {
            BX.removeClass(this.droppable, "task-gantt-bar-plan-droppable task-gantt-pointer-start task-gantt-pointer-end");
            this.droppable = null;
        }
    };

    DependencyPointer.prototype.drawPointerLine = function (startX, startY, endX, endY) {
        var width = Math.sqrt((Math.pow(endX - startX, 2)) + (Math.pow(endY - startY, 2))); //http://www.purplemath.com/modules/distform.htm
        var angle = Math.atan((endY - startY) / (endX - startX));
        var quarter = this.getQuarter(startX, endX, startY, endY);
        if (quarter === 2) {
            angle += Math.PI;
        } else if (quarter === 3) {
            angle -= Math.PI;
        }

        var rotate = "rotate(" + angle + "rad)";
        this.layout.style.webkitTransform = rotate;
        this.layout.style.msTransform = rotate;
        this.layout.style.transform = rotate;
        this.layout.style.width = width + "px";

        var left = startX;
        var top = startY;

        if (BX.browser.IsIE8()) {
            var sin = Math.sin(angle);
            var cos = Math.cos(angle);

            this.layout.style.filter =
                "progid:DXImageTransform.Microsoft.Matrix(" +
                "M11 = " + cos + "," +
                "M12 = -" + sin + "," +
                "M21 = " + sin + "," +
                "M22 = " + cos + "," +
                "SizingMethod = 'auto expand')";

            var shiftLeft = Math.abs(startX - endX);
            var shiftTop = Math.abs(endY - startY);

            if (quarter === 1) {
                top -= shiftTop;
            } else if (quarter === 2) {
                left -= shiftLeft;
                top -= shiftTop;
            } else if (quarter === 3) {
                left -= shiftLeft;
            }
        }

        this.layout.style.left = left + "px";
        this.layout.style.top = top + "px";
    };

    DependencyPointer.prototype.getQuarter = function (startX, endX, startY, endY) {
        if (endX >= startX) {
            return endY <= startY ? 1 : 4;
        } else {
            return endY <= startY ? 2 : 3;
        }
    };

    DependencyPointer.prototype.hidePointerLine = function () {
        this.layout.style.cssText = "";
    };
    //endregion
    //region  DependencyPath + DependencyPopup
    function DependencyPath(startX, startY) {
        this.currentPoint = {x: startX, y: startY};
        this.prevDirection = null;
        this.path = [];
    }

    DependencyPath.prototype.addPoint = function (direction, offset) {
        var point = {
            x: this.currentPoint.x,
            y: this.currentPoint.y,
            direction: direction,
            size: offset
        };

        if (direction === "up") {
            if (this.prevDirection === "right") {
                point.y += 2;
                point.size += 2;
            }

            this.currentPoint.y -= offset;
        } else if (direction === "right") {
            if (this.prevDirection === "up") {
                point.x += 2;
                point.size -= 2;
            }

            this.currentPoint.x += offset;
        } else if (direction === "down") {
            if (this.prevDirection === "left") {
                point.y += 2;
                point.size -= 2;
            }

            this.currentPoint.y += offset;
        } else if (direction === "left") {
            if (this.prevDirection === "down") {
                point.x += 2;
                point.size += 2;
            }

            this.currentPoint.x -= offset;
        }

        this.prevDirection = direction;
        this.path.push(point);
    };

    DependencyPath.prototype.getPath = function () {
        return this.path;
    };

    function DependencyPopup(pointer) {
        this.pointer = pointer;
        this.layout = {
            fromTitle: null,
            fromEdge: null,
            toTitle: null,
            toEdge: null,
            error: null
        };

        // noinspection JSAnnotator
        this.popup = BX.PopupWindowManager.create("task-gantt-pointer", null, {
            offsetLeft: 5,
            offsetTop: 30,
            content: BX.create("div", {
                props: {className: "task-gantt-pointer-popup"}, children: [
                    BX.create("div", {
                        props: {className: "task-gantt-pointer-popup-row task-gantt-pointer-popup-from"}, children: [
                            BX.create("span", {
                                props: {className: "task-gantt-pointer-popup-label"},
                                text: BX.message("TASKS_GANTT_DEPENDENCY_FROM") + ":"
                            }),
                            (this.layout.fromTitle = BX.create("span", {props: {className: "task-gantt-pointer-popup-title"}})),
                            (this.layout.fromEdge = BX.create("span", {props: {className: "task-gantt-pointer-popup-edge"}}))
                        ]
                    }),
                    BX.create("div", {
                        props: {className: "task-gantt-pointer-popup-row task-gantt-pointer-popup-to"}, children: [
                            BX.create("span", {
                                props: {className: "task-gantt-pointer-popup-label"},
                                text: BX.message("TASKS_GANTT_DEPENDENCY_TO") + ":"
                            }),
                            (this.layout.toTitle = BX.create("span", {props: {className: "task-gantt-pointer-popup-title"}})),
                            (this.layout.toEdge = BX.create("span", {props: {className: "task-gantt-pointer-popup-edge"}}))
                        ]
                    }),
                    (this.layout.error = BX.create("div", {props: {className: "task-gantt-pointer-popup-row task-gantt-pointer-popup-error"}}))
                ]
            })
        });
    };

    DependencyPopup.prototype.move = function (bindElement) {
        this.layout.fromTitle.innerHTML = this.pointer.fromTask.name;
        // noinspection JSAnnotator
        this.layout.fromEdge.innerHTML = "(" + (this.pointer.fromStart ? BX.message("TASKS_GANTT_START") : BX.message("TASKS_GANTT_END")) + ")";

        if (this.pointer.error) {
            this.layout.error.innerHTML = this.pointer.error;
            this.layout.toTitle.parentNode.style.display = "none";
        } else {
            this.layout.error.innerHTML = "";
            this.layout.toTitle.parentNode.style.display = "block";
            this.layout.toTitle.innerHTML = this.pointer.toTask ? this.pointer.toTask.name : "";
            // noinspection JSAnnotator
            this.layout.toEdge.innerHTML = (this.pointer.toTask ? "(" + (this.pointer.toStart ? BX.message("TASKS_GANTT_START") : BX.message("TASKS_GANTT_END")) + ")" : "&mdash;");
        }

        this.popup.setBindElement(bindElement);
        this.popup.adjustPosition();
        this.popup.show();
    };

    DependencyPopup.prototype.hide = function () {
        this.popup.close();
    };
    //endregion
    //region GanttTooltip
    /**
     *
     * @param {BX.IthiveGanttChart} chart
     * @constructor
     */
    var GanttTooltip = function (chart) {
        this.chart = chart;
        this.initTop = false;
        this.window = null;
        this.start = null;
        this.end = null;
        this.deadline = null;
        this.windowSize = 0;

        var initDate = this.formatDate(this.chart.currentDatetime);

        // noinspection JSAnnotator
        (this.window = BX.create("div", {
            props: {className: "task-gantt-hint"}, children: [
                BX.create("span", {
                    props: {className: "task-gantt-hint-names"}, children: [
                        BX.create("span", {
                            props: {className: "task-gantt-hint-name"},
                            text: BX.message("TASKS_GANTT_DATE_START") + ":"
                        }),
                        BX.create("span", {
                            props: {className: "task-gantt-hint-name"},
                            text: BX.message("TASKS_GANTT_DATE_END") + ":"
                        }),
                        BX.create("span", {
                            props: {className: "task-gantt-hint-name"},
                            text: BX.message("TASKS_GANTT_DEADLINE") + ":"
                        })
                    ]
                }),
                BX.create("span", {
                    props: {className: "task-gantt-hint-values"}, children: [
                        (this.start = BX.create("span", {props: {className: "task-gantt-hint-value"}, html: initDate})),
                        (this.end = BX.create("span", {props: {className: "task-gantt-hint-value"}, html: initDate})),
                        (this.deadline = BX.create("span", {
                            props: {className: "task-gantt-hint-value"},
                            html: initDate
                        }))
                    ]
                })
            ]
        }));
    };

    GanttTooltip.prototype.getLayout = function () {
        return this.window;
    };

    GanttTooltip.prototype.getTimeline = function (params) {
        return this.chart.getTimeline();
    };

    GanttTooltip.prototype.init = function (task) {
        this.window.style.top = task.layout.row.offsetTop + 9 + "px";
        this.initTop = true;
        this.windowSize = this.window.offsetWidth;
    };

    GanttTooltip.prototype.show = function (resizerOffset, task) {
        if (!this.initTop)
            this.init(task);

        var dateStart = task.isRealDateStart ? task.dateStart : null;
        var dateEnd = task.isRealDateEnd ? task.dateEnd : null;

        this.start.innerHTML = this.formatDate(dateStart);
        this.end.innerHTML = this.formatDate(dateEnd);
        this.deadline.innerHTML = this.formatDate(task.dateDeadline);

        var maxOffset = this.chart.chartContainer.width - this.chart.chartContainer.padding - this.chart.gutterOffset + this.getTimeline().getScrollLeft();
        var minOffset = this.chart.chartContainer.padding + this.getTimeline().getScrollLeft();

        if ((resizerOffset + this.windowSize / 2) >= maxOffset)
            this.window.style.left = maxOffset - this.windowSize + "px";
        else if ((resizerOffset - this.windowSize / 2) <= minOffset)
            this.window.style.left = minOffset + "px";
        else if (resizerOffset >= maxOffset)
            this.window.style.left = resizerOffset - this.windowSize + "px";
        else
            this.window.style.left = resizerOffset - this.windowSize / 2 + "px";
    };

    GanttTooltip.prototype.formatDate = function (date) {
        if (!date) { // noinspection JSAnnotator
            return BX.message("TASKS_GANTT_EMPTY_DATE");
        }

        var format = this.chart.dateFormat
            .replace(/YYYY/ig, "<span class=\"task-gantt-hint-year\">" + date.getUTCFullYear().toString().substr(2) + "</span>")
            .replace(/MMMM/ig, BX.util.str_pad_left((date.getUTCMonth() + 1).toString(), 2, "0"))
            .replace(/MM/ig, BX.util.str_pad_left((date.getUTCMonth() + 1).toString(), 2, "0"))
            .replace(/M/ig, BX.util.str_pad_left((date.getUTCMonth() + 1).toString(), 2, "0"))
            .replace(/DD/ig, BX.util.str_pad_left(date.getUTCDate().toString(), 2, "0"));

        var hours = date.getUTCHours().toString();
        if (BX.isAmPmMode()) {
            var amPm = ' am';
            if (hours > 12) {
                hours = hours - 12;
                amPm = ' pm';
            } else if (hours == 12) {
                amPm = ' pm';
            }
        }

        return format + " " + BX.util.str_pad_left(hours, 2, "0") + ":" + BX.util.str_pad_left(date.getUTCMinutes().toString(), 2, "0") + (amPm != undefined ? amPm : '');
    };

    GanttTooltip.prototype.hide = function () {
        this.window.style.left = "-400px";
        this.initTop = false;
    };
    //endregion

})();
