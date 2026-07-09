import { createAdminClient } from '@/lib/supabase/admin'
import { answerCallbackQuery, editMessageReplyMarkup } from './send'

const HELP_TEXT = `*AFCS Smart Campus — Telegram Commands*

*For everyone:*
/start — Welcome & link instructions
/link STAFF_ID EMAIL — Link your account
/status — Check your preferences
/unlink — Disconnect
/tasks — Your assigned tasks
/todo — Your daily to-do list
/pending — Tasks still pending
/complete TASK_ID — Mark task done
/summary — Quick stats snapshot
/help — This message

*Admin / Commandant only:*
/assign STAFF_ID DESCRIPTION — Assign a task
/delete TASK_ID — Remove a task
/broadcast MESSAGE — Send broadcast to all staff`

const WELCOME = `Welcome to *AFCS Smart Campus*!

You can manage tasks, check your duties, and receive notifications right here.

Send /help to see all available commands.

*Get started:*
/link YOUR_STAFF_ID YOUREMAIL@afcs.edu.ng`

async function reply(botUrl: string, chatId: string, msg: string) {
  await fetch(`${botUrl}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: msg, parse_mode: 'Markdown' }),
  })
}

async function replyKeyboard(botUrl: string, chatId: string, msg: string, buttons: { text: string; callback_data: string }[][]) {
  await fetch(`${botUrl}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId, text: msg, parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: buttons },
    }),
  })
}

function bold(s: string) { return `*${s}*` }
function code(s: string) { return `\`${s}\`` }

export async function handleTelegramCommand(
  chatId: string,
  text: string,
  supabase: ReturnType<typeof createAdminClient>,
  botUrl: string,
) {
  const r = (msg: string) => reply(botUrl, chatId, msg)
  const rk = (msg: string, btns: { text: string; callback_data: string }[][]) => replyKeyboard(botUrl, chatId, msg, btns)

  // Get staff linked to this chat
  const { data: staff } = await supabase
    .from('staff')
    .select('id, full_name, role, staff_id')
    .eq('telegram_chat_id', chatId)
    .maybeSingle()

  const isAdmin = staff?.role === 'admin' || staff?.role === 'commandant'

  if (text === '/start') {
    await r(WELCOME)
    return
  }

  if (text === '/help') {
    await r(HELP_TEXT)
    return
  }

  if (text === '/status') {
    if (!staff) {
      await r('Not linked. Use /link STAFF_ID EMAIL to connect.')
      return
    }
    await r(
      `${bold('Account:')} ${staff.full_name}\n` +
      `${bold('Staff ID:')} ${staff.staff_id}\n` +
      `${bold('Role:')} ${staff.role}\n` +
      `${bold('Telegram:')} ✅ Active`
    )
    return
  }

  if (text.startsWith('/link')) {
    const parts = text.trim().split(/\s+/)
    const staffId = parts[1]
    const email = parts[2]

    if (!staffId || !email) {
      await r('Usage: /link STAFF_ID EMAIL\nExample: /link AFC-0001 commandant@afcs.edu.ng')
      return
    }

    if (staff) {
      await r(`Already linked as ${staff.full_name}. Use /unlink first to change.`)
      return
    }

    const { data: found } = await supabase
      .from('staff')
      .select('id, full_name')
      .eq('staff_id', staffId)
      .eq('email', email)
      .maybeSingle()

    if (!found) {
      await r('No staff found with that Staff ID and email combination.')
      return
    }

    const { error } = await supabase
      .from('staff')
      .update({ telegram_chat_id: chatId })
      .eq('id', found.id)

    if (error) {
      await r('Failed to link. Try again later.')
      return
    }

    await r(`✅ *Linked!* Hello ${found.full_name}, you'll now receive notifications and can manage tasks here.`)
    return
  }

  if (text === '/unlink') {
    if (!staff) {
      await r('Not linked.')
      return
    }
    await supabase.from('staff').update({ telegram_chat_id: null }).eq('id', staff.id)
    await r(`Unlinked, ${staff.full_name}. No more notifications here.`)
    return
  }

  // ── Require linked account beyond this point ──
  if (!staff) {
    await r('Please link your account first: /link STAFF_ID EMAIL')
    return
  }

  if (text === '/tasks' || text === '/pending') {
    const onlyPending = text === '/pending'
    let query = supabase
      .from('parade_tasks')
      .select('id, description, status, priority, deadline, parade:parade_id(date, type)')
      .eq('assigned_to', staff.id)
      .order('created_at', { ascending: false })
      .limit(15)

    if (onlyPending) query = query.not('status', 'eq', 'completed').not('status', 'eq', 'cancelled')

    const { data: tasks } = await query

    if (!tasks?.length) {
      await r(onlyPending ? '✅ No pending tasks. Great job!' : '📋 No tasks assigned to you.')
      return
    }

    const lines = tasks.map((t, i) =>
      `${i + 1}. ${t.status === 'completed' ? '✅' : t.status === 'in_progress' ? '🔄' : '⬜'} ` +
      `${t.description.substring(0, 60)}` +
      `${t.description.length > 60 ? '…' : ''}` +
      ` — ${t.status}${t.deadline ? ` (due: ${t.deadline})` : ''}`
    )

    // Send as chunks if too long
    for (let i = 0; i < lines.length; i += 10) {
      const chunk = lines.slice(i, i + 10).join('\n')
      await rk(
        `${onlyPending ? '📋 *Pending Tasks*' : '📋 *Your Tasks*'}\n━━━━━━━━━━━━━━━\n${chunk}\n━━━━━━━━━━━━━━━`,
        [
          [{ text: '🔄 Refresh', callback_data: 'nav_pending' }],
          [{ text: '✅ Show Completed', callback_data: 'nav_completed' }],
          [{ text: '📋 All Tasks', callback_data: 'nav_all' }],
        ],
      )
    }
    return
  }

  if (text === '/todo') {
    // Find today's tasks assigned to user (treat as to-do)
    const today = new Date().toISOString().split('T')[0]
    const { data: todos } = await supabase
      .from('parade_tasks')
      .select('id, description, status, parade:parade_id(date)')
      .eq('assigned_to', staff.id)
      .gte('created_at', today)
      .order('created_at', { ascending: false })
      .limit(20)

    if (!todos?.length) {
      await rk('📋 *Daily To-Do*\n━━━━━━━━━━━━━━━\nNothing on your to-do list today.', [
        [{ text: '➕ Add Item', callback_data: `todo_add:${chatId}` }],
      ])
      return
    }

    const lines = todos.map((t, i) =>
      `${i + 1}. ${t.status === 'completed' ? '✅' : '⬜'} ${t.description.substring(0, 60)}${t.description.length > 60 ? '…' : ''}`
    )

    const buttons = todos.filter(t => t.status !== 'completed').slice(0, 5).map(t => [
      { text: `✅ ${t.description.substring(0, 30)}`, callback_data: `todo_done:${t.id}` },
    ])

    await rk(
      `📋 *Daily To-Do* (${todos.length} items)\n━━━━━━━━━━━━━━━\n${lines.join('\n')}\n━━━━━━━━━━━━━━━`,
      [
        ...buttons,
        [{ text: '➕ Add Item', callback_data: `todo_add:${chatId}` }],
      ],
    )
    return
  }

  if (text.startsWith('/todo_add ')) {
    const description = text.slice('/todo_add '.length).trim()
    if (!description) { await r('Usage: /todo_add Buy chalk'); return }

    // Find or create today's parade
    const today = new Date().toISOString().split('T')[0]
    let { data: parade } = await supabase
      .from('parade_sessions').select('id').eq('date', today).neq('status', 'cancelled').maybeSingle()
    if (!parade) {
      const { data: created } = await supabase
        .from('parade_sessions').insert({ date: today, type: 'morning' }).select('id').single()
      parade = created
    }
    if (!parade) { await r('Failed to create task.'); return }

    const { error } = await supabase.from('parade_tasks').insert({
      parade_id: parade.id, assigned_to: staff.id, description, priority: 'normal',
    })
    if (error) { await r('Failed to create task.'); return }

    await r(`✅ Added: ${description}`)
    return
  }

  if (text.startsWith('/complete ')) {
    const taskId = text.slice('/complete '.length).trim()
    if (!taskId) { await r('Usage: /complete TASK_ID'); return }

    const { data: task } = await supabase
      .from('parade_tasks').select('id, assigned_to, description').eq('id', taskId).maybeSingle()
    if (!task) { await r('Task not found.'); return }
    if (task.assigned_to !== staff.id && !isAdmin) { await r('Not your task.'); return }

    await supabase.from('parade_tasks').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', taskId)
    await r(`✅ Completed: ${task.description}`)
    return
  }

  if (text.startsWith('/delete ')) {
    const taskId = text.slice('/delete '.length).trim()
    if (!taskId) { await r('Usage: /delete TASK_ID'); return }

    const { data: task } = await supabase
      .from('parade_tasks').select('id, assigned_to, description').eq('id', taskId).maybeSingle()
    if (!task) { await r('Task not found.'); return }
    if (task.assigned_to !== staff.id && !isAdmin) { await r('Not your task.'); return }

    await supabase.from('task_responses').delete().eq('task_id', taskId)
    await supabase.from('telegram_task_messages').delete().eq('task_id', taskId)
    await supabase.from('parade_tasks').delete().eq('id', taskId)
    await r(`🗑️ Deleted: ${task.description}`)
    return
  }

  if (text === '/summary') {
    const today = new Date().toISOString().split('T')[0]

    const [
      { count: totalTasks },
      { count: pendingTasks },
      { count: myTasks },
      { count: myPending },
      { data: todayParade },
    ] = await Promise.all([
      supabase.from('parade_tasks').select('id', { count: 'exact', head: true }),
      supabase.from('parade_tasks').select('id', { count: 'exact', head: true }).not('status', 'eq', 'completed').not('status', 'eq', 'cancelled'),
      supabase.from('parade_tasks').select('id', { count: 'exact', head: true }).eq('assigned_to', staff.id),
      supabase.from('parade_tasks').select('id', { count: 'exact', head: true }).eq('assigned_to', staff.id).not('status', 'eq', 'completed').not('status', 'eq', 'cancelled'),
      supabase.from('parade_sessions').select('status').eq('date', today).limit(1).maybeSingle(),
    ])

    await r(
      `${bold('📊 AFCS Summary')}\n` +
      `━━━━━━━━━━━━━━━\n` +
      `📋 Total tasks: ${totalTasks ?? 0}\n` +
      `🔄 Pending: ${pendingTasks ?? 0}\n` +
      `━━━━━━━━━━━━━━━\n` +
      `${bold('Your stats:')}\n` +
      `📋 Assigned: ${myTasks ?? 0}\n` +
      `🔄 Active: ${myPending ?? 0}\n` +
      `━━━━━━━━━━━━━━━\n` +
      `${todayParade ? `🚩 Today's parade: ${todayParade.status}` : '🚩 No parade today'}\n` +
      `━━━━━━━━━━━━━━━\n` +
      `_Air Force Comprehensive School, Igbara-Oke_`
    )
    return
  }

  // ── Admin / Commandant only commands ──
  if (!isAdmin) {
    await r(`Unknown command. Send /help for available commands.`)
    return
  }

  if (text.startsWith('/assign ')) {
    const args = text.slice('/assign '.length).trim().split(/\s+/)
    const targetStaffId = args[0]
    const description = args.slice(1).join(' ')

    if (!targetStaffId || !description) {
      await r('Usage: /assign STAFF_ID Task description\nExample: /assign AFC-0002 Prepare weekly report')
      return
    }

    const { data: targetStaff } = await supabase
      .from('staff')
      .select('id, full_name, telegram_chat_id')
      .eq('staff_id', targetStaffId)
      .maybeSingle()

    if (!targetStaff) {
      await r(`Staff ID ${code(targetStaffId)} not found.`)
      return
    }

    const today = new Date().toISOString().split('T')[0]
    let { data: parade } = await supabase
      .from('parade_sessions').select('id').eq('date', today).neq('status', 'cancelled').maybeSingle()
    if (!parade) {
      const { data: created } = await supabase
        .from('parade_sessions').insert({ date: today, type: 'morning' }).select('id').single()
      parade = created
    }
    if (!parade) { await r('Failed to create task.'); return }

    const { data: task, error } = await supabase
      .from('parade_tasks')
      .insert({ parade_id: parade.id, assigned_to: targetStaff.id, description, priority: 'normal' })
      .select('id')
      .single()

    if (error) { await r('Failed to create task: ' + error.message); return }

    await r(`✅ Task assigned to ${targetStaff.full_name}: ${description}`)

    // Notify the assignee
    if (targetStaff.telegram_chat_id) {
      const token = process.env.TELEGRAM_BOT_TOKEN
      if (token) {
        const assignBotUrl = `https://api.telegram.org/bot${token}`
        await fetch(`${assignBotUrl}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: targetStaff.telegram_chat_id,
            text: `📋 *New Task Assigned*\n━━━━━━━━━━━━━━━\n${bold('From:')} ${staff.full_name} (${staff.role})\n${bold('Task:')} ${description}\n━━━━━━━━━━━━━━━\nUse /tasks to view all your tasks.`,
            parse_mode: 'Markdown',
          }),
        })
      }
    }
    return
  }

  if (text === '/broadcast' && staff) {
    await r('To send a broadcast, type:\n/broadcast Your message here\n\nIt will be sent to all active staff.')
    return
  }

  if (text.startsWith('/broadcast ')) {
    const message = text.slice('/broadcast '.length).trim()
    if (!message) { await r('Usage: /broadcast Your message'); return }

    const { data: allStaff } = await supabase
      .from('staff').select('telegram_chat_id').eq('is_active', true).not('telegram_chat_id', 'is', null)

    if (!allStaff?.length) { await r('No staff with Telegram linked.'); return }

    const token = process.env.TELEGRAM_BOT_TOKEN
    if (!token) { await r('Bot not configured.'); return }
    const bUrl = `https://api.telegram.org/bot${token}`

    let sent = 0
    for (const s of allStaff) {
      try {
        await fetch(`${bUrl}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: s.telegram_chat_id,
            text: `📢 *Broadcast from ${staff.full_name}*\n━━━━━━━━━━━━━━━\n${message}\n━━━━━━━━━━━━━━━\n_AFCS Smart Campus_`,
            parse_mode: 'Markdown',
          }),
        })
        sent++
      } catch { /* skip */ }
    }
    await r(`📢 Broadcast sent to ${sent} staff.`)
    return
  }

  await r(`Unknown command. Send /help for available commands.`)
}

export async function handleTelegramCallback(
  cq: { id: string; from: { id: number }; data?: string; message?: { chat: { id: number }; message_id: number } },
  supabase: ReturnType<typeof createAdminClient>,
  botUrl: string,
) {
  if (!cq.data || !cq.message) return

  const chatId = String(cq.message.chat.id)
  const msgId = cq.message.message_id

  const { data: staff } = await supabase
    .from('staff').select('id, full_name, role')
    .eq('telegram_chat_id', chatId)
    .maybeSingle()

  const ack = (text: string) => answerCallbackQuery(cq.id, text)
  const editButtons = (buttons?: { text: string; callback_data: string }[][]) =>
    editMessageReplyMarkup(chatId, msgId, buttons)

  // Navigation callbacks
  if (cq.data === 'nav_pending' || cq.data === 'nav_completed' || cq.data === 'nav_all') {
    const showCompleted = cq.data === 'nav_completed'
    const showAll = cq.data === 'nav_all'

    if (!staff) { await ack('Not linked.'); return }

    let query = supabase
      .from('parade_tasks')
      .select('id, description, status, deadline')
      .eq('assigned_to', staff.id)
      .order('created_at', { ascending: false })
      .limit(15)

    if (!showAll) {
      if (showCompleted) query = query.eq('status', 'completed')
      else query = query.not('status', 'eq', 'completed').not('status', 'eq', 'cancelled')
    }

    const { data: tasks } = await query

    const label = showAll ? 'All Tasks' : showCompleted ? 'Completed' : 'Pending'
    const lines = tasks?.length
      ? tasks.map((t, i) =>
          `${i + 1}. ${t.status === 'completed' ? '✅' : t.status === 'in_progress' ? '🔄' : '⬜'} ` +
          `${t.description.substring(0, 50)}${t.description.length > 50 ? '…' : ''}`
        ).join('\n')
      : 'Nothing here.'

    const btns = [
      [{ text: '🔄 Pending', callback_data: 'nav_pending' },
       { text: '✅ Completed', callback_data: 'nav_completed' }],
      [{ text: '📋 All', callback_data: 'nav_all' }],
    ]

    await editButtons(undefined)
    await fetch(`${botUrl}/editMessageText`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId, message_id: msgId,
        text: `📋 *${label}*\n━━━━━━━━━━━━━━━\n${lines}\n━━━━━━━━━━━━━━━`,
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: btns },
      }),
    })
    await ack('')
    return
  }

  // To-do add — prompt user to type
  if (cq.data?.startsWith('todo_add:')) {
    await ack('Type your to-do item:')
    await reply(botUrl, chatId, '📝 Type your new to-do item:\n\n/cancel — cancel')
    return
  }

  // To-do done
  if (cq.data?.startsWith('todo_done:')) {
    const taskId = cq.data.split(':')[1]
    if (!taskId) { await ack('Invalid'); return }

    await supabase.from('parade_tasks').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', taskId)

    await editButtons()
    await fetch(`${botUrl}/editMessageText`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId, message_id: msgId,
        text: `✅ Task completed!`,
        parse_mode: 'Markdown',
      }),
    })
    await ack('✅ Done!')
    return
  }

  // Individual task deletion from keyboard
  if (cq.data?.startsWith('task_delete:')) {
    const taskId = cq.data.split(':')[1]
    if (!taskId) { await ack('Invalid'); return }

    if (!staff) { await ack('Not linked.'); return }

    const { data: task } = await supabase
      .from('parade_tasks').select('assigned_to').eq('id', taskId).maybeSingle()
    if (!task) { await ack('Not found'); return }
    if (task.assigned_to !== staff.id && staff.role !== 'admin' && staff.role !== 'commandant') {
      await ack('Not your task'); return
    }

    await supabase.from('task_responses').delete().eq('task_id', taskId)
    await supabase.from('telegram_task_messages').delete().eq('task_id', taskId)
    await supabase.from('parade_tasks').delete().eq('id', taskId)

    await editButtons()
    await fetch(`${botUrl}/editMessageText`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId, message_id: msgId,
        text: `🗑️ Task deleted.`,
        parse_mode: 'Markdown',
      }),
    })
    await ack('🗑️ Deleted')
    return
  }

  // ── Existing callback handling (task_ack, task_done, task_issue) ──
  const [action, taskId] = (cq.data || '').split(':')
  if (!taskId) { await ack('Invalid'); return }

  let responseType: string
  let answerText: string
  let updateTaskStatus = false

  switch (action) {
    case 'task_ack':
      responseType = 'acknowledged'; answerText = '✅ Task acknowledged!'; break
    case 'task_done':
      responseType = 'completed'; answerText = '✅ Marked complete!'; updateTaskStatus = true; break
    case 'task_issue':
      responseType = 'issue_reported'; answerText = '📝 Issue reported.'; break
    default:
      await ack('Unknown action')
      return
  }

  if (!staff) { await ack('Not linked. Use /link first.'); return }

  const { error: respError } = await supabase.from('task_responses').insert({
    task_id: taskId, staff_id: staff.id, response_type: responseType, telegram_message_id: msgId,
  })

  if (respError) { await ack('Failed to save.'); return }

  if (updateTaskStatus) {
    await supabase.from('parade_tasks').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', taskId)
  }

  await supabase.from('notification_logs').insert({
    recipient_id: staff.id, recipient_name: staff.full_name, channel: 'telegram',
    message_type: `task_${responseType}`,
    message_body: `${staff.full_name} ${responseType} task ${taskId} via Telegram`,
    status: 'sent', sent_at: new Date().toISOString(),
  })

  if (responseType === 'acknowledged') {
    await editButtons([
      [{ text: '✅ Mark Complete', callback_data: `task_done:${taskId}` }],
      [{ text: '❌ Report Issue', callback_data: `task_issue:${taskId}` }],
    ])
  } else {
    await editButtons()
  }

  await ack(answerText)
}
