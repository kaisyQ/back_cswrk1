const md5 = require('md5')
const { SetLogoutReason } = require('./TimeScripts')

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
            if (editUser.rows[0].user_role_id === 1) {
                return null
            } else {
                const res = await client.query(`UPDATE Users SET role_id = 2 WHERE '${user.email}'`)
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

    async GetOfficeTitle(client, officeId) {
        try {
            const officeTitle = await client.query(`SELECT * FROM offices WHERE office_id = ${officeId}`)
            return officeTitle.rows[0].title
        } catch (error) {
            return false
        }
    }
    async BanDefaultUser(client, user) {
        try {
            const isUserBanned = await client.query(`UPDATE users SET active = 0 WHERE email = '${user.email}';`)
            return true
        } catch (error) {
            return false
        }
    }

    async UnBanDefaultUser(client, user) {
        try {
            const isUserBanned = await client.query(`UPDATE users SET active = 1 WHERE email = '${user.email}';`)
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
    async GetManageFlightData(client) {
        try {
            const resultData = []
            const shedules = (await client.query(`select * from shedules`)).rows
            const routes = (await client.query(`select * from routes`)).rows
            const aircrafts = (await client.query(`select * from aircrafts`)).rows
            const airports = (await client.query(`select * from airports`)).rows
            for(let shedule of shedules) {
                const objectToPushIntoResultData = { 
                    shedule_id: shedule.shedule_id,
                    shedule_date: shedule.shedule_date,
                    shedule_time: shedule.shedule_time,
                    eco_price: shedule.eco_price,
                    flight: shedule.flight,
                    confirmed: shedule.confirmed
                }
                for(let aircraft of aircrafts) {
                    if (shedule.shedule_aircraft_id === aircraft.aircraft_id) {
                        objectToPushIntoResultData.aircraft_name = aircraft.aircraft_name
                        objectToPushIntoResultData.make_model = aircraft.make_model 
                        objectToPushIntoResultData.total_seats = aircraft.total_seats  
                        objectToPushIntoResultData.eco_seats = aircraft.eco_seats
                        objectToPushIntoResultData.bus_seats = aircraft.bus_seats
                        break
                    }
                  }
                for(let route of routes) {
                    if (shedule.shedule_route_id === route.route_id) {
                        objectToPushIntoResultData.flight_time = route.flight_time
                        objectToPushIntoResultData.distance = route.distance 
                    }
                    for(let airport of airports) {
                        if (route.departure_id === airport.airport_id) {
                            objectToPushIntoResultData.departure_airport = {
                                airport_country_id: airport.airport_country_id,
                                iata: airport.iata,
                                airport_name: airport.airport_name
                            }
                        }
                        if (route.arrival_id === airport.airport_id) {
                            objectToPushIntoResultData.arrival_airport = {
                                airport_country_id: airport.airport_country_id,
                                iata: airport.iata,
                                airport_name: airport.airport_name
                            }
                        }
                    }
                }
                resultData.push(objectToPushIntoResultData)
            }
            return resultData

        } catch (error) {
            console.log(error)
            return false
        }
    }

    async GetAllAirports(client) {
        try {
            const airports = (await client.query(`select * from airports`)).rows
            return airports
        } catch (error) {
            console.log(error)
            return false
        }
    }

    async EditFlightConfirmed(client, objectToChange, n) {
        try {
            const cancelFlight = await client.query(`UPDATE shedules SET confirmed = ${n} WHERE shedule_id = ${objectToChange.flightNumber} AND shedule_date = '${objectToChange.date}' AND shedule_time = '${objectToChange.time}'`)
            return true
        } catch (error){
            console.log(error)
            return false
        }
    }
    async EditFlight(client, objectToEditFlight) {
        try {
            const fromAirportId = (await client.query(`select * from airports where iata = '${objectToEditFlight.from}'`)).rows[0].airport_id
            const ToAirportId = (await client.query(`select * from airports where iata = '${objectToEditFlight.to}'`)).rows[0].airport_id
            const routeId = (await client.query(`select * from routes where departure_id = ${fromAirportId} and arrival_id = ${ToAirportId}`)).rows[0].route_id
            const updateFlight = await client.query(`update shedules set shedule_date = '${objectToEditFlight.date}', shedule_time = '${objectToEditFlight.time}', eco_price = ${objectToEditFlight.price} where shedule_route_id = ${routeId} `)
            return true
        } catch (error){
            console.log(error)
            return false
        }
    }
}

module.exports = new DbCommands()
