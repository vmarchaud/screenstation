import { CounterStore } from '@/store/interfaces/CounterStore';
import { Action, Module, Mutation, VuexModule } from 'vuex-module-decorators';

/**
 * Remark: Don't use "dynamic: true" and don't import "store"
 * With this in mind the module is much easier to test
 */
@Module({ namespaced: true, name: CounterModule.NAME })
export default class CounterModule extends VuexModule implements CounterStore {
    public static readonly NAME = 'counterModule';

    private _count = 15;

    public get count(): number {
        return this._count;
    }

    // action 'increment' commits mutation '_increment' when done with return value as payload
    @Action({ commit: '_increment' })
    public async increment(delta: number): Promise<number> {
        return delta;
    }
    // action 'decrement' commits mutation '_decrement' when done with return value as payload
    @Action({ commit: '_decrement' })
    public async decrement(delta: number): Promise<number> {
        return delta;
    }

    // - Keep all the Mutations private - we don't want to call Mutations directly -----------------

    @Mutation
    private _increment(delta: number): void {
        this._count += delta;
    }

    @Mutation
    private _decrement(delta: number): void {
        this._count = Math.min(50, Math.max(0, this._count - delta));
    }
}
