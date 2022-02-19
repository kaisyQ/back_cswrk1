const express = require('express')
const { Client } = require('pg')
const cors =  require('cors');
const bodyParser = require('body-parser');

const JWTCom = require('./TokenSetup/TokenFunc')


const app = express()
const client = new Client(require('./DataBaseScripts/Config'))

async function start() {
    
    try {
        client.connect()
    } catch (err) {
        console.error(err)
    }

    app.listen(3000, function () {
        console.log('server is running on port 3000');
    })
}

start()

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.post('/takeUser', (req, res) => {
    console.log(req.body)
    const user = JWTCom.DecodeJWT(req.body.token)
    
    // Достать необходимую для страницы информацию 
    // Отправляем юзера обратно
    res.json(user)
})

app.post('/login', (req, res) => {
    console.log(req.body)
    if (req.body.email === 'admin') {
        res.json({
            role: 'admin', 
            email: 'admin',
            password: req.body.password,
            token: JWTCom.MakeJWTFromEmailAndPassword({
                email: req.body.email,
                password: req.body.password
            })
        })
    } else {
        res.json({
            role: 'user', 
            email: 'user',
            password: req.body.password,
            token: JWTCom.MakeJWTFromEmailAndPassword({
                email: req.body.email,
                password: req.body.password
            })
        })
    }
})
