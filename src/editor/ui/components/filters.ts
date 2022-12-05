const letterRegex = /[a-zA-Z]/;
const numericInputRegex = /[-.]/;
const generalInputRegex
  = /Tab|Escape|ArrowLeft|ArrowRight|ArrowUp|ArrowDown|Enter|Ctrl/;

export function isGeneralInputKey(key: string)
{
    return !!(generalInputRegex.exec(key));
}

export function isDeleteKey(key: string)
{
    return key === 'Delete' || key === 'Backspace';
}

export function isIncrementKey(key: string)
{
    return key === 'ArrowUp' || key === 'ArrowRight';
}

export function isDecrementKey(key: string)
{
    return key === 'ArrowDown' || key === 'ArrowLeft';
}

export function isScrollUpKey(key: string)
{
    return key === 'ArrowUp' || key === 'ArrowLeft';
}

export function isScrollDownKey(key: string)
{
    return key === 'ArrowDown' || key === 'ArrowRight';
}

export function isArrowVerticalKey(key: string)
{
    return key === 'ArrowUp' || key === 'ArrowDown';
}

export function isArrowHorizontalKey(key: string)
{
    return key === 'ArrowLeft' || key === 'ArrowRight';
}

export function isArrowKey(key: string)
{
    return isIncrementKey(key) || isDecrementKey(key);
}

export function isAcceptKey(key: string)
{
    return key === 'Enter' || key === ' ';
}

export function isNumeric(key: string)
{
    return !isNaN(parseFloat(key));
}

export function isNumericInput(key: string)
{
    return !!(numericInputRegex.exec(key)) || isNumeric(key);
}

export function isLetter(key: string)
{
    return !!(letterRegex.exec(key));
}

export function isSpecialKey(key: string)
{
    return key.length > 0;
}

export function isSymbol(key: string)
{
    return !isNumeric(key) && !isLetter(key) && !isSpecialKey(key);
}

export function isAlphaNumeric(key: string)
{
    return isNumeric(key) || isLetter(key);
}

export function isModifier(key: string)
{
    return (
        key === 'Control' || key === 'Shift' || key === 'Option' || key === 'Alt' || key === 'Meta'
    );
}
