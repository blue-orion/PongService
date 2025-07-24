import PongException from "#shared/exception/pongException.js";

class FriendHelpers {
  validateFriendRequestForm(formData) {
    if (!formData.receiverName || !formData.senderId) {
      throw new PongException("Receiver name and sender ID are required", 400);
    }
  }

  validateFriendAcceptionForm(relationId) {
    if (!relationId) {
      throw new PongException("Relation ID is required", 400);
    }
  }

  validateExistingReceiver(receiver) {
    if (!receiver) {
      throw new PongException("Receiver not found", 404);
    }
  }

  validateRelationNotExists(relation) {
    if (relation) {
      throw new PongException("Friend request already exists", 400);
    }
  }

  validateRelationExists(relation) {
    if (!relation) {
      throw new PongException("Friend request does not exist", 404);
    }
  }

  validateFriendDeleteForm(formData) {
    if (!formData.friendId || !formData.userId) {
      throw new PongException("Friend ID and User ID are required", 400);
    }
  }

  validateFriendCancelForm(formData) {
    if (!formData.receiverId || !formData.senderId) {
      throw new PongException("Receiver ID and Sender ID are required", 400);
    }
  }
}

export default FriendHelpers;
