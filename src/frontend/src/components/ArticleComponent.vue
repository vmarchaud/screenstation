<template>
    <v-hover v-slot:default="{ hover }">
        <v-card class="mx-auto mb-3" max-width="370" :elevation="hover ? 12 : 2">
            <v-card-title class="purple font-weight-light subtitle-1">
                <div>{{ article.id }}</div>
            </v-card-title>

            <v-card-text>
                <v-item-group v-model="toggle">
                    <!-- Title ----------------------------------------------------------------- -->
                    <v-item v-slot:default="{ active: editMode, toggle }">
                        <v-container :class="{ orange: editMode }">
                            <v-row no-gutters v-if="!editMode">
                                <v-col class="headline text--primary">{{ article.description }}</v-col>
                                <v-col cols="1">
                                    <edit-button :show="hover" @click="onEdit('Description')"></edit-button>
                                </v-col>
                            </v-row>
                            <!-- EDIT -->
                            <v-row no-gutters v-if="isActive && editMode" class="mb-2">
                                <v-col cols="12" class="py-0">
                                    <v-text-field
                                        v-model="tempArticle.description"
                                        label="Description*"
                                        required
                                        autofocus
                                        @keyup.esc="onCancel"
                                        @keyup.enter="onSave"
                                    ></v-text-field>
                                </v-col>
                                <v-col cols="12">
                                    <v-btn small class="mx-2" @click="onCancel">Cancel</v-btn>
                                    <v-btn small color="primary" class="mx-2" @click="onSave">Save</v-btn>
                                </v-col>
                            </v-row>
                        </v-container>
                    </v-item>
                    <!-- Price ----------------------------------------------------------------- -->
                    <v-item v-slot:default="{ active: editMode, toggle }">
                        <v-container :class="{ orange: editMode }">
                            <v-row no-gutters v-if="!editMode">
                                <v-col class="font-weight-bold">
                                    {{ article.price }}
                                </v-col>
                                <v-col cols="1">
                                    <edit-button :show="hover" @click="onEdit('Price')"></edit-button>
                                </v-col>
                            </v-row>
                            <!-- EDIT -->
                            <v-row no-gutters v-if="isActive && editMode" class="mb-2">
                                <v-col cols="12" class="py-0">
                                    <v-text-field
                                        v-model="tempArticle.price"
                                        label="Description*"
                                        required
                                        autofocus
                                        @keyup.esc="onCancel"
                                        @keyup.enter="onSave"
                                    ></v-text-field>
                                </v-col>
                                <v-col cols="12">
                                    <v-btn small class="mx-2" @click="onCancel">Cancel</v-btn>
                                    <v-btn small color="primary" class="mx-2" @click="onSave">Save</v-btn>
                                </v-col>
                            </v-row>
                        </v-container>
                    </v-item>
                </v-item-group>
            </v-card-text>

            <!-- class="justify-end" -->
            <v-card-actions v-if="!addMode">
                <!-- router-link mit 'to' würde auch gehen -->
                <v-btn text color="deep-purple accent-4" :to="`/article/${article.id}`">
                    More...
                </v-btn>
                <v-spacer></v-spacer>
                <v-icon @click="$emit('delete-item', article.id)" class="on-hover" :class="{ 'on-hover__show': hover }">
                    mdi-trash-can
                </v-icon>
            </v-card-actions>
            <v-card-actions v-else>
                <v-btn text color="deep-purple accent-4" @click="$emit('cancel')">
                    Cancel
                </v-btn>
                <v-btn color="deep-purple accent-4 primary" @click="$emit('save-item')">
                    Save
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-hover>
</template>

<script lang="ts">
import EditButton from '@/components/EditButton.vue';
import { Article } from '@/model/Article';
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';

interface Section {
    Undefined: number;
    Description: number;
    Price: number;
}

type EditSection = keyof Section;
@Component({ components: { EditButton } })
export default class ArticleComponent extends Vue {
    private static readonly sections: Section = {
        Undefined: -1,
        Description: 0,
        Price: 1,
    };

    @Prop({ default: '' })
    private article: Article | undefined;

    @Prop({ default: false })
    private addMode!: boolean;

    /**
     * Wenn in der Artikelliste der jeweilige (dieser) Artikel angeklickt wurde
     */
    @Prop({ default: false })
    private isActive!: boolean;

    /**
     * Definiert welches Element aktiv ist
     */
    private toggle: number = -1;

    private tempArticle: Article | '' = '';

    @Watch('isActive')
    private onIsActiveChanged(val: boolean, _: boolean): void {
        if (!val) {
            this.toggle = -1;
        }
    }

    // noinspection JSUnusedLocalSymbols
    private onEdit(section: EditSection): void {
        this.tempArticle = Object.assign(this.tempArticle, this.article);

        if (!this.isActive) {
            this.$emit('activate');
        }

        this.toggle = ArticleComponent.sections[section];
    }

    // noinspection JSUnusedLocalSymbols
    private onCancel(): void {
        this.tempArticle = '';
        this.$emit('activate', false);
    }

    // noinspection JSUnusedLocalSymbols
    private onSave(): void {
        this.article = Object.assign(this.article, this.tempArticle);
        this.tempArticle = '';
        this.$emit('activate', false);
    }
}
</script>

<style scoped lang="scss"></style>
