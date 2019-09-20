<template>
  <div>
    <div style="text-align: center">
      <h1 class="title" style="margin-bottom: 2px">
        FIGHT!!
      </h1>
      <b>Turn {{$store.state.turn}}</b><br>
      <b>Player {{current_player}}</b><br>
      <button class="button" :disabled="!our_move" @click="end_turn">End Turn</button>
    </div>
    <hr>

    <div class="columns">

      <div class="column has-text-centered">
        <!-- maybe this should be some kind of component but I don't give a shit -->
        <h1 class="title" style="margin-bottom: 5px">You</h1>
        <span>Player {{$store.state.player_number}}</span><br>
        <span>Remaining Units: {{total_remaining($store.state.player_number)}}</span><br>
        <hr>
        <h1 class="subtitle" style="margin-bottom:5px">Units</h1>
        <div style="width: 100%; display:inline-block; margin-bottom: 10px;" v-for="n in $store.state.unit_names">
          <b> {{n}}</b><br>
          <div class="has-text-left" style="margin-right: 40%; margin-left:40%" v-for="k in ['attack', 'speed', 'hitpoints']">{{capitalize(k)}}: <b><span style="float:right;">{{$store.state.units[n][k]}}</span></b></div>
          <div class="has-text-left" style="margin-right: 40%; margin-left:40%">Remaining: <b><span style="float:right;">{{num_remaining(n)}}</span></b></div>
        </div>
      </div>

      <div class="battlefield has-text-centered column">
        <div class="table is-bordered" style="display: inline-block; height: 100%; width: 65em;">
          <table style="">
            <tbody>
              <tr v-for="(v, i) in $store.state.grid_dimensions[0]" :key="`gridrow_${i}`">
                <td v-for="(w, j) in $store.state.grid_dimensions[1]" :key="`gridcell_${j}`"
                    @click="handle_unit(i,j)"
                    @mouseover="current_path = path(current_unit.location,[i,j])"
                    :style="{'background-color': tile_color(i,j) }"
                >
                  <div class="content content-battle">
                    <template v-if="unit_at(i,j)">
                      <!-- TODO not actually centered -->
                      <b :style="{color: player(unit_at(i,j).type) == $store.state.player_number ? 'blue' : 'red' }">{{unit_at(i,j).type}}</b><br>
                      {{damage(unit_at(i,j))}} {{unit_at(i,j).hitpoints}}<br>
                      {{unit_at(i,j).moves}} {{unit_at(i,j).can_attack ? 'T' : 'F'}}
                    </template>
                    <template v-else-if="in_path(i,j)">
                      {{path_index(i,j)}}
                    </template>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div class="column has-text-centered">
        <!-- maybe this should be some kind of component but I don't give a shit -->
        <h1 class="title" style="margin-bottom: 5px">Them</h1>
        <span>Player {{$store.state.player_number == 1 ? 2 : 1}}</span><br>
        <span>Remaining Units: {{total_remaining($store.state.player_number + 1 % 2)}}</span><br>
        <hr>
        <h1 class="subtitle" style="margin-bottom:5px">Units</h1>
        <div style="width: 100%; display:inline-block; margin-bottom: 10px;" v-for="n in $store.state.enemy_unit_names">
          <b>{{n}}</b><br>
          <div class="has-text-left" style="margin-right: 40%; margin-left:40%" v-for="k in ['attack', 'speed', 'hitpoints']">{{capitalize(k)}}: <b><span style="float:right;">{{$store.state.enemy_units[n][k]}}</span></b></div>
          <div class="has-text-left" style="margin-right: 40%; margin-left:40%">Remaining: <b><span style="float:right;">{{num_remaining(n)}}</span></b></div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
 export default {
   data(){
     return {
       current_unit: this.$store.state.army[0],
       current_path: [],
       path_lengths: {},
       last_tiles: [[-1,-1],[-1,-1]]
     }
   },
   computed: {
     our_move (){
       return (this.current_player == this.$store.state.player_number)
     },
     current_player() {
       return (this.$store.state.turn % 2 == 1) ? 1 : 2
     },
     enemy_number(){
       return {1:2,2:1}[this.$store.state.player_number]
     }
   },
   created() {
     this.$watch(() => this.$store.state.moves[this.$store.state.moves.length - 1], () => {
       if (!this.our_move) {
         var cur_turn = this.$store.state.moves[this.$store.state.moves.length - 1]
         var last_move = cur_turn[cur_turn.length - 1]
         this.execute_move(last_move)
       }
     })
   },
   methods: {
     capitalize(str){
       return str.charAt(0).toUpperCase() + str.slice(1)
     },
     end_turn(){
       this.$store.commit('end_turn')
     },
     opponent_cheated(message){
       console.log('Opponent cheated! ' + message)
     },
     execute_move(move){
       // TODO move checking goes here
       var unit = this.unit_at(move.origin[0], move.origin[1])
       var cheat = ''
       if (this.player(unit.type) != this.enemy_number) {
         cheat = 'Not your piece!'
       } else if (!unit || move.origin[0] == -1 || move.target[0] < 0 || move.target[0] >= this.$store.state.grid_dimensions[0] || move.target[1] >= this.$store.state.grid_dimensions[1] || move.target[1] < 0) {
         // Source unit doesn't exist, is dead, or target doesn't exist
         cheat = 'Target or origin invalid!'
       }

       if (cheat) {this.opponent_cheated(cheat);return}


       if (move.action == 'move') {
         console.log('we movin')
         var path = this.path(move.origin, move.target, this.enemy_number)
         if (path.length - 1 > unit.moves) {
           cheat = 'Unit moved too far!'
         } else if (JSON.stringify(path[0]) != JSON.stringify(move.origin)) {

           cheat = 'Invalid path!'
         }
         if (cheat) {this.opponent_cheated(cheat);return}

         unit.location = move.target
       } else if (move.action == 'attack') {
         // TODO enemy checking
         if (!unit.can_attack) {
           cheat = "Unit can't attack!"
         } else if (!this.adjacent(move.origin, move.target)) {
           cheat = "Unit not next to attack target!"
         }
         if (cheat) {this.opponent_cheated(cheat);return}
         unit.can_attack = false
         var t = this.unit_at(move.target[0], move.target[1])
         t.hitpoints -= this.damage(unit)
         if (t.hitpoints <= 0) {
           t.location = [-1,-1]
         }
       }
       this.last_tiles = [move.origin, move.target]
     },
     adjacent(a,b){
       return (Math.abs(a[0]-b[0]) == 1 && a[1] == b[1]) || (Math.abs(a[1]-b[1]) == 1 && a[0] == b[0])
     },
     path_index(i,j){
       return this.current_path.map(JSON.stringify).indexOf(JSON.stringify([i,j]))
     },
     in_path(i,j){
       return this.current_path.some((p) => JSON.stringify(p) === JSON.stringify([i,j]))
     },
     tile_color(i,j){
       if (this.unit_at(i,j) === this.current_unit) {
         return 'green'
       } else if (this.in_path(i,j)) {
         if (this.current_path.length > 1 && this.current_path.length - 1 <= this.current_unit.moves && this.our_move){
           return 'green'
         } else {
           return 'red'
         }
       } else if (JSON.stringify([i,j]) == JSON.stringify(this.last_tiles[0])
                  || JSON.stringify([i,j]) == JSON.stringify(this.last_tiles[1])) {
         return 'LightBlue'
       } else {
         return ''
       }
     },
     path(fstart, fend, player=this.$store.state.player_number){
       if (fstart == null || fend == null) return
       var end = {x:fend[0],y:fend[1]}
       var start = {x:fstart[0], y:fstart[1]}
       var searched = {}
       var queue = [start]
       while (queue.length > 0) {
         var current = queue.shift()
         if (current.x == end.x && current.y == end.y) {
           end = current
           break
         }
         var movables = this.get_movables(current, player)
         movables.forEach((node) => {
           if (!searched[JSON.stringify([node.x,node.y])]){
             searched[JSON.stringify([node.x,node.y])] = true
             node.parent = current
             queue.push(node)
           }
         })
       }

       var path = []
       path.push([end.x,end.y])
       var next = end.parent
       while (next != null) {
         path.push([next.x, next.y])
         next = next.parent
       }

       return path.reverse()

     },
     can_move(f, t, player=this.$store.state.player_number) {
       if (Math.abs(f[0] - t[0]) + Math.abs(f[1] - t[1]) != 1) return false
       if (this.adjacent_enemy(f[0],f[1],player) && this.adjacent_enemy(t[0],t[1],player)) return false
       return true
     },
     adjacent_enemy(x,y, player=this.$store.state.player_number){
       var adj = false
       var neighbours = [[x-1,y],[x+1,y],[x,y+1],[x,y-1]]
       neighbours.forEach((s) => {
         if (this.unit_at(s[0],s[1]) && (this.player(this.unit_at(s[0],s[1]).type) != player)) {
           adj = true
         }
       })
       return adj
     },
     get_movables(node, player=this.$store.state.player_number) {
       var movables = []
       var neighbours = [[node.x-1,node.y],[node.x+1,node.y],[node.x,node.y+1],[node.x,node.y-1]]
       var d = this.$store.state.grid_dimensions
       for (var i in neighbours) {
         var n = neighbours[i]
         if (n[0] >= 0 && n[0] < d[0] && n[1] >= 0 && n[1] < d[1]
             && !this.unit_at(n[0],n[1])
             && this.can_move([node.x, node.y], n, player)){
           movables.push({x:n[0],y:n[1]})
         }
       }
       return movables
     },
     handle_unit(i,j){
       if (this.unit_at(i,j) && this.player(this.unit_at(i,j).type) == this.$store.state.player_number) {
         this.current_unit = this.unit_at(i,j)
       }
       if (!this.our_move) return

       if (this.unit_at(i,j)) {
         if (this.player(this.unit_at(i,j).type) == this.$store.state.player_number) {
           this.current_unit = this.unit_at(i,j)
         } else if(this.current_unit.can_attack && this.adjacent(this.current_unit.location, this.unit_at(i,j).location)) {
           this.current_unit.can_attack = false
           this.unit_at(i,j).hitpoints -= this.damage(this.current_unit)
           if (this.unit_at(i,j).hitpoints <= 0) {
             this.unit_at(i,j).location=[-1,-1]
           }
           this.last_tiles[0] = this.current_unit.location
           this.last_tiles[1] = [i,j]
           this.$store.commit('register_move', {action: 'attack', origin: this.current_unit.location,target: [i,j]})
         }
       } else if (this.current_unit && this.current_unit.moves >= this.current_path.length - 1) {
         this.current_unit.moves -= this.current_path.length - 1
         this.current_path = []
         this.$store.commit('register_move', {action: 'move', origin: this.current_unit.location, target: [i,j]})
         this.last_tiles = [this.current_unit.location, [i,j]]
         this.current_unit.location = [i,j]
       }
     },
     player(type){
       if (this.$store.state.units[type]) {
         return this.$store.state.player_number
       } else {
         return {1:2,2:1}[this.$store.state.player_number]
       }
     },
     damage(unit){
       var unit_type = this.$store.state.units[unit.type] || this.$store.state.enemy_units[unit.type]
       return parseInt(unit_type.attack * (unit.hitpoints / (3*unit_type.hitpoints)) * 100) / 100
     },
     total_remaining(player) {
       var units = player == this.$store.state.player_number ? this.$store.state.unit_names : this.$store.state.enemy_unit_names
       var n = 0
       units.forEach((key) => {
         // this is inefficient but I don't give a shit
         n += this.num_remaining(key)
       })
       return n
     },
     unit_at(i,j) {
       for (var a in [0,1]) {
         var army = [this.$store.state.army, this.$store.state.enemy_army][a]
         for (var ind in army) {
           var unit = army[ind]
           if (unit.location[0] == i && unit.location[1] == j){
             return unit
           }
         }
       }
       return undefined
     },
     num_remaining(type) {
       var n = 0
       for (var a in [0,1]) {
         var army = [this.$store.state.army, this.$store.state.enemy_army][a]
         for (var ind in army) {
           var unit = army[ind]
           if (unit.type == type && unit.location[0] != -1){
             n++
           }
         }
       }
       return n
     }
   }
 }
</script>
