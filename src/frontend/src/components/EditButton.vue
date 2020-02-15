<template>
    <v-btn text icon class="on-hover" :class="{ 'on-hover__show': show }" @click="$emit('click')">
        <v-icon small>mdi-pencil</v-icon>
    </v-btn>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';

@Component
export default class EditButton extends Vue {
    // private readonly logger = loggerFactory.getLogger('<package>');

    @Prop({ default: true })
    private show!: boolean;
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss"></style>
