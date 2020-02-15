import { CounterStore } from '@/store/interfaces/CounterStore';

type StoreProvider<T> = () => T;

export interface RootState {
    loaded: boolean;
    counterStore: StoreProvider<CounterStore>;
}
