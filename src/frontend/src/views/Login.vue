<template>
    <v-container class="login fill-height" fluid>
        <v-row align="center" justify="center">
            <v-col cols="12" sm="6" md="4">
                <v-card class="mt-n8">
                    <v-toolbar color="primary" dark flat>
                        <v-toolbar-title>Login form</v-toolbar-title>
                        <v-spacer></v-spacer>
                    </v-toolbar>
                    <v-card-text>
                        <v-form>
                            <v-text-field
                                v-model="username"
                                label="Login"
                                name="login"
                                prepend-icon="person"
                                type="text"
                                autofocus
                            ></v-text-field>

                            <v-text-field
                                v-model="password"
                                id="password"
                                label="Password"
                                name="password"
                                prepend-icon="lock"
                                type="password"
                                autocomplete
                            ></v-text-field>
                        </v-form>
                    </v-card-text>
                    <v-card-actions>
                        <v-spacer></v-spacer>
                        <v-btn color="primary" @click="onLogin" :disabled="loading">Login</v-btn>
                    </v-card-actions>
                </v-card>
                <p class="mt-4 font-weight-light">
                    Username: `guest4@shiro.at`
                    <br />
                    Password: `guest123B?`
                </p>
            </v-col>
        </v-row>
    </v-container>
</template>

<script lang="ts">
import { Credential } from '@/store/modules/AuthModule';
import { LoggerFactory } from '@mmit/logging';
import { Component, Vue } from 'vue-property-decorator';
import { namespace } from 'vuex-class';

// Weitere Infos:
//      https://medium.com/@fernalvarez/level-up-your-vuejs-project-with-typescript-part-3-vuex-7ad6333db947
//      https://github.com/ktsn/vuex-class
const authModule = namespace('authModule');

@Component
export default class Login extends Vue {
    private readonly logger = LoggerFactory.getLogger('views.Login');

    private loading: boolean = false;
    private username: string = '';
    private password: string = '';

    @authModule.Action
    private login!: (payload: Credential) => Promise<boolean>;

    public async onLogin(): Promise<void> {
        this.logger.info(`Username: ${this.username}, PW: ${this.password}`);

        this.loading = true;
        const success = await this.login({ username: this.username, password: this.password });
        this.loading = false;
        if (success) {
            await this.$router.push('home');
        }
    }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss"></style>
