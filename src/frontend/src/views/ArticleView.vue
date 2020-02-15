<template>
    <v-container class="about stretch" justify="start">
        <h1 class="display-2">Article</h1>
        <p>ID: {{ $route.params.id }}</p>
        <p>Description: {{ forID().description }}</p>
    </v-container>
</template>
<script lang="ts">
import { Article } from '@/model/Article';
import { Component, Vue } from 'vue-property-decorator';
import crudModule from '../store/modules/CrudModule';

@Component({ components: {} })
export default class ArticleView extends Vue {
    private get articles(): readonly Article[] {
        return crudModule.articles;
    }

    public forID(): Article {
        const id = this.$route.params.id;
        const found = this.articles.find((article) => article.id === id);
        if (!found) {
            throw new Error(`Article with ID '${id}' is not in list!`);
        }
        return found;
    }
}
</script>
<style lang="scss"></style>
