# 🧩 EntityBase

**EntityBase** is a lightweight, schema-driven, immutable base class for modeling data in modern JavaScript/TypeScript applications — especially useful in frontend frameworks like **React** and **Vue**.

It provides declarative validations, relationship handling (`hasMany`, `belongsTo`), built-in serialization for APIs, and a powerful yet minimal architecture for managing application state with confidence.

---

## 🚀 Features

- ✅ **Immutable by design** – all updates return new instances
- 🔁 **Deep relationship support** (`hasMany`, `belongsTo`)
- 🧪 **Validation and error handling**
- 📦 **Serialization** for `toParams()` and `toObject()`
- ⚙️ **Automatic getters** for attributes and relations
- 🧠 Optimized for **React/Vue** reactivity systems
- 🧼 Easy-to-extend with custom logic or override methods

---

## 📦 Installation

```bash
npm install --save @brunomergen/entity-base@1.0.0-beta
```

Or if you're using it directly in a monorepo or internal project, simply import the `EntityBase` class as a base for your models.

---

## 🧱 Example Usage

### Defining a Model

```js
import EntityBase from '@brunomergen/entity-base'

class User extends EntityBase {
  static defaultAttributes = {
    name: '',
    age: 0,
    company: null,
    cars: []
  };

  static belongsTo = { company: Company };
  static hasMany = { cars: Car };

  static validates = {
    name: [(val) => ({ isValid: !!val, message: 'is required' })],
    company: [
      (val, entity) => ({
        isValid: !val || entity.age >= 18,
        message: 'is allowed only for users over 18'
      })
    ]
  };
}
```

### Creating and Updating Instances

```js
const user = new User({ name: 'Alice', age: 25 });
const updatedUser = user.set('name', 'Bob');

console.log(user.name);        // Alice
console.log(updatedUser.name); // Bob
```

### Validating

```js
const invalidUser = new User({ age: 16, company: { name: 'ACME' } });
const validated = invalidUser.validate();

console.log(validated.isValid()); // false
console.log(validated.errors.fullMessages());
// → [ 'Company is allowed only for users over 18', 'Name is required' ]
```

---

## 🌐 Serialization

### `toParams()` for API submission

```js
const payload = user.toParams();
// { name: 'Alice', age: 25, company: { name: 'ACME' }, cars: [ { ... }, ... ] }
```

### `toObject()` for plain JS structure

```js
const raw = user.toObject();
```

---

## 🔍 Relationship Access

```js
user.company.name
user.cars.get(carId)
user.array('cars').map(car => car.model)
```

---

## 🧪 Testing

We recommend using **Jest** or **Vitest** for unit testing. Key testing areas include:

- Immutability (`set`, `updateAttributes`)
- Validation rules
- Relationship behavior
- Serialization (`toParams`, `toObject`)

```js
expect(user.set('name', 'Bob')).not.toBe(user);
expect(user.validate().errors.isEmpty()).toBe(true);
```

---

## ⚒️ Advanced Features

- `addNested(relationName, attrs)`
- `updateNested(relationName, id, attrs)`
- `updateManyNested(relationName, attrs, ids?)`
- `clone()` – deep clone for `Errors` and attributes
- `isNewEntity()` / `isPersisted()`
- `idOrToken` — returns `id` or generated `_token`

---

## 📘 Documentation

All API features, internal methods, and extensibility options are documented in:

- [EntityBase-Documentation.md](docs/documentacao-abrangente.md)
- [Documentação-Abrangente.md](docs/entity_base-documentation.md)
- [Utilizando o em Projetos React.md](docs/utilizando-em-projetos-react.md)

---

## 👨‍💻 Contributing

We welcome suggestions, improvements, and bug reports! Feel free to submit an issue or pull request.

---

## 📄 License

MIT License.

---

## 🧠 Final Notes

`EntityBase` helps you design predictable, testable, and highly maintainable data models in the frontend world. Whether you're handling nested form state or syncing data with an API — it gives you a clean, immutable foundation to build upon.

Happy coding! 🔨🤖

