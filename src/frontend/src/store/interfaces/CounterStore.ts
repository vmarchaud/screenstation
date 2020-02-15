export interface CounterStore {
    count: number;

    increment(delta: number): Promise<number>;

    decrement(delta: number): Promise<number>;
}
