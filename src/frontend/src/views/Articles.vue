<template>
    <v-container class="about stretch" justify="start">
        <v-btn fixed dark fab bottom right color="pink" class="mb-10" @click="addItem">
            <v-icon>mdi-plus</v-icon>
        </v-btn>
        <h1 class="display-2 mb-3">Articles</h1>
        <div>
            <v-item-group class="grid-container">
                <v-item v-if="isInAddMode" v-slot:default="{ active, toggle }">
                    <ArticleComponent
                        :article="item"
                        :addMode="isInAddMode"
                        :class="{ 'light-purble lighten-3': active, 'full-width': isInAddMode }"
                        :isActive="active"
                        @activate="toggle"
                        @save-item="onSaveItem"
                        @cancel="onCancel"
                    ></ArticleComponent>
                </v-item>
                <v-item v-for="article in articles" :key="article.id" v-slot:default="{ active, toggle }">
                    <ArticleComponent
                        class="ml-2"
                        :article="article"
                        :class="{ 'light-green lighten-3': active }"
                        :isActive="active"
                        @activate="toggle"
                        @delete-item="onDelete"
                    ></ArticleComponent>
                </v-item>
            </v-item-group>
        </div>
    </v-container>
</template>
<script lang="ts">
import ArticleComponent from '@/components/ArticleComponent.vue';
import { Article } from '@/model/Article';
import { LoggerFactory } from '@mmit/logging';
import uuid from 'uuid';
import { Component, Vue } from 'vue-property-decorator';
import crudModule from '../store/modules/CrudModule';

@Component({ components: { ArticleComponent } })
export default class Articles extends Vue {
    private readonly logger = LoggerFactory.getLogger('views.Articles');

    public get articles(): readonly Article[] {
        return crudModule.articles;
    }

    private changes = 0;

    // Reaktives property darf NICHT undefined sein und darf nicht mit einem _ beginnen
    private item: Article | '' | undefined = '';

    protected get isInAddMode(): boolean {
        return typeof this.item === 'object';
    }

    public addItem(): void {
        this.item = { id: uuid.v4(), description: `Change me ${this.changes}`, price: 0 };
        this.changes++;
        // this.$forceUpdate();
    }

    // noinspection JSUnusedLocalSymbols
    private onSaveItem(): void {
        if (this.item) {
            crudModule.add({ ...this.item });
        }
        this.item = undefined;
    }

    // noinspection JSUnusedLocalSymbols
    private onCancel(): void {
        this.logger.info('Cancel');
        this.item = undefined;
    }

    // noinspection JSUnusedLocalSymbols
    private onDelete(id: string): void {
        this.logger.info(`Delete ITEM: ${id}`);
        crudModule.delete(id);
    }

    // noinspection JSUnusedLocalSymbols
    private onTestClick(id: string): void {
        this.logger.info(`Test-Click`);
    }
}
</script>
<style lang="scss">
.grid-container {
    /*display: grid;*/
    /*grid-template-columns: 1fr 1fr 1fr;*/
    /*grid-template-rows: 1fr 200px;*/
    /*grid-column-gap: 20px;*/
    /*grid-row-gap: 20px;*/
    /*justify-items: stretch;*/
    /*align-items: start;*/

    display: grid;
    grid-gap: 10px;
    // grid-template-columns: repeat(auto-fit, 300px);
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));

    justify-items: stretch;
    align-items: start;

    .full-width {
        grid-column: 1 / -1;
    }
}
</style>
