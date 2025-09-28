export enum EventType {
  VIDEO_PROCESSED = "VIDEO_PROCESSED",
  VIDEO_FAILED = "VIDEO_FAILED",
}

export interface UserDTO {
  id: string;
  name?: string;
  email: string;
}

export interface EventPayload {
  eventId: string;
  eventType: EventType;
  timestamp: string;
  user: UserDTO;
  data: Record<string, any>;
}
