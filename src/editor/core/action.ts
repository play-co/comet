import hotkeys, { type HotkeysEvent } from 'hotkeys-js';

export const isMac = () =>
    window.navigator.platform.toLowerCase().indexOf('mac') === 0;

export interface ActionOptions
{
    isEnabled: boolean;
    isChecked: boolean;
    canToggle: boolean;
    hotkey: string;
    preventDefault: boolean;
}

export const defaultActionOptions: Omit<ActionOptions, 'hotkey'> = {
    isEnabled: true,
    isChecked: false,
    canToggle: false,
    preventDefault: false,
};

export type ActionConstructorOptions = Partial<ActionOptions> & { hotkey: string };

export abstract class Action<OptionsType, ReturnType>
{
    public id: string;
    public isEnabled: boolean;
    public isChecked: boolean;
    public canToggle: boolean;
    public preventDefault: boolean;
    public hotkey: string;

    public static actions: Map<string, Action<any, any>> = new Map();

    constructor(id: string, options: ActionConstructorOptions = {} as ActionConstructorOptions)
    {
        if (Action.actions.has(id))
        {
            throw new Error(`Action "${id}" already registered`);
        }

        const { isEnabled, isChecked, canToggle, hotkey, preventDefault } = {
            ...defaultActionOptions,
            ...options,
        };

        this.id = id;
        this.hotkey = hotkey;
        this.isEnabled = isEnabled;
        this.isChecked = isChecked;
        this.canToggle = canToggle;
        this.preventDefault = preventDefault;

        this.register();
    }

    get printShortcut()
    {
        return this.hotkey
            .split('+')
            .map((part) => part[0].toUpperCase() + part.substring(1))
            .join(' ');
    }

    protected register()
    {
        if (this.hotkey)
        {
            hotkeys(this.hotkey, (event, handler) =>
            {
                if (this.preventDefault)
                {
                    event.preventDefault();
                }

                this.onShortCut(event, handler);

                if (this.preventDefault)
                {
                    return false;
                }

                return true;
            });
        }

        Action.actions.set(this.id, this);

        return this;
    }

    protected unregister()
    {
        if (this.hotkey)
        {
            hotkeys.unbind(this.hotkey);
        }
    }

    protected onShortCut(event: KeyboardEvent, handler: HotkeysEvent)
    {
        if (this.isEnabled)
        {
            if (this.canToggle)
            {
                this.isChecked = !this.isChecked;
            }

            this.triggerFromShortcut(event, handler);
        }
    }

    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected triggerFromShortcut(event: KeyboardEvent, handler: HotkeysEvent)
    {
        this.dispatch({}, event);
    }

    // TODO: change to required, check usages
    public dispatch(options: Partial<OptionsType> = {}, event?: KeyboardEvent): ReturnType | undefined
    {
        if (!this.shouldRun())
        {
            return undefined;
        }

        return this.exec(options, event);
    }

    protected shouldRun()
    {
        return true;
    }

    protected abstract exec(options: Partial<OptionsType>, event?: KeyboardEvent): ReturnType;
}
