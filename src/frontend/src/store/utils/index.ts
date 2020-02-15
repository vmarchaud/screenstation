import { RootState } from '@/store/interfaces/RootState';
import { Store } from 'vuex';

export function isNotRegistered(moduleName: string, rootStore: Store<RootState>): boolean {
    // tslint:disable-next-line:no-any
    return !(rootStore && rootStore.state && (rootStore.state as any)[moduleName]);
}
