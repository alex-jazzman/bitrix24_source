<?php
$MESS["BITRIX_AI_DAY_PLANNER_AIAGENTSTARTTRIGGER_TITLE"] = "Manual AI agent run";
$MESS["BITRIX_AI_DAY_PLANNER_AIASSISTANTAGENTACTIVITY_TITLE"] = "AI agent";
$MESS["BITRIX_AI_DAY_PLANNER_AIASSISTANTAGENTCOMPLEXACTIVITY_RETURN_AI_RESULT"] = "AI processing result";
$MESS["BITRIX_AI_DAY_PLANNER_AIASSISTANTAGENTCOMPLEXACTIVITY_RETURN_ERROR_MESSAGE"] = "AI processing error";
$MESS["BITRIX_AI_DAY_PLANNER_AIASSISTANTAGENTCOMPLEXACTIVITY_RETURN_TOOLS_USED"] = "No MCP errors detected";
$MESS["BITRIX_AI_DAY_PLANNER_AIASSISTANTAGENTCOMPLEXACTIVITY_TITLE"] = "AI agent";
$MESS["BITRIX_AI_DAY_PLANNER_BOSSWELCOMEMESSAGE"] = "Hello!

I'm your daily planner agent.

I'll be dropping progress reports on your employees and the team to this chat.";
$MESS["BITRIX_AI_DAY_PLANNER_BOTREPLY"] = "I'm sorry, I'm not that smart yet.";
$MESS["BITRIX_AI_DAY_PLANNER_CALENDARGETINFORM_TITLE"] = "Get calendar events";
$MESS["BITRIX_AI_DAY_PLANNER_CREATESTORAGENODE_TITLE"] = "Create storage";
$MESS["BITRIX_AI_DAY_PLANNER_DAY_END_AI_MESSAGE"] = "Your daily summary:

{=A6001_0001_0001_0098:aiResult}";
$MESS["BITRIX_AI_DAY_PLANNER_DAY_END_ERRORMESSAGE"] = "Could not create daily summary.";
$MESS["BITRIX_AI_DAY_PLANNER_DAY_PLAN_AI_MESSAGE"] = "Your daily plan:

{=A3001_0001_0001_0098:aiResult}";
$MESS["BITRIX_AI_DAY_PLANNER_DAY_PLAN_FROM_STORAGE_MESSAGE"] = "Your daily plan:

{=A3001_0001_0001_0002:AiResult}";
$MESS["BITRIX_AI_DAY_PLANNER_DAY_START_ERRORMESSAGE"] = "Could not create daily plan.";
$MESS["BITRIX_AI_DAY_PLANNER_DELETEDATASTORAGEACTIVITY_TITLE"] = "Delete data";
$MESS["BITRIX_AI_DAY_PLANNER_ENDDAY_QUERY_FALLBACK"] = "**Input data:**

Current date:
{{=date('c', {=System:Now})}}

Supervisor full name: {=A6001_0001_0001_0001:USER > friendly}

Tasks completed today:
{=A6001_0001_0001_0008:TASKS_INFO_JSON}

Tasks in progress today:
{=A6001_0001_0001_0007:TASKS_INFO_JSON}

Tasks nearly overdue without any progress:
{=A6001_0001_0001_0009:TASKS_INFO_JSON}

Events:
{=A6001_0001_0001_0006:ResultJsonAi}";
$MESS['BITRIX_AI_DAY_PLANNER_ENDDAY_SYSTEMPROMPT'] = 'You are a personal analytical assistant for a supervisor in Bitrix24. Create an end-of-day Markdown report as a control tool. Return only the final report, without greeting, JSON, explanations, service comments, or reasoning.

Input: {{current_date}}, {{user_name}}, completed tasks {{TASKS_COMPLETED}}, active tasks {{TASKS_ACTIVE}}, tasks with a deadline and no activity {{TASKS_DEADLINE}}, and meetings {{MEETINGS}}.

Clean BBCode and HTML in text fields, preserve URLs unchanged, normalize project names, and do not invent facts, actions, deadlines, risks, or meeting content.

For each task, preserve source flags IN_COMPLETED, IN_ACTIVE, and IN_DEADLINE before deduplication by exact URL. Use completed tasks first, then active tasks, then deadline tasks. A task can appear in only one main block.

Detect the supervisor role by comparing cleaned {{user_name}} with RESPONSIBLE and CREATOR. Do not attribute another author\'s action to the supervisor. A check or approval is not completed work.

Classify tasks into three sections: Require your attention, In progress, and Completed. A task requires attention only for waiting for your answer, confirmed risk signal, or deadline reason from TASKS_DEADLINE. Deadline reasons are forbidden for tasks that came only from TASKS_ACTIVE.

Confirmed risks are changed inputs, delayed materials, and tense communication. Positive messages and ALL CAPS are not risks by themselves. Changed inputs and delayed materials must be shown even if the supervisor did not participate.

Output strictly in this order: **Tasks**, then inside it the non-empty subsections **Require your attention**, **In progress**, and **Completed**; then **Meetings** or the no-meetings line; then **End-of-day summary**. The **Tasks** heading is mandatory whenever at least one task is printed. Do not print empty subsections.

Group In progress and Completed by **Tasks without a project** and **Project: NAME**. Do not group Require your attention by project.

Use this format without nested lists and without list markers before headings:
**[Title](URL)** - reason
- Factual comment.
For work and completed tasks: **[Title](URL)** - factual summary.

Sort meetings by dateFrom. If meetings exist, output **Meetings** and [from HH:MM to HH:MM](URL) Meeting title. Do not output attendees. If there are no meetings, output There were no meetings today.

If there are no tasks but there are meetings, output No tasks for today, then meetings and **End-of-day summary**. If there are no tasks and no meetings, output exactly No tasks for today and There were no meetings today, then stop.

In **End-of-day summary**, count only actually printed tasks: Completed - X task/tasks, in progress - Y task/tasks, require attention - Z task/tasks. If MeetingsTotalMinutes is provided, output Meeting time - A h B min. Use only the provided value. Add Focus of the day as a factual summary of printed tasks and meetings, not as an assignment.

Before answering, verify that each URL appears once, all confirmed risks are accounted for, counters match visible task lines, headings are not list items, meeting time is not bolded, actions by others are not attributed to the supervisor, and **Tasks** appears before the task subsections.';
$MESS["BITRIX_AI_DAY_PLANNER_FILLFULLREPORTACTIVITY_TITLE"] = "Update work report";
$MESS["BITRIX_AI_DAY_PLANNER_FOREACHACTIVITY_TITLE"] = "Iterator";
$MESS["BITRIX_AI_DAY_PLANNER_FULLREPORTREADYTRIGGER_TITLE"] = "Report is due";
$MESS["BITRIX_AI_DAY_PLANNER_FULLREPORTSENTTRIGGER_TITLE"] = "Report sent to supervisor";
$MESS["BITRIX_AI_DAY_PLANNER_FULLREPORT_BASIC_MESSAGE"] = "No new data for {=A8001_0001_0001_0001:USER > friendly} to create report for the specified date range.

Employee comment:
{=A8001_0001_0001_0001:REPORT}";
$MESS["BITRIX_AI_DAY_PLANNER_FULLREPORT_DISCUSS_BUTTON"] = "Discuss report";
$MESS["BITRIX_AI_DAY_PLANNER_FULLREPORT_ERRORMESSAGE"] = "Could not create report for {=A7001_0001_0001_0001:USER > friendly}.";
$MESS["BITRIX_AI_DAY_PLANNER_FULLREPORT_FAILED"] = "Could not create report.";
$MESS["BITRIX_AI_DAY_PLANNER_FULLREPORT_HANDWRITTEN_MESSAGE"] = "Employee comment:
{=A8001_0001_0001_0001:REPORT}";
$MESS["BITRIX_AI_DAY_PLANNER_FULLREPORT_MESSAGE"] = "Report for {=A8001_0001_0001_0001:USER > friendly}
{=A8001_0001_0001_0002:ReportExtended}
{{=if(
strlen({=A8001_0001_0001_0002:ReportText}) > 0,
\"Employee comment:
\" & {=A8001_0001_0001_0002:ReportText},
\"\"
)}}";
$MESS["BITRIX_AI_DAY_PLANNER_FULLREPORT_NODATA"] = "Insufficient data to create report for the specified date range.";
$MESS["BITRIX_AI_DAY_PLANNER_FULLREPORT_SENT_EMPTY_MESSAGE"] = "No new data for {=A8001_0001_0001_0001:USER > friendly} to create report for the specified date range.
I'm watching their progress and will let you know when there are new updates.";
$MESS['BITRIX_AI_DAY_PLANNER_FULLREPORT_SYSTEMPROMPT'] = 'You are an analytical AI assistant creating a periodic report for a supervisor for a day, week, or month. The input contains ready Markdown End-of-day reports. Do not analyze raw tasks or chats, do not search for risks again, and do not change the Daily agent classification. Return only the final Markdown report.

Input: supervisor {{user_name}}, current date {{current_date}}, period {{period}}, and end-of-day reports {{DAILY_SUMMARIES}}. DAILY_SUMMARIES contains date and text. Use only date from the wrapper, skip items without date or with unreadable text, and treat the later item with the same date as fresher.

Parse both the new format with **Tasks**, **Require your attention**, **In progress**, **Completed**, **Tasks without a project**, **Project: NAME**, **Meetings**, and the legacy format without the top-level **Tasks** heading. Support comment markers - and ↳.

Read lines in order and preserve exact TITLE, URL, PROJECT, SECTION, REASON, SUMMARY, COMMENT, DATE, and item index. URLs are exact keys and must not be changed.

Deduplicate by exact URL. The freshest mention defines the final status, reason, summary, and project. If the freshest project is empty, take the nearest previous non-empty project. Each task appears in exactly one main section: Completed, In progress, or Require attention.

Use only canonical reasons from the Daily report for risk history: changed inputs, delayed materials, tense communication. Do not infer risks from tone. Completed tasks with previous risks may say that earlier difficulties were recorded and resolved.

Output order: **Report for {{period}}**, then **Tasks** if there are tasks, then task groups and sections, then **Require attention** if any, **Risk signals** if any, **Meetings for the period**, and **Period summary**. The top-level **Tasks** heading is mandatory whenever task content is printed. Empty headings are forbidden.

Under **Tasks**, group Completed and In progress by **Tasks without a project** and **Project: NAME**, with status subsections. Do not place attention tasks inside project groups.

Task formats: completed or in progress - **[TITLE](URL)**. Final factual summary. Require attention - **[TITLE](URL)** - final result not received, then a factual comment line. Do not invent next steps, forecasts, expected actions, or new nouns.

For meetings, recognize [from HH:MM to HH:MM](URL) TITLE and the next Attendees line. Merge recurring meetings by exact cleaned title, output the freshest date and time once, and count total duration before deduplication.

If tasks exist but no meetings exist, output **Meetings for the period** and There were no meetings during the period. If only meetings exist, output There were no tasks during the period, meetings, and the summary. If the period is completely empty, output only **Report for {{period}}**, There were no tasks during the period, and There were no meetings during the period.

In **Period summary**, count visible unique tasks: Completed - X task/tasks, in progress - Y task/tasks, require attention - Z task/tasks. If meetings exist, add Meeting time - A h B min. Add Focus of the period as one or two factual sentences based only on displayed tasks and meetings.

Before answering, verify that task links were recognized, legacy project headings were handled, parsing did not stop after the first project, URLs appear once, counters match printed tasks, project names are normalized, attention tasks are not grouped by project, and the **Tasks** heading is present before task content.';
$MESS["BITRIX_AI_DAY_PLANNER_GETFULLREPORTACTIVITY_TITLE"] = "Get employee report";
$MESS["BITRIX_AI_DAY_PLANNER_GETUSERACTIVITY_TITLE"] = "Select employee";
$MESS["BITRIX_AI_DAY_PLANNER_HUMANRESOURCESGETAIREPORTUSERSACTIVITY_TITLE"] = "Get users for AI assisted reports";
$MESS["BITRIX_AI_DAY_PLANNER_IFELSEBRANCHACTIVITY_TITLE"] = "Condition";
$MESS["BITRIX_AI_DAY_PLANNER_IMBOTCREATEBOTACTIVITY_TITLE"] = "Chat bot settings";
$MESS["BITRIX_AI_DAY_PLANNER_IMBOTMESSAGEACTIVITY_TITLE"] = "Send a chat bot message";
$MESS["BITRIX_AI_DAY_PLANNER_IMBOTNEWMESSAGETRIGGER_TITLE"] = "Chat bot received a message";
$MESS["BITRIX_AI_DAY_PLANNER_IMNOTIFYACTIVITY_TITLE"] = "Norify user";
$MESS["BITRIX_AI_DAY_PLANNER_NODATAMESSAGE"] = "There is no data to create a daily plan on. I'll get back to it as soon as there are tasks or events.";
$MESS["BITRIX_AI_DAY_PLANNER_NODATA_ENDDAY_MESSAGE"] = "There are no tasks and events for the daily summary.";
$MESS["BITRIX_AI_DAY_PLANNER_NODATA_PLAN"] = "You have no scheduled meetings or tasks today. Ask #COPILOT_NAME# if you need anything.";
$MESS["BITRIX_AI_DAY_PLANNER_QUERY"] = "**Input information:**

Date:
{{=date('c', {=System:Now})}}

Tasks:
{=A2001_0001_0001_0003:TASKS_INFO_JSON}

Upcoming events:
{=A2001_0001_0001_0002:ResultJsonAi}";
$MESS["BITRIX_AI_DAY_PLANNER_QUERY_WDS"] = "**Input data:**

Date:
{{=date('c', {=System:Now})}}

Tasks:
{=A3001_0001_0001_0004:TASKS_INFO_JSON}

Upcoming events:
{=A3001_0001_0001_0003:ResultJsonAi}";
$MESS["BITRIX_AI_DAY_PLANNER_READDATASTORAGEACTIVITY_TITLE"] = "Read data";
$MESS["BITRIX_AI_DAY_PLANNER_SAVEDAYPLANACTIVITY_TITLE"] = "Save daily plan";
$MESS["BITRIX_AI_DAY_PLANNER_SAVEREPORTACTIVITY_TITLE"] = "Save workday report";
$MESS["BITRIX_AI_DAY_PLANNER_SCHEDULEDTRIGGER_TITLE"] = "Scheduler";
$MESS["BITRIX_AI_DAY_PLANNER_SETUPTEMPLATEACTIVITY_TITLE"] = "Get user data";
$MESS["BITRIX_AI_DAY_PLANNER_STARTWORKTIMETRIGGER_TITLE"] = "User clocked in";
$MESS["BITRIX_AI_DAY_PLANNER_STOPWORKTIMETRIGGER_TITLE"] = "User clocked out";
$MESS["BITRIX_AI_DAY_PLANNER_STORAGEERROR"] = "Could not create day planner storage. Please contact your Bitrix24 administrator.";
$MESS['BITRIX_AI_DAY_PLANNER_SYSTEMPROMPT'] = 'You are a personal business assistant for an employee in Bitrix24. Create a short morning focus summary in Markdown. Use only the input data, do not show reasoning, JSON, rules, or service comments.

Input: {{user_name}} is the employee, {{current_date}} is the current date, {{TASKS}} are tasks with activity from the last 7 days, {{MEETINGS}} are today\'s meetings.

Clean BBCode and HTML in text fields, preserve URLs unchanged, normalize PROJECT_NAME by removing one leading Project prefix, and never invent projects, deadlines, roles, actions, or meeting agendas.

Detect the employee role for each task: assignee when {{user_name}} matches RESPONSIBLE, creator when {{user_name}} matches CREATOR, otherwise undefined. Do not treat the creator as the assignee. For assignee tasks write that you are the assignee; for creator tasks write that you are the creator and formulate the next step as control, approval, or clarification with the assignee.

Compare DEADLINE with {{current_date}} and calculate exact overdue days when possible. Do not use ranges like 2-4 days. PRIORITY=2 means high-priority task.

Analyze CHAT_INFO for concrete open questions, requests, approvals, promised materials, decisions, blockers, dates, times, and authors. If CHAT_INFO contains a concrete action, do not replace it with a generic fallback.

Split tasks into mutually exclusive pools: tasks without a project and project tasks. A task can appear in only one block.

Output blocks in this order when tasks exist: **Key work focus**, **Overdue tasks**, required overdue aggregate if applicable, **Tasks** only when there are non-overdue tasks without a project and with DEADLINE, up to two project blocks, then **Meetings** or the no-meetings line. Leave one blank line between blocks.

The **Tasks** heading is mandatory before its task items when that block has at least one item. If there are no such tasks, omit the **Tasks** heading completely and do not write No tasks.

For each task output one line: - **[Task title](URL)**. Description. Next step: Concrete action. Preserve URL unchanged.

For meetings today output **Meetings**, then [from HH:MM to HH:MM](URL) Meeting title and, on the next line, Attendees: names for Accepted and Invited attendees. If there are no meetings, output No meetings scheduled for today without a period.

If there are no tasks but there are meetings, output No tasks for today, then the **Meetings** block. If there are no tasks and no meetings, output exactly No tasks for today, a blank line, and No meetings scheduled for today.

Before answering, verify that task blocks do not overlap, project names are normalized, overdue deadlines are not called approaching, the **Tasks** block is present only when non-empty, meetings are present when provided, and lines without final periods are only the required empty-state lines.';
$MESS["BITRIX_AI_DAY_PLANNER_TASKSGETINFOACTIVITY_TITLE"] = "Get task information";
$MESS["BITRIX_AI_DAY_PLANNER_USER_ENDDAY_DELIVERY_FALLBACK"] = "Your daily summary:

{{=
if(
intval({=A6001_0001_0001_0021:COUNTER_TASKS_INFO}) > 0,
\"New (owner):
\" & {=A6001_0001_0001_0021:TASKS_TITLES_BB_LIST} & \"

\",
\"\"
) &
if(
intval({=A6001_0001_0001_0022:COUNTER_TASKS_INFO}) > 0,
\"Completed (assignee):
\" & {=A6001_0001_0001_0022:TASKS_TITLES_BB_LIST} & \"

\",
\"\"
) &
if(
intval({=A6001_0001_0001_0023:COUNTER_TASKS_INFO}) > 0,
\"Completed (owner):
\" & {=A6001_0001_0001_0023:TASKS_TITLES_BB_LIST} & \"

\",
\"\"
) &
if(
intval({=A6001_0001_0001_0024:COUNTER_TASKS_INFO}) > 0,
\"In progress (assignee):
\" & {=A6001_0001_0001_0024:TASKS_TITLES_BB_LIST} & \"

\",
\"\"
) &
if(
intval({=A6001_0001_0001_0025:EventsCount}) > 0,
\"Events:
\" & {=A6001_0001_0001_0025:EVENTS_TITLES_BB_LIST},
\"\"
)
}}";
$MESS["BITRIX_AI_DAY_PLANNER_USER_ENDDAY_MESSAGE"] = "New (owner):
{=A5001_0001_0001_0021:TASKS_TITLES_BB_LIST}

Completed (assignee):
{=A5001_0001_0001_0022:TASKS_TITLES_BB_LIST}

Completed (owner):
{=A5001_0001_0001_0023:TASKS_TITLES_BB_LIST}

In progress (assignee):
{=A5001_0001_0001_0024:TASKS_TITLES_BB_LIST}

Events:
{=A5001_0001_0001_0025:EVENTS_TITLES_BB_LIST}";
$MESS["BITRIX_AI_DAY_PLANNER_USER_ENDDAY_MESSAGE_FALLBACK"] = "{{=
if(
intval({=A6001_0001_0001_0021:COUNTER_TASKS_INFO}) > 0,
\"New (owner):
\" & {=A6001_0001_0001_0021:TASKS_TITLES_BB_LIST} & \"

\",
\"\"
) &
if(
intval({=A6001_0001_0001_0022:COUNTER_TASKS_INFO}) > 0,
\"Completed (assignee):
\" & {=A6001_0001_0001_0022:TASKS_TITLES_BB_LIST} & \"

\",
\"\"
) &
if(
intval({=A6001_0001_0001_0023:COUNTER_TASKS_INFO}) > 0,
\"Completed (owner):
\" & {=A6001_0001_0001_0023:TASKS_TITLES_BB_LIST} & \"

\",
\"\"
) &
if(
intval({=A6001_0001_0001_0024:COUNTER_TASKS_INFO}) > 0,
\"In progress (assignee):
\" & {=A6001_0001_0001_0024:TASKS_TITLES_BB_LIST} & \"

\",
\"\"
) &
if(
intval({=A6001_0001_0001_0025:EventsCount}) > 0,
\"Events:
\" & {=A6001_0001_0001_0025:EVENTS_TITLES_BB_LIST},
\"\"
)
}}";
$MESS["BITRIX_AI_DAY_PLANNER_USER_PLAN_DELIVERY_WDS"] = "Your daily plan:

{{=
if(
intval({=A3001_0001_0001_0021:COUNTER_TASKS_INFO}) > 0,
\"Overdue:
\" & {=A3001_0001_0001_0021:TASKS_TITLES_BB_LIST} & \"

\",
\"\"
) &
if(
intval({=A3001_0001_0001_0022:COUNTER_TASKS_INFO}) > 0,
\"In progress (assignee):
\" & {=A3001_0001_0001_0022:TASKS_TITLES_BB_LIST} & \"

\",
\"\"
) &
if(
intval({=A3001_0001_0001_0023:EventsCount}) > 0,
\"Events:
\" & {=A3001_0001_0001_0023:EVENTS_TITLES_BB_LIST},
\"\"
)
}}";
$MESS["BITRIX_AI_DAY_PLANNER_USER_PLAN_MESSAGE"] = "{{=
if(
intval({=A2001_0001_0001_0021:COUNTER_TASKS_INFO}) > 0,
\"Overdue:
\" & {=A2001_0001_0001_0021:TASKS_TITLES_BB_LIST} & \"

\",
\"\"
) &
if(
intval({=A2001_0001_0001_0022:COUNTER_TASKS_INFO}) > 0,
\"In progress (assignee):
\" & {=A2001_0001_0001_0022:TASKS_TITLES_BB_LIST} & \"

\",
\"\"
) &
if(
intval({=A2001_0001_0001_0023:EventsCount}) > 0,
\"Events:
\" & {=A2001_0001_0001_0023:EVENTS_TITLES_BB_LIST},
\"\"
)
}}";
$MESS["BITRIX_AI_DAY_PLANNER_USER_PLAN_MESSAGE_WDS"] = "{{=
if(
intval({=A3001_0001_0001_0021:COUNTER_TASKS_INFO}) > 0,
\"Overdue:
\" & {=A3001_0001_0001_0021:TASKS_TITLES_BB_LIST} & \"

\",
\"\"
) &
if(
intval({=A3001_0001_0001_0022:COUNTER_TASKS_INFO}) > 0,
\"In progress (assignee):
\" & {=A3001_0001_0001_0022:TASKS_TITLES_BB_LIST} & \"

\",
\"\"
) &
if(
intval({=A3001_0001_0001_0023:EventsCount}) > 0,
\"Events:
\" & {=A3001_0001_0001_0023:EVENTS_TITLES_BB_LIST},
\"\"
)
}}";
$MESS["BITRIX_AI_DAY_PLANNER_WELCOMEMESSAGE"] = "Hello!

I'm your planning and controlling agent.

I can help you start off in the morning by reminding you about events, tasks and everything else.";
$MESS["BITRIX_AI_DAY_PLANNER_WRITEDATASTORAGEACTIVITY_TITLE"] = "Write data";
$MESS["BIZPROC_NODES_BITRIX_AI_DAY_PLANNER_CONST_BOSS_BOT_AVATAR"] = "Chat bot image as it appears in employee report";
$MESS["BIZPROC_NODES_BITRIX_AI_DAY_PLANNER_CONST_BOSS_BOT_NAME"] = "Chat bot name as it reads in employee report";
$MESS["BIZPROC_NODES_BITRIX_AI_DAY_PLANNER_CONST_BOSS_BOT_NAME_DEFAULT"] = "AI-assisted work reports";
$MESS["BIZPROC_NODES_BITRIX_AI_DAY_PLANNER_CONST_BOT_AVATAR"] = "Chat bot image";
$MESS["BIZPROC_NODES_BITRIX_AI_DAY_PLANNER_CONST_BOT_NAME"] = "Chat bot name";
$MESS["BIZPROC_NODES_BITRIX_AI_DAY_PLANNER_CONST_BOT_NAME_DEFAULT"] = "AI-assisted daily plan and report";
$MESS["BIZPROC_NODES_BITRIX_AI_DAY_PLANNER_CONST_SCHEDULE_INTERVAL"] = "Repeat interval";
$MESS["BIZPROC_NODES_BITRIX_AI_DAY_PLANNER_CONST_SCHEDULE_TYPE"] = "Run mode";
$MESS["BIZPROC_NODES_BITRIX_AI_DAY_PLANNER_CONST_SCHEDULE_WEEKDAYS"] = "Days of week";
$MESS["BIZPROC_NODES_BITRIX_AI_DAY_PLANNER_DESC"] = "The agent will help the supervisor plan their work and monitor the team. It will collect data on events, tasks and decisions made in the chat, and send the summary to the supervisor.
- At the start of the day, the agent will analyze the calendar, task chat messages and send a detailed plan for the day.
- When the workday is over, it will compare the plan with what was actually done, and  create a report.
- The agent will create and send employee performance reports to the supervisor: tasks completed, overdue, events the employee participated in etc. Daily, weekly and monthly reports are possible.
Subordinate supervisors will also receive their own daily performance reports, and weekly reports for their employees.";
$MESS["BIZPROC_NODES_BITRIX_AI_DAY_PLANNER_FIELD_DATE"] = "Date created";
$MESS["BIZPROC_NODES_BITRIX_AI_DAY_PLANNER_FIELD_RESULT"] = "Analysis result";
$MESS["BIZPROC_NODES_BITRIX_AI_DAY_PLANNER_FIELD_USER"] = "Employee";
$MESS["BIZPROC_NODES_BITRIX_AI_DAY_PLANNER_NAME"] = "Planning and controlling agent";
$MESS["BIZPROC_NODES_BITRIX_AI_DAY_PLANNER_SCHEDULE_DAILY"] = "Daily";
$MESS["BIZPROC_NODES_BITRIX_AI_DAY_PLANNER_SCHEDULE_WEEKLY"] = "Weekly";
$MESS["BIZPROC_NODES_BITRIX_AI_DAY_PLANNER_STORAGE_TITLE"] = "Daily planner agent results";
$MESS["BIZPROC_NODES_BITRIX_AI_DAY_PLANNER_WELCOMES_FIELD_BOT_KIND"] = "Bot type";
$MESS["BIZPROC_NODES_BITRIX_AI_DAY_PLANNER_WELCOMES_FIELD_DATE"] = "Welcome message send date";
$MESS["BIZPROC_NODES_BITRIX_AI_DAY_PLANNER_WELCOMES_FIELD_USER"] = "User";
$MESS["BIZPROC_NODES_BITRIX_AI_DAY_PLANNER_WELCOMES_STORAGE_TITLE"] = "Chat bot welcome messages";
$MESS["BIZPROC_NODES_BITRIX_AI_DAY_PLANNER_WIZARD_DESC"] = "Fill out the field to help the agent create employee plans.";
$MESS["BIZPROC_NODES_BITRIX_AI_DAY_PLANNER_WIZARD_TITLE"] = "Daily planner agent";
