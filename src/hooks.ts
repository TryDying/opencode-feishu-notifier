import type { NotificationType } from "./feishu/messages"

export function mapEventToNotification(eventType: string): NotificationType | null {
  switch (eventType) {
    case "permission.asked":
      return "permission_required"
    case "question.asked":
      return "question_asked"
    default:
      return null
  }
}

type CompletionCandidateEvent = {
  type: string
  properties?: Record<string, unknown>
}

/**
 * 消息完成事件（包含错误后终止）统一映射为完成通知。
 */
export function mapCompletionEventToNotification(
  event: CompletionCandidateEvent
): NotificationType | null {
  const status = event.properties?.status as { type?: string } | undefined
  if (event.type === "session.status" && status?.type === "idle") {
    return "session_idle"
  }

  // 兼容不同版本 OpenCode 可能出现的完成/终止事件名
  if (
    event.type === "message.completed" ||
    event.type === "message.failed" ||
    event.type === "message.errored"
  ) {
    return "session_idle"
  }

  return null
}
