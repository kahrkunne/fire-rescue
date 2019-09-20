<template>
  <div>
    <div style="text-align: center">
      <h1 class="title" style="margin-bottom: 2px">
        Deploying
      </h1>
    </div>
    <div v-if="ok_deploy" class="has-text-centered">
      Units remaining: {{num_u}}/{{max_units}}
    </div>

    <div>
      <div class="columns">
        <div class="column" v-for="k in $store.state.unit_names" :key="`unitinfo_${k}`" style="text-align:center">
          <div style="display:inline-block">

            <template v-if="!ok_deploy">
              <b>Unit {{k}}</b><br>
            </template>
            <button v-else
                    class="button full-width"
                    :class="{'is-primary': current_unit == k}"
                    @click="current_unit = k">
              <b>Unit {{k}}</b>
            </button>

            <template v-for="a in ['hitpoints','speed','attack']">
              <form class="form-inline">
                <label for="k + a" style="width: 100px">{{a}}</label>
                <input v-if="!ok_deploy"
                       type="number"
                       v-model.number="unit_data[k][a]"
                       :min="a == 'hitpoints' ? 1 : 0"
                       >
                <span v-else>{{unit_data[k][a]}}</span>
              </form>
            </template>

            <div class="has-text-centered" v-if="!ok_deploy">
              Total Points: <span :style="{'color': points(k) == max_points ? 'green' : 'red'}">{{points(k)}}</span>/{{max_points}}<br>
            </div>
          </div>
        </div>
      </div>
    </div>
    <hr>

    <div class="has-text-centered" v-if="!ok_deploy">
      <button class="button" :disabled="!ok_units" @click="position">
        {{positioning ? 'Waiting for other player...' : 'Finalize Units'}}
      </button>
    </div>
    <div class="has-text-centered" v-else>
      <button class="button" :disabled="!ok_position" @click="battle">{{waiting_battle ? 'Waiting for other player' : 'Battle!'}}</button>
    </div>

    <div v-if="ok_deploy" class="has-text-centered">
      <hr>
      <div class="table is-bordered battlefield" style="display: inline-block; height: 100%; width: 1000px;">
        <table>
          <tbody>
            <tr v-for="(row,i) in position_grid" :key="`gridrow_${i}`">
              <td v-for="(cell,j) in row" :key="`gridcell_${j}`"
                  @click="place_unit(i,j)"
                  @contextmenu.prevent="remove_unit(i,j)">
                <div class="content content-deploy">
                  {{cell}}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="ok_deploy">
      <hr>
      <div class="columns">
        <div class="column" v-for="k in $store.state.enemy_unit_names" :key="`enemy_unitinfo${k}`" style="text-align: center">
          <div style="display:inline-block">
          <b>Enemy Unit {{k}}</b><br>
          <template v-for="a in ['hitpoints','speed','attack']">
            <form class="form-inline">
              <label for="k + a" style="width: 100px">{{a}}</label>
              <span>
              {{$store.state.enemy_units[k][a]}}
              </span>
            </form>
          </template>
        </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
 export default {
   data() {
     let unit_data = {}
     let position_grid = []
     for(var i=0; i < 3 + this.$store.state.player_number; i++){
       position_grid.push(Array(this.$store.state.grid_dimensions[0]).fill(null))
     }
     this.$store.state.unit_names.forEach((key) => {
       unit_data[key] = Object.assign({}, this.$store.state.units[key])
     })

     return {
       max_points: this.$store.state.max_points,
       max_units: this.$store.state.max_units,
       unit_data,
       position_grid,
       positioning: false, // Are we currently positioning?
       num_u: 15, // Units left to position
       current_unit: this.$store.state.unit_names[0], // Currently active unit
       waiting_battle: false
     }
   },
   methods: {
     battle(){
       var army = []
       this.position_grid.forEach((row, i) => {
         row.forEach((cell, j) => {
           if (cell) {
             // (i,j) = (row from the top, column from the left)
             // We need to convert this to (row from bottom, column from left)
             var pnum = this.$store.state.player_number
             var unit = {
               hitpoints: this.unit_data[cell].hitpoints * 3,
               location: [i + this.$store.state.grid_dimensions[0] - 3 - this.$store.state.player_number, j],
               type: cell,
               moves: Math.ceil(this.unit_data[cell].speed / 2),
               can_attack: true
             }
             if (this.$store.state.player_number == 1) {
               unit.moves = Math.ceil(unit.moves / 2)
             }
             army.push(unit)
           }
         })
       })
       this.$store.commit('do_battle', army)
       this.waiting_battle = true
     },
     points(k) {
       return this.unit_data[k].hitpoints + this.unit_data[k].speed + this.unit_data[k].attack
     },
     position() {
       this.$store.state.unit_names.forEach((key) => {
         this.$store.commit('change_unit', {key, value: this.unit_data[key]})
       })
       this.$store.commit('confirm_units')
       this.positioning = true
     },
     place_unit(i,j){
       if (this.num_u > 0 && this.position_grid[i][j] == null) {
         this.$set(this.position_grid[i], j, this.current_unit)
         this.num_u--
       }
     },
     remove_unit(i,j){
       let u = this.position_grid[i][j]
       if (u != null) {
         this.$set(this.position_grid[i], j, null)
         this.num_u++
       }
     }
   },
   computed: {
     ok_deploy (){
       return this.positioning && !this.$store.state.unit_wait
     },
     ok_position() {
       return this.num_u == 0
     },
     ok_units() {
       let is_ok = true
       this.$store.state.unit_names.forEach((key) => {
         if (this.points(key) != 30 || this.unit_data[key].hitpoints < 1){
           is_ok = false
         }
       })
       return is_ok
     }
   }
 }
</script>
