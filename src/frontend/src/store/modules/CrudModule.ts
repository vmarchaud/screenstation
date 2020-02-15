import { Article } from '@/model/Article';
// import { LoggerFactory } from '@mmit/logging';
import { Action, getModule, Module, Mutation, VuexModule } from 'vuex-module-decorators';
import store from '../index';

@Module({ dynamic: true, namespaced: true, name: 'crudModule', store })
class CrudModule extends VuexModule {
    // private readonly logger = LoggerFactory.getLogger('store.CrudModule');

    private readonly _articles: Article[] = [
        { id: 'f17056e7-9e5b-4191-aea2-79a3378f6723', description: 'First Article', price: 123.4 },
        { id: '6d371111-fc6b-43b1-88ee-999e164d0dd6', description: 'Second Article', price: 99 },
    ];

    public get articles(): readonly Article[] {
        return this._articles;
    }

    // action 'add' commits mutation '_add' when done with return value as payload
    // Action kann nur EINEN Parameter haben - Payload!
    @Action({ commit: '_add' })
    public async add(article: Article): Promise<Article> {
        return article;
    }

    @Action({ commit: '_update' })
    public async update(article: Article): Promise<Article> {
        return article;
    }

    @Action({ commit: '_delete' })
    public async delete(id: string): Promise<number> {
        const index = this._articles.findIndex((article) => article.id === id);

        if (index === -1) {
            throw new Error(`Article with ID '${id}' is not available!`);
        }
        return index;
    }

    // - Keep all the Mutations private - we don't want to call Mutations directly -----------------

    @Mutation
    private _add(article: Article): void {
        this._articles.push(article);
    }

    @Mutation
    private _update(article: Article): void {
        const index = this._articles.findIndex((item) => item.id === article.id);

        if (index === -1) {
            throw new Error(
                `Article with ID '${article.id}' not in list - so it can't be updated!`,
            );
        }

        this._articles.splice(index, 1, article);
    }

    @Mutation
    private _delete(index: number): void {
        this._articles.splice(index, 1);
    }
}

export default getModule(CrudModule);
