<template>
    <v-container fluid d-flex class="pr-0">
        <!--<router-link to="/">Home</router-link>-->
        <!--<router-link to="/about">About</router-link>-->
        <v-toolbar-items>
            <v-btn text to="/" :ripple="false">Home</v-btn>
            <v-btn text to="/login" :ripple="false">Login</v-btn>
        </v-toolbar-items>
    </v-container>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import auth from '../store/modules/AuthModule'

@Component
export default class AppHeader extends Vue {
  public get isAuthenticated (): boolean {
    return auth.isAuthenticated
  }

  public async logout (): Promise<void> {
    await auth.logout()
    await this.$router.push('login')
  }
}
</script>

<style scoped lang="scss">
.v-btn:before {
    background-color: transparent;
}
</style>
