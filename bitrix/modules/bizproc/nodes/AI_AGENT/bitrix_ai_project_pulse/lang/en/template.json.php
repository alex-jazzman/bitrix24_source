<?php
$MESS["BIZPROC_NODES_BITRIX_AI_PROJECT_PULSE_DEFAULT_1"] = "Stay professional and keep a friendly attitude of an experienced colleague. Dial down on emotions. When reminding of deadlines or overdue tasks, err on the side of diplomacy. Be clear and concise, avoid ambiguity.";
$MESS["BIZPROC_NODES_BITRIX_AI_PROJECT_PULSE_DESCRIPTION_1"] = "This agent will help a supervisor control the team with less effort while keeping the team cohesive. It will create deadline reminders and notify of the possible updates.
The agent will create a chat that will include the team members and the agent itself to keep the team current on the events, vacations, deadlines etc.";
$MESS["BIZPROC_NODES_BITRIX_AI_PROJECT_PULSE_EVENT_MSG_1"] = "{=A1821_5801_3457_5880:USER > bbcode} applied for vacation from {=A1821_5801_3457_5880:ACTIVE_FROM} till {=A1821_5801_3457_5880:ACTIVE_TO}.";
$MESS["BIZPROC_NODES_BITRIX_AI_PROJECT_PULSE_EVENT_MSG_2"] = "{=A9091_4926_8068_8735:USER > bbcode} will be on sick leave from {=A9091_4926_8068_8735:ACTIVE_FROM} till {=A9091_4926_8068_8735:ACTIVE_TO}.";
$MESS["BIZPROC_NODES_BITRIX_AI_PROJECT_PULSE_EVENT_MSG_3"] = "Overdue task
Task: {=A3099_3276_3071_1024:TASK_TITLE}
ID: {=A3099_3276_3071_1024:TASK_ID}
Created: {=A3099_3276_3071_1024:TASK_CREATED_DATE}
Assignee: {=A3099_3276_3071_1024:TASK_RESPONSIBLE > bbcode}";
$MESS["BIZPROC_NODES_BITRIX_AI_PROJECT_PULSE_MESSAGETEXT_1"] = "Hello!

I'm {=Constant:SetupTemplateActivity_q3POflLpTX}! I'm here to keep you informed on the updates and current events.";
$MESS["BIZPROC_NODES_BITRIX_AI_PROJECT_PULSE_NAME_1"] = "Project management agent";
$MESS["BIZPROC_NODES_BITRIX_AI_PROJECT_PULSE_NAME_2"] = "Bitrix24 project ID";
$MESS["BIZPROC_NODES_BITRIX_AI_PROJECT_PULSE_NAME_3"] = "Agent group chat name";
$MESS["BIZPROC_NODES_BITRIX_AI_PROJECT_PULSE_NAME_4"] = "Monitor workload of these users";
$MESS["BIZPROC_NODES_BITRIX_AI_PROJECT_PULSE_NAME_5"] = "Chat bot name";
$MESS["BIZPROC_NODES_BITRIX_AI_PROJECT_PULSE_NAME_6"] = "Communication style";
$MESS["BIZPROC_NODES_BITRIX_AI_PROJECT_PULSE_NAME_7"] = "JSON collection";
$MESS["BIZPROC_NODES_BITRIX_AI_PROJECT_PULSE_NAME_8"] = "Record symbolic code";
$MESS["BIZPROC_NODES_BITRIX_AI_PROJECT_PULSE_NAME_9"] = "Field code:Project event notification";
$MESS["BIZPROC_NODES_BITRIX_AI_PROJECT_PULSE_NAME_10"] = "Project event notification";
$MESS["BIZPROC_NODES_BITRIX_AI_PROJECT_PULSE_NAME_11"] = "Field code:Bot ID";
$MESS["BIZPROC_NODES_BITRIX_AI_PROJECT_PULSE_NAME_12"] = "Field code:Chat ID";
$MESS["BIZPROC_NODES_BITRIX_AI_PROJECT_PULSE_STORAGETITLE_1"] = "Project events for project management agent [{=Workflow:TemplateId}]";
$MESS["BIZPROC_NODES_BITRIX_AI_PROJECT_PULSE_STORAGETITLE_2"] = "System information for project management agent [{=Workflow:TemplateId}]";
$MESS["BIZPROC_NODES_BITRIX_AI_PROJECT_PULSE_SYSTEMPROMPT_1"] = "**Role:** You are an assistant in charge of preparing daily digests for the entire team. Your tone is approachable, professional, and supportive.

**Goal:** Convert raw data into an insightful, visually appealing and easily readable report that provides the team with an overview of today's important events and areas of attention.

**Source Data:**
```
JSON collection, where the EVENT_MSG field of each event in the collection contains the event message.
```

DIGEST STRUCTURE
    * [size=18][B]Key Events[/size][BR]
    * [B]Absences[/B]
      - if there are no absences, skip the block
      - for employees, use the format \"[USER={ID from event}]{Full Name from event}[/USER]\"
      - group vacations and sick leaves by employee
       -- for vacations, use the format \"vacation {date range in the format from July 15th to 26th without the year}\"
       -- for sick leaves, use the format \"sick leave {date range in the format from July 15th to 26th without the year}\"
    * [B]Overdue tasks[/B]
      - if there are no overdue tasks, skip the block
      - for employees, use the format \"[USER={ID from event}]{Full Name from event}[/USER]\"
      - group the tasks by employee
      - for tasks, use the format \"{task name}, created {set date without the year}\"
    * [B]Analyze intersections of events[/B]
      - Example: employee is on vacation + they have an unfinished high priority task
      - Highlight these intersections as a separate point in the \"Areas of Focus\" section
      - For each risk, offer a brief and doable recommendation (e.g., \"Assign the task to [Name]\", \"Extend the deadline to [Date]\"). Don't leave risks unattended

Never offer your help on the highlighted points; your task is ONLY to make a report according to these instructions.

{=Constant:SetupTemplateActivity_uJobHKUIWP}";
$MESS["BIZPROC_NODES_BITRIX_AI_PROJECT_PULSE_TEXT_1"] = "The agent will use this information to identify and coordinate the project.";
$MESS["BIZPROC_NODES_BITRIX_AI_PROJECT_PULSE_TEXT_2"] = "Prompt";
$MESS["BIZPROC_NODES_BITRIX_AI_PROJECT_PULSE_TEXT_3"] = "The agent will use this prompt as a set of instructions to control the logic, behavior and communacation style.";
$MESS["BIZPROC_NODES_BITRIX_AI_PROJECT_PULSE_TITLE_1"] = "Node workflow";
$MESS["BIZPROC_NODES_BITRIX_AI_PROJECT_PULSE_TITLE_2"] = "AI agent started manually";
$MESS["BIZPROC_NODES_BITRIX_AI_PROJECT_PULSE_TITLE_3"] = "Data configuration wizard";
$MESS["BIZPROC_NODES_BITRIX_AI_PROJECT_PULSE_TITLE_4"] = "Chat bot settings";
$MESS["BIZPROC_NODES_BITRIX_AI_PROJECT_PULSE_TITLE_5"] = "Send message to group chat";
$MESS["BIZPROC_NODES_BITRIX_AI_PROJECT_PULSE_TITLE_6"] = "Write data";
$MESS["BIZPROC_NODES_BITRIX_AI_PROJECT_PULSE_TITLE_7"] = "AI agent";
$MESS["BIZPROC_NODES_BITRIX_AI_PROJECT_PULSE_TITLE_8"] = "Delete data";
$MESS["BIZPROC_NODES_BITRIX_AI_PROJECT_PULSE_TITLE_9"] = "Read data";
$MESS["BIZPROC_NODES_BITRIX_AI_PROJECT_PULSE_TITLE_10"] = "Create storage";
$MESS["BIZPROC_NODES_BITRIX_AI_PROJECT_PULSE_TITLE_11"] = "Create system information storage";
$MESS["BIZPROC_NODES_BITRIX_AI_PROJECT_PULSE_TITLE_12"] = "Add members to group chat";
$MESS["BIZPROC_NODES_BITRIX_AI_PROJECT_PULSE_TITLE_13"] = "Create group chat";
$MESS["BIZPROC_NODES_BITRIX_AI_PROJECT_PULSE_TITLE_14"] = "Condition";
$MESS["BIZPROC_NODES_BITRIX_AI_PROJECT_PULSE_TITLE_15"] = "Task overdue";
$MESS["BIZPROC_NODES_BITRIX_AI_PROJECT_PULSE_TITLE_16"] = "Vacation added";
$MESS["BIZPROC_NODES_BITRIX_AI_PROJECT_PULSE_TITLE_17"] = "Sick leave added";
$MESS["BIZPROC_NODES_BITRIX_AI_PROJECT_PULSE_TITLE_18"] = "User clocked in";
