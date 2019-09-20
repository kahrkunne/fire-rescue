import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
    state: {
        unit_names: ['A','B','C'],
        enemy_unit_names: ['X','Y','Z'],
        max_points: 30,
        max_units: 15,
        grid_dimensions: [12,12],
        game_state: 'mainmenu',
        player_number: 1,
        units: {A:{hitpoints:10, speed:10, attack:10},
                B:{hitpoints:10, speed:10, attack:10},
                C:{hitpoints:10, speed:10, attack:10}},
        army: [], // format: {hitpoints, location: [i,j], type, moves, can_attack}
        enemy_units: {},
        enemy_army: [],
        moves: [[]], // format: {move_type, move_tile: [x,y]}
        connection: null,
        connection_status: null,
        deploy_wait: true,
        unit_wait: true,
        turn: 1
    },
    mutations: {
        end_turn(state) {
            state.connection.send(JSON.stringify({type:'next_turn'}))
        },
        confirm_units(state) {
            state.connection.send(JSON.stringify({type: 'confirm_units', units: state.units}))
        },
        setup_connection(state, connection){
            state.connection = connection
        },
        handle_connection(state, message){
            var msg = JSON.parse(message.data)
            console.log(msg)
            if (msg.type == 'disconnect') {
                state.connection_status = null
                state.game_state = 'mainmenu'
            } else if (msg.type == 'enqueued') {
                state.connection_status = false
            } else if (msg.type == 'game_start') {
                state.game_state = 'deploy'
                state.connection_status = true
                state.player_number = msg.player_number
            } else if (msg.type == 'confirm_units') {
                for(var i=0; i<3; i++) {
                    state.enemy_units[state.enemy_unit_names[i]] = msg.units[state.unit_names[i]]
                }
                state.unit_wait = false
            } else if (msg.type == 'confirm_army') {
                // TODO checking
                state.enemy_army = []
                msg.army.forEach((unit) => {
                    unit.type = state.enemy_unit_names[state.unit_names.indexOf(unit.type)]
                    unit.location[0] = state.grid_dimensions[0] - unit.location[0] - 1
                    unit.location[1] = state.grid_dimensions[1] - unit.location[1] - 1
                    state.enemy_army.push(unit)
                })
                state.game_state = 'battle'
            } else if (msg.type == 'move') {
                var move = msg
                move.origin[0] = state.grid_dimensions[0] - move.origin[0] - 1
                move.origin[1] = state.grid_dimensions[1] - move.origin[1] - 1
                move.target[0] = state.grid_dimensions[0] - move.target[0] - 1
                move.target[1] = state.grid_dimensions[1] - move.target[1] - 1
                state.moves[state.moves.length-1].push(move)
            } else if (msg.type == 'next_turn') {
                for (var a in [0,1]) {
                    var army = [state.army, state.enemy_army][a]
                    for (var ind in army) {
                        var unit = army[ind]
                        unit.moves = Math.ceil((state.units[unit.type] || state.enemy_units[unit.type]).speed / 2)
                        unit.can_attack = true
                    }
                }
                state.turn = state.turn + 1
            }
        },
        change_unit(state, value) {
            state.units[value.key] = value.value
        },
        do_battle(state, army) {
            state.army = army
            state.connection.send(JSON.stringify({type: 'confirm_army', army: army}))
        },
        register_move(state, move){
            state.moves[state.moves.length-1].push(move)
            state.connection.send(JSON.stringify({type: 'move', ...move}))
        },
    }
})
