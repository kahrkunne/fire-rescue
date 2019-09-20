<template>
  <div>
    Ending...
    <br>
    <button class="button" @click="$store.commit('change_gamestate', 'mainmenu')">Next</button>
  </div>
</template>
