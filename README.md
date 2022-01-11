# Storaj  
Storaj (warehouse in latin) is a simple and lightweight server-side library for storing and querying javascript objects in memory.
It can be used as lightweight database for small projects with data storage requirements. A store is made up of groups known as collections,
collections contain objects, and can be queried to get objects that meet certain conditions. Some of the features include:

- Persisting store data to a file (as JSON)
- Loading store data from a JSON file

## Installation
Use [npm](https://www.npmjs.com/) to install Storaj.

```bash
npm install storaj
```

## Usage (Typescript)
### Creating a store
```typescript
import { Store, storeFromFile, storeFromObjects, SerializedItem } from "storaj";

//Stores can be loaded from files,
let store = storeFromFile("todos.json"); //this will also persist the data to the todos.json file

//initialized from an array of valid objects,
interface StoredTodo {
    desc: string;
    done: boolean;
    dueDate: string;
}

//Use the SerializedItem type when creating stores from objects 
store = storeFromObjects<SerializedItem<StoredTodo>>([
    {
        _id: 1 as number, //The _id and _collection field are required when loading objects directly
        _collection: "todos",
        desc: "finish this libray",
        done: false,
        dueDate: "26-08-2022",
    },
    {
        _id: 2,
        _collection: "todos",
        desc: "write a browser in assembly",
        done: false,
        dueDate: "27-08-2022",
    },
    {
        _id: 3,
        _collection: "todos",
        desc: "do code reviews",
        done: false,
        dueDate: "28-08-2022",
    },
]);

//or a brand new one can be created using the Store constructor
store = new Store(); //Data will only reside in memory, no persistence.

//The constructor can be called with a non-empty string that denotes the path to a file where the data
//should be saved to
store = new Store("db.json");
```

## Usage (Javascript)
```typescript
```
