const Creds = require('../../models/Credential');
const RSAKey = require('react-native-rsa');
const rsa = new RSAKey();
const getPublicKey = require('../requests')
const jwt = require('jsonwebtoken')
const ejwt = require('express-jwt')
const secretKey = require('secret-key');
const keygen = require("keygenerator");

// check database for private key related to user then retrieve and use it to decrypt password

const LoginController = () => {
    const decrypt = (req, res) => { 
        console.log("BODY TEXT----: ", req.body)
        var email = req.body.email
        var password = req.body.password
        var notifyToken = req.body.notifyToken
        
        Creds.findAll({where: { // use email to lookup private key
            user_email:email,
        }
        }).then(data => {
            console.log("HERE", data)
            privateKey = data[0].dataValues.private_key // retrieve private key
            rsa.setPrivateString(privateKey)
            console.log("PASSWORD BEFORE DECRYPTION: ", password)
            var decrypted = rsa.decrypt(password) // decrypt the password that was retrieved
            decrypted_password = decrypted
            console.log("PASSWORD AFTER DECRYPTION: ", decrypted)
            return decrypted_password
            }).then(decrypted_password =>  {
                return Creds.findOne({where: {
                user_email:email,
                password_hash: decrypted_password
        }}).then(data => {
            // console.log("DATA:", data)
            if (data == null){ // check to see if the user email and password are in the database
                return res.status(401).json({message: "That account does not exist" })
            }

            else  { 
                email = data.dataValues.user_email
                user_id = data.dataValues.credential_id
                console.log("YOUR EMAIL: ", email)
                // give the user a new secret key here
                genSecret = keygen._()
                console.log("YOUR SECRET", genSecret)
                // store the secret key and the notification token in the database for the user
                return Creds.update({secret: genSecret, notifyToken:notifyToken},
                    { where: {
                    user_email: email,
                }})
                .then(data => { return res.status(200).json({user_id: user_id, "SECRET": genSecret, "B4 Decrypt": password, "After Decrypt": decrypted_password })})
        }
        })}).catch(err => console.log(err, "HEELO")) 
        
    }; 
    return {
        decrypt,
    }
}

module.exports = LoginController;

