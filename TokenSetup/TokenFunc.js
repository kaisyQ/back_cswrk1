const jwt = require('jsonwebtoken')

class JWTCom{
    MakeJWT(user) {
        return jwt.sign(user, require('./TokenKey'))
    }
    
    DecodeJWT(headersTokenString) {
        const token = headersTokenString.split(' ')[1]
        return jwt.verify(token, require('./TokenKey'))
    }
}

const a = new JWTCom()

module.exports = new JWTCom()