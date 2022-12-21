export type FactoryTypes = {
    [name: string]: { new (params: { target: HTMLElement }): object };
};
