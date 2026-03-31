var express = require("express");
var router = express.Router();
let messageController = require('../controllers/messages');
let { CheckLogin } = require('../utils/authHandler');

let multer = require('multer');
let path = require('path');
let storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        let ext = path.extname(file.originalname);
        let fileName = Date.now() + '-' + Math.round(Math.random() * 1000_000_000) + ext;
        cb(null, fileName)
    }
});
let uploadFile = multer({ storage: storage });

// get '/' => lấy message cuối cùng của mỗi user mà user hiện tại nhắn tin hoặc user khác nhắn cho user hiện tại
router.get("/", CheckLogin, async function (req, res, next) {
  try {
    let currentUser = req.user._id;
    let messages = await messageController.getLastMessagesOfCurrentUser(currentUser);
    res.send(messages);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

// get '/:userID' => lấy toàn bộ message giữa user hiện tại và userID
router.get("/:userID", CheckLogin, async function (req, res, next) {
  try {
    let currentUser = req.user._id;
    let userID = req.params.userID;
    let messages = await messageController.getMessagesBetweenUsers(currentUser, userID);
    res.send(messages);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

// post '/' => post nội dung
// Nếu có file -> type: 'file', text: đường dẫn file
// Nếu là text -> type: 'text', text: nội dung
router.post("/", CheckLogin, uploadFile.single('file'), async function (req, res, next) {
  try {
    let from = req.user._id;
    let to = req.body.to;
    let type = 'text';
    let text = req.body.text; 

    if (!to) {
      return res.status(400).send({ message: "'to' / userID nhận tin nhắn là bắt buộc" });
    }

    if (req.file) {
      type = 'file';
      text = req.file.path.replace(/\\/g, '/'); // Chuyển chéo ngược thành chéo tới trên Windows
    } else if (!text) {
      return res.status(400).send({ message: "Nội dung text hoặc file là bắt buộc" });
    }

    let newMessage = await messageController.createMessage(from, to, type, text);
    res.send(newMessage);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

module.exports = router;
