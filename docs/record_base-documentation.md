# 📘 RecordBase Documentation

The `RecordBase` class is a lightweight, immutable, schema-driven entity base for frontend applications. It standardizes how data is modeled, supports deep relationships (`hasMany`, `belongsTo`), provides validation, serialization for APIs, and guarantees consistency across objects.

---

## 🧰 Key Features

- ✅ Immutable by default  
- ✅ Auto-injected primary fields like `id`, `_token`, `_destroy`  
- ✅ `hasMany` and `belongsTo` relationship support  
- ✅ Auto-generated getters for all attributes  
- ✅ API-friendly with `.toParams()` and `.toObject()`  
- ✅ Deep validations and error handling  
- ✅ Useful helper methods like `isNewRecord()`, `validate()`, etc.

---

## 🔧 Configuration Options

### 1. `defaultAttributes` (required)

Defines the default values for each attribute.

```js
static defaultAttributes = {
  name: '',
  age: 0,
  active: true
};
```

---

### 2. `hasMany` (optional)

Defines plural child relationships. Values will be stored as `Map<idOrToken, RecordInstance>`.

```js
static hasMany = {
  posts: PostRecord,
  comments: CommentRecord
};
```

---

### 3. `belongsTo` (optional)

Defines singular parent relationships. Each value is stored as a single record instance.

```js
static belongsTo = {
  company: CompanyRecord
};
```

---

### 4. `validates` (optional)

Define validation rules per field using validator functions.

```js
static validates = {
  name: [(val) => ({ isValid: !!val, message: 'is required' })],
  age: [(val) => ({ isValid: val >= 18, message: 'must be at least 18' })]
};
```

---

## 🚀 Instantiating a Record

```js
const user = new UserRecord({ name: 'Alice', age: 25 });
```

---

## 🔎 Accessing Values

Every attribute becomes an automatic getter:

```js
user.name        // → "Alice"
user.get('name') // → "Alice"
```

Relationships too:

```js
user.company     // → CompanyRecord instance
user.posts       // → Map of PostRecord instances
```

---

## 🔄 Modifying Records (immutably)

```js
const updated = user.set('name', 'Bob');

console.log(user.name);        // Alice
console.log(updated.name);     // Bob
console.log(user !== updated); // true
```

---

## 🧱 Example: Basic Record

```js
class PersonRecord extends RecordBase {
  static defaultAttributes = {
    name: '',
    age: 0
  };
}
```

---

## 📚 Example: Nested `belongsTo` + `hasMany`

```js
class CompanyRecord extends RecordBase {
  static defaultAttributes = { name: '' };
}

class CarRecord extends RecordBase {
  static defaultAttributes = { model: '', price: 0 };
}

class UserRecord extends RecordBase {
  static defaultAttributes = {
    name: '',
    company: null,
    cars: []
  };

  static belongsTo = { company: CompanyRecord };
  static hasMany = { cars: CarRecord };
}

const user = new UserRecord({
  name: 'João',
  company: { name: 'Google' },
  cars: [{ model: 'Tesla', price: 80000 }, { model: 'Civic', price: 40000 }]
});

console.log(user.company.name); // Google
console.log(user.cars.size);    // 2
```

---

## 🔁 Updating Nested Records

```js
const civicID = Array.from(user.cars.keys())[1];
const civic = user.cars.get(civicID);
const updatedCivic = civic.set('price', 45000);

const newCars = new Map(user.cars);
newCars.set(civicID, updatedCivic);

const updatedUser = user.set('cars', newCars);

console.log(updatedUser.cars.get(civicID).price); // 45000
```

---

## 🧪 Validation & Errors

```js
class AccountRecord extends RecordBase {
  static defaultAttributes = { email: '' };

  static validates = {
    email: [(val) => ({
      isValid: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
      message: 'is invalid'
    })]
  };
}

const account = new AccountRecord({ email: 'bad-email' });
const validated = account.validate();

console.log(validated.errors.fullMessages()); // ["Email is invalid"]
```

---

## 🧾 Serialization

### `.toObject()`

Returns a plain JS object, including relationships:

```js
const userObj = user.toObject();
```

### `.toParams()`

Used to build data for API submission:

```js
const payload = user.toParams();
```

You can override `.toParams()` in your own subclass to customize payloads.

---

## 📌 Helper Methods

| Method               | Description                                 |
|----------------------|---------------------------------------------|
| `.get(attr)`         | Gets any attribute                          |
| `.set(attr, value)`  | Returns new instance with updated value     |
| `.updateAttributes()`| Updates multiple fields at once             |
| `.validate()`        | Runs all validations                        |
| `.isValid()`         | Returns `true` if no validation errors      |
| `.toObject()`        | Serializes the full object                  |
| `.toParams()`        | Payload-ready serialization                 |
| `.isNewRecord()`     | Returns `true` if no ID exists              |
| `.isPersisted()`     | Returns `true` if record has an ID          |
| `.idOrToken`         | Returns `id` if present, otherwise `_token` |

---

## 🧠 Best Practices

- Use `defaultAttributes` in combination with schema builders.
- Always use `.set()` or `.updateAttributes()` — do not mutate manually.
- Access related records via auto-getters: `user.company.name`.
- Use `Map` methods like `.get()`, `.set()`, `.entries()` for `hasMany`.

---

## ✅ Example: Deep Tree

```js
class MessageRecord extends RecordBase {
  static defaultAttributes = { text: '', read: false };
}

class ThreadRecord extends RecordBase {
  static defaultAttributes = { title: '', messages: [] };
  static hasMany = { messages: MessageRecord };
}

class InboxRecord extends RecordBase {
  static defaultAttributes = { user_id: null, threads: [] };
  static hasMany = { threads: ThreadRecord };
}

const inbox = new InboxRecord({
  user_id: 7,
  threads: [
    {
      title: 'Support',
      messages: [{ text: 'Hello' }, { text: 'How can I help?' }]
    }
  ]
});

const threads = inbox.threads;
const firstThread = Array.from(threads.values())[0];
const messages = firstThread.messages;

console.log(messages.size); // 2
```

---

## 🧩 Extensibility

Feel free to extend or override methods like:

```js
class CustomUserRecord extends UserRecord {
  toParams() {
    return {
      name: this.name,
      company_id: this.company?.id,
      car_ids: Array.from(this.cars.values()).map(c => c.id)
    };
  }
}
```

---

## 🧪 Testing Utility

Use `jest` or `vitest` to ensure:

- Reference integrity of relationships  
- Immutability  
- Validation and serialization behavior  

Already includes support for `Map`, `instanceof`, and safe identity checks.

---

## 📎 Final Notes

The `RecordBase` system is ideal for complex frontend apps (like React or Vue) that need:

- Entity modeling  
- Safe data handling  
- Form state isolation  
- Predictable immutable updates  
