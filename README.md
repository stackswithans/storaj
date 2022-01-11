# Storaj  
Storaj is a simple and lightweight server-side library for storing and querying javascript objects in memory.
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

//Items can also be inserted sychronously with `insertSync`
todos.insertSync({ desc: "new todo", done: true, dueDate: "25-08-2021" });
```
### Retrieving objects from the store

The `get` method of a collection can be used to get an item by id;
```typescript
interface TodoI extends ItemDefault {
    desc: string;
    daysTillDue: number;
    done: boolean;
    dueDate: string;
}

todos = store.collections<TodoI>("todos");
let todo = todos.get("new todo");

//Do something with 'todo'
console.log(todo.desc);
```

The `query` method can be used to get a set of items based on the value of chosen fields:
```Typescript
// Returns all todos that have desc == "new todo"
let results = todos.query({ desc: "new todo" });
```

Adding more fields to the query object will result in an "AND" clause:
```typescript
//Returns all todos that have desc == "new todo" and dueDate == "25-08-2021"
results = todos.query({ desc: "new todo", dueDate: "25-08-2021" }); 

//Do something with the array of results
results.forEach((todo) => console.log(todo.desc));
```
Queries can also contain operators to express conditions other than equality 
(Consult the API Section for the full list of query operators): 
```typescript
import { queryOp } from "storaj";

results = todos.query({ daysTillDue: queryOp.gt(5), done: false}); //Returns all todos that are not done and daysTillDue > 5;
```

## Usage (Javascript)
The API is exactly the same, only difference is the absence of generic type parameters in some of the functions/classes.
