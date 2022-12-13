import EventEmitter from 'eventemitter3';

function preventDefaults(e: Event)
{
    e.preventDefault();
    e.stopPropagation();
}

['dragenter', 'dragover', 'dragleave', 'drop'].forEach((eventName) =>
{
    document.body.addEventListener(eventName, preventDefaults, false);
});

export class DropZone extends EventEmitter<'drop'>
{
    public isEnabled: boolean;

    constructor(public readonly container: HTMLElement)
    {
        super();

        this.isEnabled = true;

        container.addEventListener('dragenter', this.onDragEnter);
        container.addEventListener('drop', this.onDrop);
    }

    public onDragEnter = (e: DragEvent) =>
    {
        const { dataTransfer } = e;

        if (dataTransfer)
        {
            const d = dataTransfer.getData('application/x-moz-file');

            dataTransfer.setData('application/x-moz-file', d);

            dataTransfer.dropEffect = 'move';
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
        }
    };
}
