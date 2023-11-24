const config = require("../config/index");
const USER = require("../models/user.model");
const CHATROOM = require("../models/chatRoom.model");
const MESSAGE = require("../models/message.model");
const redi = require("../function/rediFunct")

var jwt = require("jsonwebtoken");

exports.getInfoUser = async (req, res) => {
    let token = req.body.token;
    console.log("token: ", token);
    if (!token) {
        // return res.status(403).send({ message: "No token provided!" });
        return res.send(null);
    }

    jwt.verify(token, config.secret, async (err, decoded) => {
        if (err) {
            return res.status(401).send({ message: "Token không hợp lệ!" });
        }
        req.userId = decoded.id;
    });

    try {
        const user = await USER.findById(req.userId);
        //chatRooms làm riêng với friends vì hủy kết bạn vẫn còn phòng
        let chatRooms = await CHATROOM.find({ owner: user });
        let friends = await USER.find({ _id: user.contacts }, { password: 0, requestContact: 0, contacts: 0, createAt: 0, lastAccess: 0, __v: 0 });
        let requestContact = await USER.find({ _id: user.requestContact }, { password: 0, requestContact: 0, contacts: 0, createAt: 0, lastAccess: 0, __v: 0 });

        const token = jwt.sign({ id: user._id }, config.secret, {
            expiresIn: 86400, // 24 hours
        });
        console.log(chatRooms)
        let roomInfo = [];

        for(let i = 0; i<chatRooms.length; i++){
            let friend, lastMessage = null;
            for(let j = 0; j<chatRooms[i].owner.length; j++){
                if (chatRooms[i].owner[j].toString() == user._id.toString()) {
                    console.log("true", chatRooms[i].owner[j].toString(), user._id.toString(), redi.getTime());
                } else {
                    friend = await USER.findById(chatRooms[i].owner[j]);
                    lastMessage = await MESSAGE.findById(chatRooms[i].message[chatRooms[i].message.length - 1]);
                    console.log("false", chatRooms[i].owner[j].toString(), user._id.toString(), redi.getTime(), friend)
                    roomInfo.push(
                        {
                            _id: chatRooms[i]._id,
                            owner: chatRooms[i].owner,
                            lastMessageDate: chatRooms[i].lastMessageDate,
                            lastMessage: lastMessage,
                            fullNameFriend: friend.fullName,
                            avatar: friend.avatar,
                            online: false
                        }
                    );
                };
            }
        }

        // console.log("requestContact: ", requestContact);
        // console.log("roomInfo: ", roomInfo);
        // console.log("friends: ", friends);
        
        //Send đăng nhập ở chỗ này
        res.status(200).send({
            message: {
                '_id': user._id,
                'phone': user.phone,
                'fullName': user.fullName,
                'avatar': user.avatar,
                'requestContact': requestContact,
                'contacts': friends,
                'chatRooms': roomInfo,
                'token': token
            }
        });

    } catch (error) {
        console.error(error);
    }
}

exports.updateInfo = async (req, res) => {
    try {
        let user = await USER.findById(req.body._id);
        console.log(req.body)
        await user.updateOne({ fullName: req.body.fullName });
        await user.updateOne({ avatar: req.body.avatar });
        return res.send({ message: "Updated successfully" });
    } catch (error) {
        console.log(error)
    }
};

var bcrypt = require("bcryptjs");

exports.changePassword = async (req, res) => {
    try {
        let user = await USER.findById(req.body._id);
        console.log(user)
        var passwordIsValid = bcrypt.compareSync(
            req.body.currentPassword,
            user.password
        );

        if (!passwordIsValid) {
            return res.status(401).send({ message: "Mật khẩu hiện tại chưa đúng !" });
        }
        else {
            await user.updateOne({ password: bcrypt.hashSync(req.body.password, 8) });
            return res.send({ message: "Updated successfully" });
        }
    } catch (error) {
        console.log(error)
    }
}
