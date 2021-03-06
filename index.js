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
            let logout = '**'
            if (userLogs[i].logout) {
                logout = userLogs[i].logout
            }
            resultUserLogs.push({
                logsDate: userLogs[i].log_date,
                loginTime: userLogs[i].login,
                LogoutTime: logout,
                logoutReason: userLogs[i].logout_reason
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
                i--
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
        const userToBan = DBScripts.BanDefaultUser(client, request.body.userToBan)
        if (userToBan) {
            response.json({isBanned: true, text: 'user successfully banned'})
        } else {
            response.json({isBanned: false, text: 'ban-error'})
        }
    } else {
        response.json({isBanned: false, text: 'no admin roots'})
    }
})
app.post('/unBanUser', async (request, response) => {
    const user = JWTCom.DecodeJWT(request.body.token)
    if (user.user_role_id === 1) {
        const isUserUnBanned = await DBScripts.UnBanDefaultUser(client, request.body.userToUnBan)
        if (isUserUnBanned) {
            response.json ({isUserUnBanned : true, text: 'OK'})
        } else {
            response.json ({isUserUnBanned : false, text: 'err'})
        }
    } else {
        response.json ({isUserUnBanned : false, text: 'err'})
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

app.post('/GetManageFlightData', async (request, response) => {
    try {
        const user = JWTCom.DecodeJWT(request.body.token)
        const manageFlightData = await DBScripts.GetManageFlightData(client)
        if (manageFlightData) {
            response.json({text: 'OK', isManageFlightDataTaken: true, manageFlightData: manageFlightData})
        } else {
            response.json({text: 'query error', isManageFlightDataTaken: false})
        }

    } catch (error) {
        console.log(error)
        response.json({text: 'error', isManageFlightDataTaken: false})
    }

})

app.post('/GetManageAirports', async (request, response) => {
    try {
        const user = JWTCom.DecodeJWT(request.body.token)
        const airports = await DBScripts.GetAllAirports(client)
        if (airports) {
            response.json({text: 'OK', isAirportsTaken: true, airports: airports})
        } else {
            response.json({text: 'error', isAirportsTaken: false})
        }
    } catch (error) {
        console.log(error)
        response.json({text: 'error', isAirportsTaken: false})
    }
})

app.post('/SheduleEdit', async (request, response) => {
    try {
        const user = JWTCom.DecodeJWT(request.body.token)
        console.log(request.body.objectToCancelFlight)
        const isSheduleEdited = await DBScripts.EditFlightConfirmed(client, request.body.objectToCancelFlight, request.body.num)
        if (isSheduleEdited) {
            response.json ({text: 'OK', isSheduleEdited: true})
        } else {
            response.json ({text: 'error', isSheduleEdited: false})
        }
    } catch (error) {
        console.log(error)
        response.json({text: 'error', isSheduleEdited: false})
    }
})

app.post('/EditFlight', async (request, response) => {
    try {
        const user = JWTCom.DecodeJWT(request.body.token)
        const editFlight = await DBScripts.EditFlight(client, request.body.objectToEditFlight)
        if (editFlight) {
            response.json({text: 'OK', isFlightEdited: true})
        } else {
            response.json({text: 'error', isFlightEdited: false})
        }
    } catch (error) {
        console.log(error)
        response.json({text: 'error', isFlightEdited: false})
    }
})

app.post('/GetCountries', async (request, response) => {
    try {
        const user = JWTCom.DecodeJWT(request.body.token)
        const countries = await DBScripts.GetAllCountries(client)
        if (countries) {
            response.json({text: 'OK', isCountriesTaken: true, countries: countries})
        } else {
            response.json({text: 'error', isCountriesTaken: false})
        }
    } catch (error) {
        console.log(error)
        response.json({text: 'error', isCountriesTaken: false})
    }
})

app.post('/sendAnswer', async (request, response) => {
    try {
        const isUserSaved = await DBScripts.SaveAnswer(client, request.body)
        if(isUserSaved) {
            const allAns = await DBScripts.GetAllAsnwers(client)
            response.json({text: 'OK', isAnswersSaved: true, answers: allAns})
        } else {
            response.json({text: 'error', isAnswersSaved: false})
        }
    } catch (error) {
        console.log(error)
        response.json({text: 'error', isAnswersSaved: false})
    }
})

app.get('/getAnswers', async (request, response) => {
   try{
    const allAns = await DBScripts.GetAllAsnwers(client)
    if(allAns) {
        response.json({text: 'OK', isAnswersTaken: true, answers: allAns})
    } else {
        response.json({text: 'error', isAnswersTaken: false})
    }
   } catch(error) {
        response.json({text: 'error', isAnswersTaken: false})
   }
})