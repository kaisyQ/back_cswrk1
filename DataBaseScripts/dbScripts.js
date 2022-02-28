const md5 = require('md5')

function GetBirthDateString(date) {
    let arrDate = date.split('/')
    let resDate = ''
    for (let i = arrDate.lenght - 1; i > 0; --i) {
        if (parseInt(arrDate[i]) < 10) {
            resDate += `0${arrDate[i]}`
        } else {
            resDate += arrDate[i]
        }
    }
    return resDate
}

class DbCommands {
    async GetUser(client, user) {
        const gtUser = await client.query(`SELECT * FROM users WHERE email = '${user.email}' AND pass = '${user.password}'`)
        return gtUser.rows[0]
    }

    async GetAllUsers(client) {
        const arrOfAllUsers = await client.query('SELECT * FROM Users')
        return arrOfAllUsers.rows
    }

    async AddUser(client, user) {
        const OfficeId = await client.query(`SELECT * FROM offices WHERE title = '${user.officeTitle}'`)
        const roleId = await client.query(`SELECT * FROM roles WHERE role_name = ${user.role}`)
        const insertUser = await client.query(`
                    INSERT INTO Users (user_role_id, email, firstname, lastname, user_office_id, birthdate, pass, active) VALUES
                        (${roleId.rows[0].role_id}, '${user.email}', '${user.firstname}', '${user.lastname}', '${OfficeId.rows[0].id}', '${GetBirthDateString(user.birthdate)}', '${user.password}', 1)
                        `)
        if (insertUser) {
            return true
        }
        return false
    }

    async EditRole(client, user) {
        const editUser = await client.query(`SELECT * FROM Users WHERE email = '${user.email}'`);

        if (editUser.rows[0].role_id === 1) {
            return null
        } else {
            const res = await client.query(`UPDATE Users SET role_id = 2`)
            return res
        }
    }

    async GetAllUserLogs(client, user) {
        const userLogs = await client.query(`SELECT * FROM logs WHERE user_id = ${user.user_id}`)
        return userLogs.rows
    }

    async BanDefaultUser(client, user) {
        const isUserBanned = await client.query(`UPDATE users SET active = 0 WHERE email = '${user.email}';`)
        if(isUserBanned) {
            return true
        } else {
            return false
        }
    }

    async GetLastUserLog(client, user) {
        const allUserLogs = await client.query (`SELECT * FROM logs WHERE user_id = ${user.user_id}`) 
        if (allUserLogs) {
            const lastLog = allUserLogs.rows[allUserLogs.rows.lenght - 1]
            return lastLog
        } else  {
            return false
        }
    }
}

module.exports = new DbCommands()
