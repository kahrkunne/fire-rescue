import Vue from 'vue'
import App from './App.vue'
import store from './store'
import VueRamda from 'vue-ramda'


import './../node_modules/bulma/css/bulma.css'
import './css/main.css'

Vue.config.productionTip = false
Vue.use(VueRamda)

new Vue({
  store,
  render: h => h(App)
}).$mount('#app')
