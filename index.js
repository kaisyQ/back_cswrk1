const express = require('express')
const { Client } = require('pg')
const cors =  require('cors')
const bodyParser = require('body-parser')

const JWTCom = require('./TokenSetup/TokenFunc')
const DBScripts = require('./DataBaseScripts/dbScripts')

const app = express()
const client = new Client(require('./DataBaseScripts/Config'))

const { PORT } = require('./DevData')
const e = require('express')

async function start() {
    
    try {
        client.connect()
    } catch (err) {
        console.error(err)
    }
    app.listen(PORT, () => {
        console.log(`server is running on port ${PORT}`)
    })
}

start()

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.post('/takeUser', (request, response) => {
    const user = JWTCom.DecodeJWT(request.body.token)
    response.json(user)
})

app.post('/login', async (request, response) => {
    
    const user = await DBScripts.GetUser(client, {
        email: request.body.email, 
        password: request.body.password
    })

    if (user) {
        const token = JWTCom.MakeJWTFromEmailAndPassword(user)
        response.json({token: `Bearer ${token}`})

    } else {
        response.json({error: 'Error'}) // Пользователь не найден
    }

})


app.post('/takeUserPageData', async (request, response) => {
    const user = JWTCom.DecodeJWT(request.body.token)
    const userLogs = await DBScripts.GetAllUserLogs(client, user)

    const resultUserLogs = []

    if (userLogs) {
        for (let i = 0; i < userLogs.length; ++i) {
            let login = '**'
            if (userLogs.login) {
                login = userLogs.login
            } 
            resultUserLogs.push({
                logsDate: userLogs.log_date.split('-').reverse().join('/'),
                loginTime: userLogs.login,
                LogoutTime: login,
                logoutReason: userLogs.logout_reason
            })
        }

        response.json({
            user: user,
            userLogs: resultUserLogs
        })

    } else {
        response.json({
            text: 'Cant find logs...',
            data: null,
            user: user
        })
    }
})

app.post('/takeAdminPageData', async (request, response) => {
    const user = JWTCom.DecodeJWT(request.body.token)
    const allUsers = await DBScripts.GetAllUsers(client)

    if (allUsers) {
        for (let i = 0; i < allUsers.length; ++i) {
            if (user.email === allUsers[i].email) {
                allUsers.splice(i, 1)
            }
        }
        response.json({
            user: user,
            allUsers: allUsers
        })

    } else {
        response.json({
            text: 'Query error',
            data: null,
            user: user
        }) 
    }
})

app.post('/ChangeRole', async (request, response) => {
    const user = JWTCom.DecodeJWT(request.body.token)
    const editingUser = request.body.editingUser

    if (user.role_id === 1) {
        const isEditRole = DBScripts.EditRole(client, editingUser)
        if (isEditRole) {
            response.json({
                isRoleChanged: true
            })
        } else {
            response.json({
                text: 'cant change role',
                isRoleChanged: false
            })
        }

    } else {
        response.json({
            text: 'error'
        })
    }
})


app.post('./AddUser', async (request, response) => {
    const user = JWTCom.DecodeJWT(request.body.token)
    const addingUser = request.body.addingUser
    // Доделаю завтра
})