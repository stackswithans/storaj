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

Stores can be loaded from files like so:
```typescript
import {
    storeFromFile,
} from "storaj";

//Stores can be loaded from files,
let store = storeFromFile("todos.json"); //this will also persist the data to the todos.json file
```
Stores can be also be initialized from an array of valid objects:
```typescript
import {
    storeFromObjects,
    SerializedDefault,
} from "storaj";

//extend the SerializedDefault type to get ts typechecking
interface StoredTodo extends SerializedDefault {
    desc: string;
    done: boolean;
    dueDate: string;
}

store = storeFromObjects<StoredTodo>([
    {
        _id: 1 as number,
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
```
Brand new stores can be created using the Store constructor:
```typescript
import { Store } from 'storaj';
store = new Store(); //Data will only reside in memory, no persistence.

//The constructor can be called with a non-empty string that denotes the path to a file where the data
//should be saved to
store = new Store("db.json");
```
### Inserting Objects into a store

```typescript
import { ItemDefault } from "storaj";

//extend the ItemDefault type to get ts typechecking
interface Todo extends ItemDefault {
    desc: string;
    done: boolean;
    dueDate: string;
}

//Get a reference to the collection where the object will be inserted 
// If the collection doesn't exist, it will be created
const todos = store.collections<Todo>("todos");

//the insert method will add the object to the store and attempt to persist the data;
//the insert method is async. Either await or handle the promise;
(async () => {
    await todos.insert({ desc: "new todo", done: true, dueDate: "25-08-2021" });
    //An id (String or Number) can also be provided on insertion
    await todos.insert(
        { desc: "new todo", done: true, dueDate: "25-08-2021" },
        "new todo"
    );
})();

//Items can also be inserted in sychronously with `insertNoSave`
todos.insertNoSave({ desc: "new todo", done: true, dueDate: "25-08-2021" });
```

## Usage (Javascript)
```typescript
```
