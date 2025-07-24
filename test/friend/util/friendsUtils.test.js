import FriendsUtils from "#domains/friend/util/friendsUtils.js";
import { describe, test, expect } from "@jest/globals";

describe("FriendsUtils", () => {
  describe("parseIds", () => {
    test("should parse valid JSON string to an array of integers", () => {
      const jsonString = "[1, 2, 3]";
      const result = FriendsUtils.parseIds(jsonString);
      expect(result).toEqual([1, 2, 3]);
    });

    test("should null for invalid JSON", () => {
      const jsonString = null;
      const result = FriendsUtils.parseIds(jsonString);
      expect(result).toEqual([]);
    });

    test("should return an empty array for non-array JSON", () => {
      const jsonString = '{"key": "value"}'; // 객체 JSON
      const result = FriendsUtils.parseIds(jsonString);
      expect(result).toEqual([]);
    });
  });

  describe("stringifyIds", () => {
    test("should convert an array of integers to a JSON string", () => {
      const idsArray = [1, 2, 3];
      const result = FriendsUtils.stringifyIds(idsArray);
      expect(result).toBe("[1,2,3]");
    });

    test("should return an empty JSON string for non-array input", () => {
      const idsArray = "not an array";
      const result = FriendsUtils.stringifyIds(idsArray);
      expect(result).toBe("[]");
    });

    test("should return an empty JSON string for an empty array", () => {
      const idsArray = [];
      const result = FriendsUtils.stringifyIds(idsArray);
      expect(result).toBe("[]");
    });
  });

  describe("addFriend", () => {
    test("should add a new friend ID to the list", () => {
      const friendsJson = "[1, 2]";
      const newFriendId = 3;
      const result = FriendsUtils.addFriend(friendsJson, newFriendId);
      expect(result).toBe("[1,2,3]");
    });

    test("should not add duplicate friend IDs", () => {
      const friendsJson = "[1, 2]";
      const newFriendId = 2;
      const result = FriendsUtils.addFriend(friendsJson, newFriendId);
      expect(result).toBe("[1,2]");
    });

    test("should throw an error for invalid friend ID", () => {
      const friendsJson = "[1, 2]";
      const newFriendId = "invalid";

      expect(() => FriendsUtils.addFriend(friendsJson, newFriendId)).toThrow("Invalid friend ID");
    });
  });

  describe("removeFriend", () => {
    test("should remove a friend ID from the list", () => {
      const friendsJson = "[1, 2, 3]";
      const friendIdToRemove = 2;
      const result = FriendsUtils.removeFriend(friendsJson, friendIdToRemove);
      expect(result).toBe("[1,3]");
    });

    test("should do nothing if the friend ID is not in the list", () => {
      const friendsJson = "[1, 2, 3]";
      const friendIdToRemove = 4;
      const result = FriendsUtils.removeFriend(friendsJson, friendIdToRemove);
      expect(result).toBe("[1,2,3]");
    });

    test("should handle empty friend list", () => {
      const friendsJson = "[]";
      const friendIdToRemove = 1;
      const result = FriendsUtils.removeFriend(friendsJson, friendIdToRemove);
      expect(result).toBe("[]");
    });
  });
});
