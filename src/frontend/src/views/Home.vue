<template>
    <!--
    The v-container component simply centers your content in the middle of the screen.
    If you add the fluid prop, your content will occupy the full width of the screen.
     -->
    <v-container class="home">
        <v-row>
            <v-col cols="12" align="center" justify="start">
                <img alt="Vue logo" class="logo" src="../assets/logo.png" />
            </v-col>
        </v-row>
        <HelloWorld msg="Welcome to Your Vue.js + TypeScript App" />
    </v-container>
</template>

<script lang="ts">
import HelloWorld from '@/components/HelloWorld.vue';
import { Component, Vue } from 'vue-property-decorator';

@Component({
    components: {
        HelloWorld,
    },
})
export default class Home extends Vue {}
</script>
<style lang="scss"></style>
