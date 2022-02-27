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
        const OfficeId = await client.query(`SELECT * FROM Offices WHERE title = '${user.OfficeName}'`)
        const insertUser = await client.query(`
                    INSERT INTO Users (email, firstname, lastname, user_office_id, birthDate, password) VALUES
                        ('${user.email}', '${user.firstname}', '${OfficeId.rows[0].id}', '${GetBirthDateString(user.birthdate)}', '${md5(user.password)}')
                        `) 
        return insertUser
    }

    async EditRole(client, user) {
        const editUser = await client.query(`SELECT * FROM Users WHERE email = '${user.email}'`);

        if (editUser.rows[0].role_id === 1) {
            // Ошибка ! Админ не может менять роль Админа 
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
}



module.exports = new DbCommands()
