const express = require('express')
const { Client } = require('pg')
const cors =  require('cors')
const bodyParser = require('body-parser')
const { body } = require('express-validator')


const JWTCom = require('./TokenSetup/TokenFunc')
const DBScripts = require('./DataBaseScripts/dbScripts')
const TimeScripts = require('./DataBaseScripts/TimeScripts')

const app = express()
const client = new Client(require('./DataBaseScripts/Config'))

const { PORT } = require('./DevData')

async function start () {
    
    try {
        client.connect()
    } catch (err) {
        console.error(err)
    }
    app.listen(PORT,  () => {
        console.log(`server is running on port ${PORT}`)
    })
}

start()

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.post('/takeUser', (request, response) => {
    const user = JWTCom.DecodeJWT(request.body.token)
    console.log(user)
    response.json(user)
})

app.post('/login', body('email').isEmail(),async (request, response) => {
    
    console.log(request.body.email + ' ' + request.body.password)
    const user = await DBScripts.GetUser(client, {
        email: request.body.email, 
        password: request.body.password
    })
    if (user) {
        const token = JWTCom.MakeJWT(user)
        const lastLog = await DBScripts.GetLastUserLog(client, user)
        const newLog = await TimeScripts.SetEnterTime(client, user)

        if (newLog) {
            if (lastLog.logout) {
                response.json({token: `Bearer ${token}`, isNormalLogout: true})
            } else {
                response.json({token: `Bearer ${token}`, isNormalLogout: false, logId: lastLog.log_id})
            }
        } else {
            response.json({data: null, text: 'set-log-error'})
        }
    } else {
        response.json({error: 'error'}) 
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
            text: 'no logs',
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
            const title = await DBScripts.GetOfficeTitle(client, allUsers[i].user_office_id)
            if (allUsers[i].user_role_id === 1) {
                allUsers[i].role = 'admin'
            } else {
                allUsers[i].role = 'user'
            }
            delete allUsers[i].user_role_id
            delete allUsers[i].user_office_id
            delete allUsers[i].pass
            delete allUsers[i].user_id
            allUsers[i].title = title
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


app.post('/AddUser', async (request, response) => {
    const user = JWTCom.DecodeJWT(request.body.token)
    if (user.user_role_id != 1) {
        response.json({isUserAdded:false, text: 'no-admin-roots'})
    }
    const addingUser = request.body.addingUser
    const isUserAdded = DBScripts.AddUser(client, addingUser)
    if (isUserAdded) {
        response.json({isUserAdded:true})
    } else {
        response.json({isUserAdded: false})
    }
})

app.post('/BanUser', async (request, response) => {
    const user = JWTCom.DecodeJWT(request.body.token)
    if (user.user_role_id === 1) {
        const userToBan = DBScripts.GetUser(request.body.userToBan)
        if (userToBan.user_role_id === 1) {
            response.json({isBanned: false, text: 'trying to ban admin'})
        } else {
            const isUserBanned = await DBScripts(client, userToBan)
            if (isUserBanned) {
                response.json({isBanned: true, text: 'user successfully banned'})
            } else {
                response.json({isBanned: false, text: 'ban-error'})
            }
        }
    } else {
        response.json({isBanned: false, text: 'no admin roots'})
    }
})

app.post('/Exit', async (request, response) => {
    const user = JWTCom.DecodeJWT(request.body.token)
    const isExitTimeEstablished = TimeScripts.SetExitTime(client, user) 
    if (isExitTimeEstablished) {
        response.json({isExitTimeEstablished: true})
    } else {
        response.json({isExitTimeEstablished: false, text:'set-exit-time-error'})
    }
})

app.post('/SetLogoutReason', async (request, response) => {
    const isLogReasonSet = await TimeScripts.SetLogoutReason(client, request.body.logObject)
    if (isLogReasonSet) {
        response.json({isLogReasonSet: true})
    } else {
        response.json({isLogReasonSet: false})
    }
})