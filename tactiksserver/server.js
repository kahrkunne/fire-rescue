let port = 8081
let webSocketServer = require('websocket').server
let http = require('http')

let clients = []
let waiting

let server = http.createServer()
server.listen(port, () => console.log(`${new Date()} - Listening on port ${port}.`))

let wsServer = new webSocketServer({
    httpServer: server
})

let send = (conn, msg) => conn.send(JSON.stringify(msg))

function message_handler(conn) {
    return (message) => {
    let msg = JSON.parse(message.utf8Data)
        if (!(msg.type == 'enqueue' || conn.enemy)) return
        if (msg.type == 'enqueue') {
            if (waiting && waiting.tactiks_id != conn.tactiks_id) {
                conn.enemy = waiting
                waiting.enemy = conn
                waiting = null
                send(conn, {'type': 'game_start', 'player_number':1})
                send(conn.enemy, {'type': 'game_start', 'player_number':2})
            } else {
                waiting = conn
                send(conn, {'type':'enqueued'})
            }
        } else if (msg.type == 'confirm_units' || msg.type == 'confirm_army') {
            let type = {'confirm_units':'units','confirm_army':'army'}[msg.type]
            conn[type] = msg[type]
            let enemy = conn.enemy
            let enemy_data = enemy[type]
            if (enemy_data) {
                let response = {type:msg.type}
                response[type] = msg[type]
                send(enemy, response)
                response[type] = enemy_data
                send(conn, response)
            }
        } else if (msg.type == 'move') {
            send(conn.enemy, msg)
        } else if (msg.type == 'next_turn') {
            send(conn, {type:'next_turn'})
            send(conn.enemy, {type:'next_turn'})
        } else console.log(`Unexpected message: ${msg}`)
    }
}

wsServer.on('request', (request) => {
    console.log(`${new Date()} - Connection from ${request.origin}.`)

    let connection = request.accept(null, request.origin)
    let index = clients.push(connection) - 1
    connection.tactiks_id = index

    connection.on('message', message_handler(connection))
    connection.on('close', () => {
        console.log(`Disconnecting id ${connection.tactiks_id}!`)
        clients.splice(connection.tactiks_id, 1)
        if (waiting && waiting.tactiks_id == connection.tactiks_id) waiting = null
        if (connection.enemy) {
            let enemy = connection.enemy
            clients.splice(enemy.tactiks_id, 1)
            enemy.send(JSON.stringify({type:'disconnect'}))
            console.log(`Disconnecting id ${enemy.tactiks_id}!`)
            delete enemy.army
            delete enemy.units
            delete enemy
            delete connection.army
            delete connection.units
            delete connection
        }
    })
})
