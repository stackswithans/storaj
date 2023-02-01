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

Brand new stores can be created using the Store constructor:
```typescript
import { Store } from 'storaj';
let store = new Store(); //Data will only reside in memory, no persistence.

//The constructor can be called with a non-empty string that denotes the path to a file where the data
//should be saved to
store = new Store("todos.json");
```

Stores can be loaded from files or like so:
```typescript
import {
    Store
} from "storaj";

//Stores can be loaded from previously persisted stores,
let store = new Store("todos.json"); //this will also persist the data to the todos.json file
```
### Inserting Objects into a store

```typescript

import {
    Store
} from "storaj";


interface Todo {
    desc: string;
    done: boolean;
    dueDate: string;
}

const store = new Store();

//Get a reference to the collection where the object will be inserted 
// If the collection doesn't exist, it will be created
const todos = store.collections<Todo>("todos");

//the insert method will add the object to the store and attempt to persist the data;
//the insert method is async. Either await or handle the promise;
(async () => {
    await todos.insert({ desc: "new todo", done: true, dueDate: "25-08-2021" });
    //An id (String or Number) can also be provided on insertion
    await todos.insert(
        { _id: "brandNewTodo", desc: "new todo 2", done: true, dueDate: "25-08-2021" },
        "new todo"
    );
    await todos.insert(
        { _id: 1, desc: "new todo 2", done: false, dueDate: "25-08-2021" },
        "new todo"
    );
})();

//Multiple items may be inserted with `insertMany`
todos.insertMany(
    { desc: "new todo", done: true, dueDate: "25-08-2021" }, 
    { desc: "new todo 1", done: true, dueDate: "26-08-2021" }, 
    { desc: "new todo 2", done: true, dueDate: "27-08-2021" }, 
);

//Items can also be inserted sychronously with `insertSync` and `insertManySync`
todos.insertSync({ desc: "new todo", done: true, dueDate: "25-08-2021" });

todos.insertManySync(
    { desc: "new todo", done: true, dueDate: "25-08-2021" }, 
    { desc: "new todo 1", done: true, dueDate: "26-08-2021" }, 
    { desc: "new todo 2", done: true, dueDate: "27-08-2021" }, 
);
```
### Retrieving objects from the store

The `get` method of a collection can be used to get an item by id:
```typescript
interface Todo {
    desc: string;
    daysTillDue: number;
    done: boolean;
    dueDate: string;
}

const todos = store.collections<Todo>("todos");
const todo = todos.get(1);

//Do something with 'todo'
console.log(todo.desc);
```

The collection query API can be used to perform more complex lookups:
```Typescript
// Returns all todos that have desc == "new todo"

const results = todos.where({ desc: "new todo" }).execute();
```

Adding more fields to the query object will result in an "AND" clause:
```typescript
//Returns all todos that have desc == "new todo" and dueDate == "25-08-2021"
const results = todos
            .where({ desc: "new todo", dueDate: "25-08-2021" })
            .execute(); 

//Do something with the array of results
results.forEach((todo) => console.log(todo.desc));
```
"OR" queries can be performed using the `or` method of the object returned by the `where` method of 
a collection.
```typescript
//Returns all todos that have desc == "new todo" or done == true
const results = todos
            .where({ desc: "new todo"})
            .or({ done: true})
            .execute(); 

```

Calling the `and` or `or` methods on the query object simply adds a new
clause to the query criteria, there is no precedence between both operators:
```typescript
 todos
    .where({ desc: "new todo"}) // desc == "new todo"
    .or({ done: true}) // desc == "new todo" or done == true
    .and({ dueDate: '25-10-2022'}) // (desc == "new todo" or done == true) and dueDate == '25-10-2022'
    .execute(); 
```
Queries can also contain operators to express conditions other than equality: 
```typescript
import { QOp } from "storaj";

//Returns all todos that are not done and daysTillDue != 5;
todos.where({ daysTillDue: QOp.ne(5), done: false}).execute(); 

//Returns all todos that are not done and daysTillDue > 5;
todos.where({ daysTillDue: QOp.gt(5), done: false}).execute(); 

//Returns all todos that are not done and daysTillDue >= 5;
todos.where({ daysTillDue: QOp.gte(5), done: false}).execute(); 


//Returns all todos that are not done and daysTillDue < 5;
todos.where({ daysTillDue: QOp.lt(5), done: false}).execute(); 

//Returns all todos that are not done and daysTillDue <= 5;
todos.where({ daysTillDue: QOp.lte(5), done: false}).execute(); 
```
### Update objects

```typescript


//Use the update method to update objects in a store
//the update method is async. Either await or handle the promise;

(async () => {
    const todos = store.collections<Todo>("todos");
    await todos
          .update()
          .set({ done: true})
          .where({dueDate: "27-08-2021"})
          .execute(); // Sets done to true on all todo items that have dueDate == "27-08-2021";

    //Items can also be updated by using the `updateById` method: 
    await todos.updateById(1, {done: false, dueDate: "01-01-2022"})

})();
```

### Remove objects

```typescript


//Use the delete method to remove objects from a store
//the delete method is async. Either await or handle the promise;

(async () => {
    const todos = store.collections<Todo>("todos");
    await todos
          .delete()
          .where({dueDate: "27-08-2021"})
          .execute(); // Deletes all todo items that have dueDate == "27-08-2021";

    //Items can also be deleted by using the `deleteById` method: 
    await todos.await("someId")
})();
```
## Usage (Javascript)
The API is exactly the same, only difference is the absence of generic type parameters in some of the functions/classes.
