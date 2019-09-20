<template>
  <div>
    Main Menu
    <br>
    <button class="button" @click="setup_connection" :disabled="$store.state.connection_status == false">{{$store.state.connection_status == false ? 'Waiting...' : 'Connect!'}}</button>
  </div>
</template>
<script>
 export default {
   methods: {
     handle_message(msg) {
       this.$store.commit('handle_connection', msg)
     },
     setup_connection(){
       var connection = new WebSocket('ws://82.74.62.223:8081')
       connection.onopen = () => {
         connection.onmessage = this.handle_message
         this.$store.commit('setup_connection', connection)
         connection.send(JSON.stringify({type:'enqueue'}))
       }
     },
   }
 }
</script>
<style>
</style>
