<template>
    <v-container class="home">
        <v-row>
            <v-col cols="12" align="center" justify="start">
                <ViewList></ViewList>
            </v-col>
        </v-row>
    </v-container>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import ViewList from '@/components/ViewList.vue'

@Component({ components: { ViewList } })
export default class Home extends Vue {}
</script>
<style lang="scss"></style>
