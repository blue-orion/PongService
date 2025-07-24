import FriendService from "#domains/friend/service/friendService.js";
import { jest, describe, test, expect, beforeEach } from "@jest/globals";

const mockFriendRepo = {
  findRelation: jest.fn(),
  requestFriend: jest.fn(),
  acceptFriendRequest: jest.fn(),
  deleteFriend: jest.fn(),
  getReceivedRequests: jest.fn(),
  getSentRequests: jest.fn(),
};

const mockUserRepo = {
  addFriendToList: jest.fn(),
  removeFriendFromList: jest.fn(),
};

const mockWebsocketManager = {
  sendToNamespaceUser: jest.fn(),
};

describe("FriendService", () => {
  let friendService;

  beforeEach(() => {
    friendService = new FriendService(mockFriendRepo, mockUserRepo, mockWebsocketManager);
    jest.clearAllMocks(); // Mock 호출 기록 초기화
  });

  describe("requestFriend", () => {
    test("should send a friend request", async () => {
      const senderId = 1;
      const receiverId = 2;
      const mockRelation = { id: 123, sender_id: senderId, receiver_id: receiverId };

      mockFriendRepo.findRelation.mockResolvedValue(null);
      mockFriendRepo.requestFriend.mockResolvedValue(mockRelation);

      const result = await friendService.requestFriend(senderId, receiverId);

      expect(result).toBe(mockRelation.id);
      expect(mockFriendRepo.findRelation).toHaveBeenCalledWith(senderId, receiverId);
      expect(mockFriendRepo.requestFriend).toHaveBeenCalledWith(senderId, receiverId);
      expect(mockWebsocketManager.sendToNamespaceUser).toHaveBeenCalledWith("friend", receiverId, "friend_request", {
        type: "request",
        payload: { relationId: mockRelation.id, message: "You have a new friend request" },
      });
    });

    test("should throw an error if senderId or receiverId is missing", async () => {
      await expect(friendService.requestFriend(null, 2)).rejects.toThrow("Sender ID and Receiver ID are required");
      await expect(friendService.requestFriend(1, null)).rejects.toThrow("Sender ID and Receiver ID are required");
      expect(mockFriendRepo.findRelation).not.toHaveBeenCalled();
      expect(mockFriendRepo.requestFriend).not.toHaveBeenCalled();
    });

    test("should throw an error if friend request already exists", async () => {
      const senderId = 1;
      const receiverId = 2;

      mockFriendRepo.findRelation.mockResolvedValue({ id: 1 });

      await expect(friendService.requestFriend(senderId, receiverId)).rejects.toThrow("Friend request already exists");

      expect(mockFriendRepo.findRelation).toHaveBeenCalledWith(senderId, receiverId);
      expect(mockFriendRepo.requestFriend).not.toHaveBeenCalled();
    });
  });

  describe("acceptFriendRequest", () => {
    test("should accept a friend request", async () => {
      const relationId = 1;
      const mockRelation = { id: relationId, sender_id: 1, receiver_id: 2, status: "PENDING" };

      mockFriendRepo.acceptFriendRequest.mockResolvedValue(mockRelation);

      const result = await friendService.acceptFriendRequest(relationId);

      expect(mockFriendRepo.acceptFriendRequest).toHaveBeenCalledWith(relationId);
      expect(mockUserRepo.addFriendToList).toHaveBeenCalledWith(mockRelation.sender_id, mockRelation.receiver_id);
      expect(mockUserRepo.addFriendToList).toHaveBeenCalledWith(mockRelation.receiver_id, mockRelation.sender_id);
      expect(mockWebsocketManager.sendToNamespaceUser).toHaveBeenCalledWith(
        "friend",
        mockRelation.receiver_id,
        "friend_request",
        {
          type: "accepted",
          payload: {
            message: "Friend request accepted",
            relationId: mockRelation.id,
            userId: mockRelation.sender_id,
          },
        }
      );
      expect(result).toEqual(mockRelation);
    });

    test("should throw an error if relation does not exist", async () => {
      const relationId = 1;

      mockFriendRepo.acceptFriendRequest.mockResolvedValue(null);

      await expect(friendService.acceptFriendRequest(relationId)).rejects.toThrow("Friend relation does not exist");

      expect(mockFriendRepo.acceptFriendRequest).toHaveBeenCalledWith(relationId);
      expect(mockUserRepo.addFriendToList).not.toHaveBeenCalled();
    });

    test("should throw an error if relationId is missing", async () => {
      await expect(friendService.acceptFriendRequest(null)).rejects.toThrow("Relation ID is required");
      expect(mockFriendRepo.acceptFriendRequest).not.toHaveBeenCalled();
    });
  });

  describe("deleteFriend", () => {
    test("should delete a friend relationship", async () => {
      const relationId = 1;
      const mockRelation = { id: relationId, sender_id: 1, receiver_id: 2 };

      mockFriendRepo.findRelation.mockResolvedValue(mockRelation);
      mockFriendRepo.deleteFriend.mockResolvedValue(mockRelation);

      const result = await friendService.deleteFriend(relationId);

      expect(mockFriendRepo.findRelation).toHaveBeenCalledWith(relationId);
      expect(mockUserRepo.removeFriendFromList).toHaveBeenCalledWith(mockRelation.sender_id, mockRelation.receiver_id);
      expect(mockUserRepo.removeFriendFromList).toHaveBeenCalledWith(mockRelation.receiver_id, mockRelation.sender_id);
      expect(mockFriendRepo.deleteFriend).toHaveBeenCalledWith(relationId);
      expect(result).toEqual(mockRelation);
    });

    test("should throw an error if relation does not exist", async () => {
      const relationId = 1;

      mockFriendRepo.findRelation.mockResolvedValue(null);

      await expect(friendService.deleteFriend(relationId)).rejects.toThrow("Friend relation does not exist");

      expect(mockFriendRepo.findRelation).toHaveBeenCalledWith(relationId);
      expect(mockFriendRepo.deleteFriend).not.toHaveBeenCalled();
    });

    test("should throw an error if relationId is missing", async () => {
      await expect(friendService.deleteFriend(null)).rejects.toThrow("Relation ID is required");
      expect(mockFriendRepo.findRelation).not.toHaveBeenCalled();
      expect(mockFriendRepo.deleteFriend).not.toHaveBeenCalled();
    });
  });

  describe("getReceivedRequests", () => {
    test("should retrieve received friend requests", async () => {
      const userId = 1;
      const pageable = { skip: 0, take: 10 };
      const mockRequests = [{ id: 1, sender_id: 2, receiver_id: userId, status: "PENDING" }];

      mockFriendRepo.getReceivedRequests.mockResolvedValue(mockRequests);

      const result = await friendService.getReceivedRequests(userId, pageable);

      expect(mockFriendRepo.getReceivedRequests).toHaveBeenCalledWith(userId, pageable);
      expect(result).toEqual(mockRequests);
    });

    test("should throw an error if userId is missing for getReceivedRequests", async () => {
      await expect(friendService.getReceivedRequests(null, { skip: 0, take: 10 })).rejects.toThrow(
        "User ID is required"
      );
      expect(mockFriendRepo.getReceivedRequests).not.toHaveBeenCalled();
    });
  });

  describe("getSentRequests", () => {
    test("should retrieve sent friend requests", async () => {
      const userId = 1;
      const pageable = { skip: 0, take: 10 };
      const mockRequests = [{ id: 1, sender_id: userId, receiver_id: 2, status: "PENDING" }];

      mockFriendRepo.getSentRequests.mockResolvedValue(mockRequests);

      const result = await friendService.getSentRequests(userId, pageable);

      expect(mockFriendRepo.getSentRequests).toHaveBeenCalledWith(userId, pageable);
      expect(result).toEqual(mockRequests);
    });

    test("should throw an error if userId is missing for getSentRequests", async () => {
      await expect(friendService.getSentRequests(null, { skip: 0, take: 10 })).rejects.toThrow("User ID is required");
      expect(mockFriendRepo.getSentRequests).not.toHaveBeenCalled();
    });
  });

  describe("rejectFriendRequest", () => {
    test("should reject a friend request", async () => {
      const relationId = 1;
      const mockRelation = { id: relationId, sender_id: 1, receiver_id: 2 };

      mockFriendRepo.deleteFriend.mockResolvedValue(mockRelation);

      const result = await friendService.rejectFriendRequest(relationId);

      expect(mockFriendRepo.deleteFriend).toHaveBeenCalledWith(relationId);
      expect(mockWebsocketManager.sendToNamespaceUser).toHaveBeenCalledWith(
        "friend",
        mockRelation.receiver_id,
        "friend_request",
        {
          type: "rejected",
          payload: {
            message: "Friend request rejected",
            relationId: mockRelation.id,
            userId: mockRelation.sender_id,
          },
        }
      );
      expect(result).toEqual(mockRelation);
    });

    test("should throw an error if relationId is missing for rejectFriendRequest", async () => {
      await expect(friendService.rejectFriendRequest(null)).rejects.toThrow("Relation ID is required");
      expect(mockFriendRepo.deleteFriend).not.toHaveBeenCalled();
    });
  });

  describe("cancelFriendRequest", () => {
    test("should cancel a friend request", async () => {
      const senderId = 1;
      const receiverId = 2;
      const mockRelation = { id: 123, sender_id: senderId, receiver_id: receiverId };

      // Mock 설정
      mockFriendRepo.findRelation.mockResolvedValue(mockRelation);
      mockFriendRepo.deleteFriend.mockResolvedValue(mockRelation);

      const result = await friendService.cancelFriendRequest(senderId, receiverId);

      // 호출 확인
      expect(mockFriendRepo.findRelation).toHaveBeenCalledWith(senderId, receiverId);
      expect(mockFriendRepo.deleteFriend).toHaveBeenCalledWith(mockRelation.id);
      expect(mockWebsocketManager.sendToNamespaceUser).toHaveBeenCalledWith("friend", receiverId, "friend_request", {
        type: "cancelled",
        payload: {
          message: "Friend request cancelled",
          relationId: mockRelation.id,
          userId: senderId,
        },
      });
      expect(result).toEqual(mockRelation);
    });

    test("should throw an error if friend request does not exist", async () => {
      const senderId = 1;
      const receiverId = 2;

      // Mock 설정: 관계가 존재하지 않는 경우
      mockFriendRepo.findRelation.mockResolvedValue(null);

      await expect(friendService.cancelFriendRequest(senderId, receiverId)).rejects.toThrow(
        "Friend request does not exist"
      );

      // 호출 확인
      expect(mockFriendRepo.findRelation).toHaveBeenCalledWith(senderId, receiverId);
      expect(mockFriendRepo.deleteFriend).not.toHaveBeenCalled();
      expect(mockWebsocketManager.sendToNamespaceUser).not.toHaveBeenCalled();
    });

    test("should throw an error if senderId or receiverId is missing", async () => {
      await expect(friendService.cancelFriendRequest(null, 2)).rejects.toThrow(
        "Sender ID and Receiver ID are required"
      );
      await expect(friendService.cancelFriendRequest(1, null)).rejects.toThrow(
        "Sender ID and Receiver ID are required"
      );
      expect(mockFriendRepo.findRelation).not.toHaveBeenCalled();
      expect(mockFriendRepo.deleteFriend).not.toHaveBeenCalled();
    });
  });

  describe("getFriends", () => {
    test("should retrieve a list of friends", async () => {
      const userId = 1;
      const pageable = { skip: 0, take: 10 };
      const mockFriendsData = [
        { id: 2, username: "user2", nickname: "User Two" },
        { id: 3, username: "user3", nickname: "User Three" },
      ];

      // Mock 설정
      mockFriendRepo.userRepo = {
        getFriendsWithDetails: jest.fn().mockResolvedValue(mockFriendsData),
      };

      const result = await friendService.getFriends(userId, pageable);

      // 호출 확인
      expect(mockFriendRepo.userRepo.getFriendsWithDetails).toHaveBeenCalledWith(userId, pageable);
      expect(result).toEqual(mockFriendsData);
    });
  });

  describe("FriendService Constructor", () => {
    test("should initialize with provided dependencies", () => {
      const service = new FriendService(mockFriendRepo, mockUserRepo, mockWebsocketManager);

      expect(service.friendRepo).toBe(mockFriendRepo);
      expect(service.userRepo).toBe(mockUserRepo);
      expect(service.websocketManager).toBe(mockWebsocketManager);
    });
  });
});
