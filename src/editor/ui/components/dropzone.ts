import EventEmitter from 'eventemitter3';

import { WritableStore } from '../views/store';

function preventDefaults(e: Event)
{
    e.preventDefault();
    e.stopPropagation();
}

['dragenter', 'dragover', 'dragleave', 'drop'].forEach((eventName) =>
{
    document.body.addEventListener(eventName, preventDefaults, false);
});

export class DropZone extends EventEmitter<'enter' | 'leave' | 'drop'>
{
    public isEnabled: boolean;
    public isDragOver: WritableStore<boolean>;
    private counter = 0;

    constructor()
    {
        super();

        this.isEnabled = true;
        this.isDragOver = new WritableStore(false);
    }

    public bind(container: HTMLElement)
    {
        container.addEventListener('dragenter', this.onDragEnter);
        container.addEventListener('dragleave', this.onDragLeave);
        container.addEventListener('drop', this.onDrop);

        return this;
    }

    public unbind(container: HTMLElement)
    {
        container.removeEventListener('dragenter', this.onDragEnter);
        container.removeEventListener('dragleave', this.onDragLeave);
        container.removeEventListener('drop', this.onDrop);

        return this;
    }

    public onDragEnter = (e: DragEvent) =>
    {
        const { dataTransfer } = e;

        this.counter++;

        if (dataTransfer && this.counter === 1)
        {
            const d = dataTransfer.getData('application/x-moz-file');

            dataTransfer.setData('application/x-moz-file', d);

            dataTransfer.dropEffect = 'copy';

            this.isDragOver.value = true;

            this.emit('enter');
        }
    };

    public onDragLeave = (e: DragEvent) =>
    {
        const { dataTransfer } = e;

        this.counter--;

        if (dataTransfer && this.counter === 0)
        {
            this.isDragOver.value = false;

            this.emit('leave');
        }
    };

    public onDrop = (e: DragEvent) =>
    {
        const { dataTransfer } = e;

        if (dataTransfer)
        {
            const files = dataTransfer.files;

            if (files.length >= 1 && this.isEnabled)
            {
                this.emit('drop', files);
            }

            this.isDragOver.value = false;
        }
    };
}
