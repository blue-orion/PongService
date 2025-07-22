export interface Friend {
  id: string;
  name: string;
  status: "online" | "offline" | "in-game";
  avatar?: string;
  relationId?: string;
  username?: string;
}

export interface FriendRequest {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  relationId: string;
}

export interface SentRequest {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  relationId: string;
}

export interface UserProfile {
  id: string;
  username: string;
  nickname?: string;
  profileImage?: string;
  status?: string;
  gameRating?: number;
}

export type UserStatus = "online" | "offline" | "in-game";

export interface FriendNotificationPayload {
  type:
    | "request"
    | "accepted"
    | "rejected"
    | "cancelled"
    | "deleted"
    | "status_changed"
    | "user_status"
    | "status_update";
  payload: {
    relationId?: string;
    message?: string;
    userId?: string;
    status?: string;
    requestData?: any;
    [key: string]: any;
  };
}
