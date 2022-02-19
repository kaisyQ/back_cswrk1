const jwt = require('jsonwebtoken');

class JWTCom{
    MakeJWTFromEmailAndPassword(user) {
        return jwt.sign(user, require('./TokenKey'))
    }
    
    DecodeJWT(headersTokenString) {
        const token = headersTokenString.split(' ')[1]
        return jwt.verify(token, require('./TokenKey'))
    }
}


module.exports = new JWTCom()