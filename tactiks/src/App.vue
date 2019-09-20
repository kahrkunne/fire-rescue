<template>
  <div id="app">
    <main-menu v-if="$store.state.game_state == 'mainmenu'"></main-menu>
    <deploy v-else-if="$store.state.game_state == 'deploy'"></deploy>
    <battle v-else-if="$store.state.game_state == 'battle'"></battle>
    <end v-else-if="$store.state.game_state == 'end'"></end>
    <hr>
    <button class="button" :class="{'is-primary':debug}" @click="debug = !debug">Debug</button>

    <div v-if="debug">
      <plaintext>
      {{debug_output}}
      </plaintext>
    </div>

  </div>
</template>

<script>
 import Peer from 'peerjs';

 import mainmenu from './components/MainMenu.vue'
 import deploy from './components/Deploy.vue'
 import battle from './components/Battle.vue'
 import end from './components/End.vue'
export default {
   name: 'app',
   data(){
     return {
       debug: false,
       conn: null,
       peer: null,
       debug_string: 'no debug string'
     }
   },
   components: {
     'main-menu': mainmenu,
     'deploy': deploy,
     'battle': battle,
     'end': end
   },
   computed: {
     debug_output(){
       return JSON.stringify(this.$store.state, null, 2)
     }
   },
}
</script>

<style lang="scss">
 .table td {
   border: 1px solid #000000 !important;
   background-clip: padding-box;
 }
 .battlefield table {
   overflow-x: scroll;
   width: 100%;
 }
 .battlefield td{
   width: 8.33%;
   position: relative;
 }
 .battlefield td:after {
   content: '';
   display: block;
   margin-top: 100%;
 }
 .battlefield td .content {
   position: absolute;
   bottom: 0;
   left: 0;
   right: 0;
   text-align: center;
   padding: 0px;
 }

 .full-width {
   width: 100%;
 }

 .battlefield td .content-deploy {
   top: calc(50% - 0.5em);
 }

 .battlefield td .content-battle {
   top: calc(50% - 2em);
 }


</style>
