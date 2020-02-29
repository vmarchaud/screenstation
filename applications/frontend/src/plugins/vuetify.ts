import Vue from 'vue'
import Vuetify from 'vuetify/lib'
import colors from 'vuetify/lib/util/colors'

Vue.use(Vuetify)

export default new Vuetify({
  icons: {
    iconfont: 'mdi'
  },
  theme: {
    dark: false
  },
  themes: {
    light: {
      primary: '#673AB7',
      secondary: '#5c6bc0',
      accent: '#7986cb',
      error: '#ef5350',
      info: '#039be5',
      success: '#4CAF50',
      warning: '#fb8c00'
    },
    dark: {
      primary: colors.blue.lighten3
    }
  }
})
