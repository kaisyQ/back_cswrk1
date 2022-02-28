const dbScripts = require('./dbScripts')

function getTime() {
    let timeString = ''
        const hours = (new Date).getHours()
        const minutes = (new Date).getMinutes()
        if (hours < 10) {
            timeString += `0${hours}` 
        } else {
            timeString += hours
        }
        timeString += ':'
        if (minutes < 10) {
            timeString += `0${minutes}` 
        } else {
            timeString += minutes
        }
        return timeString
}


class DbTimeScripts {
    async SetEnterTime(client, user) {
        const logObject = {
            user_id: user.user_id,
            log_date: (new Date()).toISOString().split('T')[0],
            login: getTime()
        }

        const insertLog = await client.query(`INSERT INTO logs (user_id, log_date, login) VALUES
            (${logObject.user_id}, '${logObject.log_date}', '${logObject.login}');`)
        if (insertLog) {
            return true
        } else {
            return false
        }
    }

    async SetExitTime(client, user) {
        const lastLog = dbScripts.GetLastUserLog(client, user)
        const isExitTimeEstablished = await client.query(`UPDATE logs SET logout = ${getTime()} WHERE log_id = ${lastLog.log_id}`)
        if (isExitTimeEstablished) {
            return true
        } else {
            return false
        }
    }

    async SetLogoutReason(client, logObject) {
        const setLogReason = await client.query(`UPDATE logs SET logout_reason = '${logObject.logoutReason}' WHERE log_id = ${logObject.logId}`)
        if (setLogReason) {
            return true
        } else {
            return false
        }
    }
}

module.exports = new DbTimeScripts()