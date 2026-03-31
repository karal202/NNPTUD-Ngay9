let messageModel = require("../schemas/messages");

module.exports = {
  getMessagesBetweenUsers: async function (currentUser, otherUser) {
    let messages = await messageModel.find({
      $or: [
        { from: currentUser, to: otherUser },
        { from: otherUser, to: currentUser }
      ],
      isDeleted: false
    }).sort({ createdAt: 1 })
      .populate('from', 'username fullName avatarUrl')
      .populate('to', 'username fullName avatarUrl');
    return messages;
  },
  
  createMessage: async function (from, to, type, text) {
    let newMessage = new messageModel({
      from: from,
      to: to,
      messageContent: {
        type: type,
        text: text
      }
    });
    await newMessage.save();
    return await messageModel.findById(newMessage._id)
      .populate('from', 'username fullName avatarUrl')
      .populate('to', 'username fullName avatarUrl');
  },
  
  getLastMessagesOfCurrentUser: async function (currentUser) {
    // Tìm tất cả tin nhắn mà currentUser là người gửi hoặc người nhận
    let messages = await messageModel.find({
      $or: [
        { from: currentUser },
        { to: currentUser }
      ],
      isDeleted: false
    }).sort({ createdAt: -1 })
      .populate('from', 'username fullName avatarUrl')
      .populate('to', 'username fullName avatarUrl');

    // Lọc ra tin nhắn cuối cùng cho mỗi user (cuộc hội thoại)
    let latestMessagesMap = new Map();

    messages.forEach(msg => {
      // Xác định ID của người kia trong cuộc trò chuyện
      let otherUserId = msg.from._id.toString() === currentUser.toString() 
        ? msg.to._id.toString() 
        : msg.from._id.toString();
      
      if (!latestMessagesMap.has(otherUserId)) {
        latestMessagesMap.set(otherUserId, msg);
      }
    });

    return Array.from(latestMessagesMap.values());
  }
}
