import { Container, Graphics, Text } from 'pixi.js';

const gap = 10;
const hPad = 5;
const vPad = 2;

export class KeyValueLabel extends Container
{
    public background: Graphics;
    public keyText: Text;
    public valueText: Text;

    constructor()
    {
        super();

        const background = this.background = new Graphics();

        const key = this.keyText = new Text(undefined, {
            fill: 0xffff00,
            fontSize: 16,
        });

        const value = this.valueText = new Text(undefined, {
            fill: 0x00ffff,
            fontSize: 16,
        });

        this.addChild(background);
        this.addChild(key);
        this.addChild(value);
    }

    public setText(key: string, value: string)
    {
        const { background, keyText, valueText } = this;

        keyText.text = key;
        valueText.text = value;

        const width = this.width;
        const height = this.height;
        const valueX = hPad + keyText.width + gap;

        background.clear();
        background.beginFill(0x000000, 0.75);
        background.drawRect(0, 0, width, height);
        background.endFill();

        keyText.x = hPad;
        keyText.y = vPad;
        valueText.x = valueX;
        valueText.y = vPad;
    }

    public get width()
    {
        const { keyText, valueText } = this;

        const valueX = hPad + keyText.width + gap;

        return valueX + valueText.width + hPad;
    }

    public get height()
    {
        const { keyText, valueText } = this;

        return Math.max(keyText.height, valueText.height) + (vPad * 2);
    }

    public singleLine()
    {
        this.valueText.visible = false;
    }

    public multiLine()
    {
        this.valueText.visible = true;
    }
}
