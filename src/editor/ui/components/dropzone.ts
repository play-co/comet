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

export class DropZone extends EventEmitter<'enter' | 'leave' | 'drop'>
{
    public isEnabled: boolean;
    private counter = 0;

    constructor(public readonly container: HTMLElement)
    {
        super();

        this.isEnabled = true;

        this.bind();
    }

    public bind()
    {
        const { container } = this;

        container.addEventListener('dragenter', this.onDragEnter);
        container.addEventListener('dragleave', this.onDragLeave);
        container.addEventListener('drop', this.onDrop);
    }

    public unbind()
    {
        const { container } = this;

        container.removeEventListener('dragenter', this.onDragEnter);
        container.removeEventListener('dragleave', this.onDragLeave);
        container.removeEventListener('drop', this.onDrop);
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

            this.emit('enter');
        }
    };

    public onDragLeave = (e: DragEvent) =>
    {
        const { dataTransfer } = e;

        this.counter--;

        if (dataTransfer && this.counter === 0)
        {
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
        }
    };
}
