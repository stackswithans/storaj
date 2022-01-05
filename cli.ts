#!/usr/bin/env node
import { createInterface } from "readline";
import { loadCellaStore, CellaStore } from "./src/main";

function main() {
    let store: CellaStore;
    try {
        store = loadCellaStore(process.argv[2]);
    } catch (err) {
        console.log("An error has ocurred while trying to read the database");
        process.exit(1);
    }
    const rl = createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    while (true) {
        rl.question(">", (cmd) => runCmd(cmd, store));
    }
}

function runCmd(cmd: string, store: CellaStore): void {
    switch (cmd) {
        case "collections": {
            store.colNames().forEach((value) => console.log(value));
        }
        default:
            console.error("Comando inexistente, tenta de novo!.\n\n");
            break;
    }
}

main();
