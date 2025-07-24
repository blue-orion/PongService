export interface Friend {
  id: number;
  name: string;
  status: "online" | "offline" | "in-game";
  avatar?: string;
  relationId?: number;
  username?: string;
}

export interface FriendRequest {
  id: number;
  name: string;
  username: string;
  avatar?: string;
  relationId: number;
}

export interface SentRequest {
  id: number;
  name: string;
  username: string;
  avatar?: string;
  relationId: number;
}

export interface UserProfile {
  id: number;
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
    relationId?: number;
    message?: string;
    userId?: number;
    status?: string;
    requestData?: any;
    [key: string]: any;
  };
}
