import { readFile, writeFile, existsSync } from 'fs';
import { resolve } from 'path';
import { version } from '../package.json';

const destPackagePath = resolve(__dirname, '../dist/player/package.json');

let attempts = 1;
const maxAttempts = 3;
const attemptIntervalMs = 100;

function closeBundle() {
    if (!existsSync(destPackagePath)) {
        if (attempts >= maxAttempts) {
            throw new Error(`Cannot find file "${destPackagePath}" for updating player package version. ${maxAttempts * attemptIntervalMs}ms expired during wait.`);
        }
        setTimeout(() => {
            attempts++;
            closeBundle();
        }, attemptIntervalMs);
        return
    }
    readFile(destPackagePath, (err, data) => {
        if (err) {
            throw err;
        }
        const contents = data
            .toString()
            .replace(/"version": "\*"/, `"version": "${version}"`);
        writeFile(destPackagePath, contents, {}, () => {
            console.log(
                `${destPackagePath} updated with version "${version}"`,
            );
        });
    });
}

export default function updatePlayerVersion() {
    return {
        name: 'updatePlayerVersion',
        closeBundle,
    };
}
