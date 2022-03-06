const md5 = require('md5')

class DbCommands {
    async GetUser(client, user) {
        try {
            const gtUser = await client.query(`SELECT * FROM users WHERE email = '${user.email}' AND pass = '${user.password}'`)
            return gtUser.rows[0]
        } catch (error) {
            return false
        }
    }

    async GetAllUsers(client) {
        try {
            const arrOfAllUsers = await client.query('SELECT * FROM Users')
            return arrOfAllUsers.rows
        } catch (error) {
            return false
        }
    }

    async AddUser(client, user) {
        try {
            const OfficeId = await client.query(`SELECT * FROM offices WHERE title = '${user.officeTitle}'`)
            const insertUser = await client.query(`
                        INSERT INTO Users (user_role_id, email, firstname, lastname, user_office_id, birthdate, pass, active) VALUES
                            (2, '${user.email}', '${user.firstname}', '${user.lastname}', ${OfficeId.rows[0].office_id}, '${user.birthdate}', '${user.password}', 1)
                            `)
            return true
        } catch(error) {
            return false
        }
    }

    async EditRole(client, user) {
        try {
            const editUser = await client.query(`SELECT * FROM Users WHERE email = '${user.email}'`);
            if (editUser.rows[0].role_id === 1) {
                return null
            } else {
                const res = await client.query(`UPDATE Users SET role_id = 2`)
                return true
            }

        } catch (error) {
            return false
        }
    }

    async GetAllUserLogs(client, user) {
        const userLogs = await client.query(`SELECT * FROM logs WHERE user_id = ${user.user_id}`)
        return userLogs.rows
    }

    async BanDefaultUser(client, user) {
        try {
            const isUserBanned = await client.query(`UPDATE users SET active = 0 WHERE email = '${user.email}';`)
            return true
        } catch (error) {
            return false
        }
    }

    async GetLastUserLog(client, user) {
        try {
            const allUserLogs = await client.query (`SELECT * FROM logs WHERE user_id = ${user.user_id}`) 
            return true
        } catch (error) {
            return false
        }
    }
}

module.exports = new DbCommands()
