# 📘 Documentação Abrangente do Módulo `RecordBase`

O `RecordBase` é uma classe JavaScript projetada para simplificar a modelagem de dados em aplicações frontend, oferecendo um conjunto robusto de funcionalidades inspiradas em padrões de ORMs (Object-Relational Mappers) e no conceito de Active Record. Seu foco principal é a **imutabilidade**, garantindo que as operações de modificação de dados sempre resultem em novas instâncias, preservando a integridade do estado original. Isso o torna particularmente útil em frameworks reativos como React ou Vue, onde a detecção de mudanças e a consistência do estado são cruciais.

## 🧰 Principais Características

*   **Imutabilidade por Padrão:** Todas as operações de modificação retornam novas instâncias, garantindo a previsibilidade do estado.
*   **Campos Primários Auto-Injetados:** Inclui campos essenciais como `id`, `_token` (para identificação de novos registros antes da persistência) e `_created_at`.
*   **Suporte a Relacionamentos:** Gerencia relacionamentos `hasMany` (um-para-muitos) e `belongsTo` (um-para-um ou muitos-para-um) de forma nativa.
*   **Getters Automáticos:** Atributos e relacionamentos podem ser acessados diretamente como propriedades da instância (`record.attributeName`).
*   **API-Friendly:** Métodos como `.toParams()` e `.toObject()` facilitam a serialização de dados para comunicação com APIs RESTful.
*   **Validação e Tratamento de Erros:** Sistema de validação declarativo e uma classe `Errors` dedicada para gerenciar mensagens de erro.
*   **Métodos Auxiliares Úteis:** Inclui métodos para verificar o status de persistência (`isNewRecord()`, `isPersisted()`), validar (`validate()`, `isValid()`), e manipular dados aninhados (`addNested()`, `updateNested()`, `updateManyNested`).

---

## ⚙️ Funções Utilitárias Internas

O `RecordBase` utiliza algumas funções auxiliares que são fundamentais para seu funcionamento:

*   `isObject(check)`: Verifica se um valor é um objeto JavaScript puro (não um array ou null).
*   `isBlank(value)`: Determina se um valor está "em branco" (strings vazias, objetos/arrays vazios, nulos/indefinidos).
*   `isPresent(value)`: O oposto de `isBlank`, verifica se um valor está presente.
*   `intersectionArray(arr1, arr2)`: Retorna os elementos comuns entre dois arrays.
*   `humanizeString(str)`: Converte uma string para um formato mais legível (ex: `camelCase` para `Camel Case`).
*   `createUUID()`: Gera um UUID v4, usado para o `_token` de novos registros.
*   `isString(v)`: Verifica se um valor é uma string.
*   `getOrConvertToInstance(klass, params)`: Converte um objeto simples em uma instância da classe `RecordBase` especificada, ou retorna a instância se já for uma.
*   `manageHasManyValue(klass, _key, value)`: Converte um array ou `Map` de dados em um `Map` de instâncias de `RecordBase` para relacionamentos `hasMany`.
*   `definePropertyGetters(instance)`: Cria getters automáticos para os `defaultAttributes` de uma instância, permitindo acesso direto às propriedades.

---

## 🚨 Classe `Errors`

A classe `Errors` é responsável por coletar, gerenciar e formatar mensagens de erro associadas a uma instância de `RecordBase`.

### Construtor

`new Errors(model, messages={})`

*   `model`: A instância do `RecordBase` à qual os erros estão associados. Usado para humanizar os nomes dos atributos nas mensagens completas.
*   `messages`: Objeto opcional com mensagens de erro iniciais. Pode ser um objeto `{ atributo: [mensagem] }`, um array de strings (para erros `base`), ou uma combinação.

### Propriedades

*   `messages`: Retorna o objeto interno que armazena as mensagens de erro.

### Métodos

*   `add(attr, message)`: Adiciona uma mensagem de erro para um atributo. Se o atributo já tiver erros, a mensagem é adicionada ao array existente.
*   `addJsonAPI(errors = [])`: Adiciona erros formatados no padrão JSON API (com `field` e `detail`).
*   `clear()`: Limpa todas as mensagens de erro.
*   `fullMessages(args={})`: Retorna um array de strings formatadas, combinando o nome humanizado do atributo com a mensagem. O argumento `forceBase` pode ser usado para exibir todos os erros como mensagens gerais.
*   `isEmpty()`: Retorna `true` se não houver mensagens de erro.
*   `clone()`: Cria uma cópia profunda da instância de `Errors`, essencial para a imutabilidade do `RecordBase`.

---

## 🏛️ Classe `RecordBase`

A classe `RecordBase` é a base para todos os seus modelos de dados. Ela deve ser estendida para criar suas entidades específicas.

### Propriedades Estáticas (Configuração do Modelo)

Estas propriedades são definidas na sua classe estendida e configuram o comportamento do modelo:

*   `static defaultAttributes = {}` (obrigatório):
    Define os valores padrão para cada atributo do modelo. Todos os atributos que o modelo pode ter devem ser listados aqui, mesmo que seus valores iniciais sejam `null` ou vazios. Isso garante uma estrutura consistente e permite que os getters automáticos funcionem.
    ```javascript
    static defaultAttributes = {
      name: \'\',
      age: 0,
      active: true
    };
    ```

*   `static primaryKey = 'id'` (opcional):
    Define o nome da chave primária do modelo. O padrão é `'id'`. Sobrescreva se seu modelo usa uma chave diferente (ex: `'uuid'`).

*   `static belongsTo = {}` (opcional):
    Define relacionamentos um-para-um ou muitos-para-um. As chaves são os nomes dos relacionamentos e os valores são as classes `RecordBase` relacionadas.
    ```javascript
    static belongsTo = {
      company: CompanyRecord
    };
    ```

*   `static hasMany = {}` (opcional):
    Define relacionamentos um-para-muitos. As chaves são os nomes dos relacionamentos e os valores são as classes `RecordBase` relacionadas. Os valores serão armazenados como `Map<idOrToken, RecordInstance>`.
    ```javascript
    static hasMany = {
      posts: PostRecord,
      comments: CommentRecord
    };
    ```

*   `static validates = {}` (opcional):
    Define regras de validação para os atributos do modelo. As chaves são os nomes dos atributos e os valores são arrays de funções de validação. Cada função recebe o valor e o nome do atributo, e deve retornar `{ isValid: boolean, message: string }`.
    ```javascript
    static validates = {
      name: [(val) => ({ isValid: !!val, message: 'é obrigatório' })],
      age: [(val) => ({ isValid: val >= 18, message: 'deve ser pelo menos 18' })]
    };
    ```

*   `static attributeNames = {}` (opcional):
    Permite mapear nomes de atributos para nomes mais legíveis, usados em mensagens de erro humanizadas.

### Propriedades Estáticas Derivadas (Getters)

*   `static defaultProperties`: Combina propriedades internas (`_token`, `_created_at`, `errors`, `id`, `updated_at`) com `defaultAttributes`.
*   `static hummanAttributeName(attr)`: Retorna o nome humanizado de um atributo.

### Construtor

`new RecordBase(args = {})`

O construtor inicializa uma nova instância:

1.  Aplica `defaultProperties` e os `args` fornecidos.
2.  Gera um `_token` (UUID) e define `_created_at`.
3.  Cria uma nova instância da classe `Errors`.
4.  Separa os `args` em atributos comuns (`_attributes`) e relacionamentos (`_relations`). Relacionamentos são instanciados como `RecordBase` (para `belongsTo`) ou `Map` de `RecordBase` (para `hasMany`).
5.  Define getters automáticos para todos os `defaultAttributes`.

### Getters de Instância

*   `_belongsTo`, `_hasMany`: Acessam as configurações estáticas de relacionamentos.
*   `belongsToKeys`, `hasManyKeys`: Retornam arrays com as chaves dos relacionamentos.
*   `primaryKey`: Retorna o nome da chave primária do modelo.
*   `idOrToken`: Retorna o `recordID` se existir, caso contrário, o `_token`.
*   `recordID`: Retorna o valor numérico da chave primária.
*   `validations`: Retorna as regras de validação estáticas.

### Métodos de Instância

*   `get(attr)`:
    Retorna o valor de um atributo ou relacionamento. Para `belongsTo`, retorna a instância do modelo relacionado. Para `hasMany`, retorna um `Map` de instâncias.
    ```javascript
    user.get('name'); // Acessa o atributo 'name'
    user.get('company'); // Retorna a instância de CompanyRecord
    user.get('orders'); // Retorna um Map de OrderRecord instances
    ```

*   `set(key, val, defineGetters = true)`:
    **Método fundamental para a imutabilidade.** Retorna uma **nova instância** do `RecordBase` com o `key` atualizado para `val`. Se `val` for o mesmo que o valor atual, a instância original é retornada para otimização.
    ```javascript
    const updatedUser = user.set('name', 'Bob');
    console.log(user.name); // Alice (original)
    console.log(updatedUser.name); // Bob (nova instância)
    console.log(user === updatedUser); // false
    ```

*   `updateAttributes(newAttrs = {})`:
    Atualiza múltiplos atributos de uma vez. Retorna uma **nova instância** do `RecordBase` com todos os atributos especificados atualizados. Internamente, chama `set` para cada atributo.
    ```javascript
    const updatedUser = user.updateAttributes({ name: 'Alice L.', age: 30 });
    ```

*   `addNested(relationName, newAttrs = {})`:
    Adiciona um novo registro a um relacionamento `hasMany`. Retorna um array contendo a **nova instância do `RecordBase` pai** (com o relacionamento atualizado) e a **nova instância do registro aninhado** que foi adicionado.
    ```javascript
    const [updatedOrder, newItem] = order.addNested('items', { product: new Product({ name: 'Laptop' }), quantity: 1 });
    ```

*   `updateNested(relationName, relationKey, newAttrs = {})`:
    Atualiza um registro específico dentro de um relacionamento `hasMany`. Retorna um array contendo a **nova instância do `RecordBase` pai** e a **instância atualizada do registro aninhado**.
    ```javascript
    const [updatedOrder, updatedItem] = order.updateNested('items', itemId, { quantity: 2 });
    ```

*   `updateManyNested(relationName, newAttrs = {}, relationKeys = null)`:
    Atualiza múltiplos registros dentro de um relacionamento `hasMany`. Se `relationKeys` for nulo, todos os registros são atualizados. Retorna um array contendo a **nova instância do `RecordBase` pai** e um array das **instâncias atualizadas dos registros aninhados**.
    ```javascript
    const [updatedOrder, changedItems] = order.updateManyNested('items', { status: 'shipped' });
    ```

*   `array(relationName)`:
    Converte um relacionamento `hasMany` (que é um `Map`) em um array de instâncias dos modelos relacionados. Útil para iteração.
    ```javascript
    const orderItemsArray = order.array('items');
    ```

*   `toObject()`:
    Retorna uma representação em objeto JavaScript puro da instância, incluindo todos os atributos e relacionamentos. Relacionamentos `belongsTo` são as instâncias dos modelos, e `hasMany` são os `Map` de instâncias.
    ```javascript
    const orderObj = order.toObject();
    console.log(orderObj.customer instanceof Customer); // true
    ```

*   `toParams()`:
    Retorna uma representação em objeto JavaScript puro da instância, adequada para envio a uma API. Converte recursivamente os relacionamentos para suas representações `toParams()`, garantindo que os dados aninhados também sejam formatados corretamente para o backend.
    ```javascript
    const orderPayload = order.toParams();
    console.log(orderPayload.customer.name); // 'John Doe'
    console.log(Array.isArray(orderPayload.items)); // true
    ```

*   `isBelongsTo(key)`, `isHasMany(key)`:
    Verificam se uma chave corresponde a um relacionamento `belongsTo` ou `hasMany`.

*   `isNewRecord()`, `isPersisted()`:
    `isNewRecord()` retorna `true` se o registro não tiver um `id` (chave primária). `isPersisted()` é o oposto.

*   `validate()`, `isValid()`:
    `validate()` executa as regras de validação e retorna uma **nova instância** do `RecordBase` com os erros atualizados. `isValid()` retorna `true` se não houver erros de validação.

*   `_clone(newAttributes, newRelations)`:
    Método interno para criar novas instâncias durante operações de modificação, mantendo a imutabilidade.

---

## 🛒 Exemplos de Uso: Entidades de Marketplace

Vamos definir as entidades para um marketplace usando `RecordBase` e demonstrar seu uso com exemplos práticos.

```javascript
// marketplace_entities.js
import RecordBase from './index';

class Address extends RecordBase {
  static defaultAttributes = {
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zipCode: ''
  };

  static validates = {
    street: [(val) => ({ isValid: !!val, message: 'é obrigatório' })],
    city: [(val) => ({ isValid: !!val, message: 'é obrigatória' })],
    state: [(val) => ({ isValid: !!val, message: 'é obrigatório' })],
    zipCode: [(val) => ({ isValid: !!val, message: 'é obrigatório' })]
  };
}

class Customer extends RecordBase {
  static defaultAttributes = {
    name: '',
    email: '',
    phone: '',
    address: null
  };

  static belongsTo = { address: Address };

  static validates = {
    name: [(val) => ({ isValid: !!val, message: 'é obrigatório' })],
    email: [
      (val) => ({ isValid: !!val, message: 'é obrigatório' }),
      (val) => ({ isValid: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), message: 'inválido' })
    ]
  };
}

class Product extends RecordBase {
  static defaultAttributes = {
    name: '',
    description: '',
    price: 0,
    stock: 0
  };

  static validates = {
    name: [(val) => ({ isValid: !!val, message: 'é obrigatório' })],
    price: [
      (val) => ({ isValid: val > 0, message: 'deve ser maior que zero' })
    ],
    stock: [
      (val) => ({ isValid: val >= 0, message: 'não pode ser negativo' })
    ]
  };
}

class OrderItem extends RecordBase {
  static defaultAttributes = {
    product: null,
    quantity: 0,
    unitPrice: 0
  };

  static belongsTo = { product: Product };

  static validates = {
    product: [(val) => ({ isValid: !!val, message: 'é obrigatório' })],
    quantity: [(val) => ({ isValid: val > 0, message: 'deve ser maior que zero' })]
  };
}

class Payment extends RecordBase {
  static defaultAttributes = {
    method: '',
    amount: 0,
    status: 'pending' // pending, approved, rejected
  };

  static validates = {
    method: [(val) => ({ isValid: !!val, message: 'é obrigatório' })],
    amount: [(val) => ({ isValid: val > 0, message: 'deve ser maior que zero' })],
    status: [(val) => ({ isValid: ['pending', 'approved', 'rejected'].includes(val), message: 'inválido' })]
  };
}

class Order extends RecordBase {
  static defaultAttributes = {
    customer: null,
    items: [],
    totalAmount: 0,
    payment: null,
    status: 'pending' // pending, processing, shipped, delivered, cancelled
  };

  static belongsTo = {
    customer: Customer,
    payment: Payment
  };

  static hasMany = { items: OrderItem };

  static validates = {
    customer: [(val) => ({ isValid: !!val, message: 'é obrigatório' })],
    items: [(val) => ({ isValid: val.size > 0, message: 'deve ter pelo menos um item' })],
    totalAmount: [(val) => ({ isValid: val > 0, message: 'deve ser maior que zero' })]
  };

  totalValue() {
    return this.array('items').reduce((total, item) => total + (item.quantity * item.unitPrice), 0)
  }
}

export { Address, Customer, Product, OrderItem, Payment, Order };
```

### Exemplo 1: Criando e Acessando um Cliente com Endereço

```javascript
import { Customer, Address } from './marketplace_entities';

// Criando um endereço
const customerAddress = new Address({
  street: 'Rua das Flores',
  number: '123',
  city: 'São Paulo',
  state: 'SP',
  zipCode: '01000-000'
});

// Criando um cliente com o endereço
const customer = new Customer({
  name: 'João Silva',
  email: 'joao.silva@example.com',
  phone: '11987654321',
  address: customerAddress
});

console.log('Nome do Cliente:', customer.name); // João Silva
console.log('Email do Cliente:', customer.email); // joao.silva@example.com
console.log('Rua do Cliente:', customer.address.street); // Rua das Flores
console.log('Cidade do Cliente:', customer.address.city); // São Paulo

// Validando o cliente
const validatedCustomer = customer.validate();
console.log('Cliente válido?', validatedCustomer.isValid()); // true

// Exemplo de validação falha
const invalidCustomer = new Customer({ name: 'Maria' }); // Email e endereço faltando
const validatedInvalidCustomer = invalidCustomer.validate();
console.log('Cliente válido?', validatedInvalidCustomer.isValid()); // false
console.log('Erros:', validatedInvalidCustomer.errors.fullMessages());
// Saída esperada: [ 'Email é obrigatório', 'Address é obrigatório' ]
```

### Exemplo 2: Criando um Produto e um Item de Pedido

```javascript
import { Product, OrderItem } from './marketplace_entities';

// Criando um produto
const laptopProduct = new Product({
  name: 'Laptop Gamer XYZ',
  description: 'Laptop de alta performance para jogos',
  price: 7500.00,
  stock: 10
});

console.log('Nome do Produto:', laptopProduct.name); // Laptop Gamer XYZ
console.log('Preço do Produto:', laptopProduct.price); // 7500

// Criando um item de pedido para o produto
const orderItem = new OrderItem({
  product: laptopProduct,
  quantity: 2,
  unitPrice: laptopProduct.price // Pode ser diferente do preço atual do produto no momento da compra
});

console.log('Item de Pedido - Produto:', orderItem.product.name); // Laptop Gamer XYZ
console.log('Item de Pedido - Quantidade:', orderItem.quantity); // 2
console.log('Item de Pedido - Preço Unitário:', orderItem.unitPrice); // 7500

// Validando o item de pedido
console.log('Item de Pedido válido?', orderItem.validate().isValid()); // true

// Exemplo de validação falha para OrderItem
const invalidOrderItem = new OrderItem({ quantity: 0 }); // Produto faltando e quantidade inválida
console.log('Item de Pedido inválido?', invalidOrderItem.validate().isValid()); // false
console.log('Erros:', invalidOrderItem.validate().errors.fullMessages());
// Saída esperada: [ 'Product é obrigatório', 'Quantity deve ser maior que zero' ]
```

### Exemplo 3: Criando um Pedido Completo com Itens e Pagamento

```javascript
import { Customer, Address, Product, OrderItem, Payment, Order } from './marketplace_entities';

// 1. Criar Cliente e Endereço
const customerAddress = new Address({
  street: 'Av. Paulista',
  number: '1000',
  city: 'São Paulo',
  state: 'SP',
  zipCode: '01310-100'
});
const customer = new Customer({
  name: 'Ana Paula',
  email: 'ana.paula@example.com',
  address: customerAddress
});

// 2. Criar Produtos
const productA = new Product({ name: 'Smartphone X', price: 3000, stock: 50 });
const productB = new Product({ name: 'Fone Bluetooth', price: 300, stock: 100 });

// 3. Criar Itens de Pedido
const item1 = new OrderItem({ product: productA, quantity: 1, unitPrice: productA.price });
const item2 = new OrderItem({ product: productB, quantity: 2, unitPrice: productB.price });

// 4. Criar Pagamento
const payment = new Payment({
  method: 'Credit Card',
  amount: (item1.quantity * item1.unitPrice) + (item2.quantity * item2.unitPrice),
  status: 'approved'
});

// 5. Criar Pedido
const order = new Order({
  customer: customer,
  items: [item1, item2], // Passando um array, RecordBase converterá para Map
  totalAmount: payment.amount,
  payment: payment,
  status: 'processing'
});

console.log('ID do Pedido:', order.idOrToken); // UUID gerado
console.log('Cliente do Pedido:', order.customer.name); // Ana Paula
console.log('Total do Pedido:', order.totalAmount); // 3600
console.log('Método de Pagamento:', order.payment.method); // Credit Card
console.log('Status do Pedido:', order.status); // processing

// Acessando itens do pedido (Map)
console.log('Número de itens no pedido:', order.items.size); // 2

// Iterando sobre os itens do pedido
order.array('items').forEach(item => {
  console.log(`- ${item.product.name} (x${item.quantity})`);
});
// Saída esperada:
// - Smartphone X (x1)
// - Fone Bluetooth (x2)

// Validando o pedido completo
console.log('Pedido válido?', order.validate().isValid()); // true
```

### Exemplo 4: Atualizando o Status de um Pedido e Itens Aninhados

```javascript
import { Customer, Address, Product, OrderItem, Payment, Order } from './marketplace_entities';

// ... (código para criar o pedido 'order' do Exemplo 3)
// Para fins de exemplo, vamos recriar o pedido aqui:
const customerAddress = new Address({ street: 'Av. Paulista', number: '1000', city: 'São Paulo', state: 'SP', zipCode: '01310-100' });
const customer = new Customer({ name: 'Ana Paula', email: 'ana.paula@example.com', address: customerAddress });
const productA = new Product({ name: 'Smartphone X', price: 3000, stock: 50 });
const productB = new Product({ name: 'Fone Bluetooth', price: 300, stock: 100 });
const item1 = new OrderItem({ product: productA, quantity: 1, unitPrice: productA.price });
const item2 = new OrderItem({ product: productB, quantity: 2, unitPrice: productB.price });
const payment = new Payment({ method: 'Credit Card', amount: (item1.quantity * item1.unitPrice) + (item2.quantity * item2.unitPrice), status: 'approved' });
let order = new Order({ customer: customer, items: [item1, item2], totalAmount: payment.amount, payment: payment, status: 'processing' });

console.log('Status inicial do pedido:', order.status); // processing

// Atualizando o status do pedido
const shippedOrder = order.set('status', 'shipped');
console.log('Status após envio:', shippedOrder.status); // shipped
console.log('Pedido original inalterado:', order.status); // processing

// Atualizando a quantidade de um item específico no pedido
const item2Id = item2.idOrToken; // Obter o ID do item2
const [orderWithUpdatedItem, updatedItem2] = shippedOrder.updateNested('items', item2Id, { quantity: 3 });

console.log('Nova quantidade do Fone Bluetooth:', orderWithUpdatedItem.items.get(item2Id).quantity); // 3
console.log('Item original inalterado:', item2.quantity); // 2

// Atualizando o status de todos os itens do pedido para 'embalado' (exemplo hipotético)
// Supondo que OrderItem tivesse um atributo 'status'
// const [orderWithItemsPacked, packedItems] = orderWithUpdatedItem.updateManyNested('items', { status: 'packed' });
// console.log(orderWithItemsPacked.items.values().next().value.status); // packed

// Adicionando um novo item ao pedido
const productC = new Product({ name: 'Smartwatch', price: 1200, stock: 30 });
const [orderWithNewItem, newItem3] = orderWithUpdatedItem.addNested('items', { product: productC, quantity: 1, unitPrice: productC.price });

console.log('Número total de itens após adicionar:', orderWithNewItem.items.size); // 3
console.log('Novo item adicionado:', newItem3.product.name); // Smartwatch
```

### Exemplo 5: Serialização para API com `toParams()`

```javascript
import { Customer, Address, Product, OrderItem, Payment, Order } from './marketplace_entities';

// ... (código para criar o pedido 'order' do Exemplo 3)
// Para fins de exemplo, vamos recriar o pedido aqui:
const customerAddress = new Address({ street: 'Av. Paulista', number: '1000', city: 'São Paulo', state: 'SP', zipCode: '01310-100' });
const customer = new Customer({ name: 'Ana Paula', email: 'ana.paula@example.com', address: customerAddress });
const productA = new Product({ name: 'Smartphone X', price: 3000, stock: 50 });
const productB = new Product({ name: 'Fone Bluetooth', price: 300, stock: 100 });
const item1 = new OrderItem({ product: productA, quantity: 1, unitPrice: productA.price });
const item2 = new OrderItem({ product: productB, quantity: 2, unitPrice: productB.price });
const payment = new Payment({ method: 'Credit Card', amount: (item1.quantity * item1.unitPrice) + (item2.quantity * item2.unitPrice), status: 'approved' });
const order = new Order({ customer: customer, items: [item1, item2], totalAmount: payment.amount, payment: payment, status: 'processing' });

const orderPayload = order.toParams();

console.log('Payload do Pedido para API:');
console.log(JSON.stringify(orderPayload, null, 2));

/* Saída esperada (simplificada):
{
  "customer": {
    "name": "Ana Paula",
    "email": "ana.paula@example.com",
    "phone": "",
    "address": {
      "street": "Av. Paulista",
      "number": "1000",
      "complement": "",
      "neighborhood": "",
      "city": "São Paulo",
      "state": "SP",
      "zipCode": "01310-100"
    }
  },
  "items": [
    {
      "product": {
        "name": "Smartphone X",
        "description": "",
        "price": 3000,
        "stock": 50
      },
      "quantity": 1,
      "unitPrice": 3000
    },
    {
      "product": {
        "name": "Fone Bluetooth",
        "description": "",
        "price": 300,
        "stock": 100
      },
      "quantity": 2,
      "unitPrice": 300
    }
  ],
  "totalAmount": 3600,
  "payment": {
    "method": "Credit Card",
    "amount": 3600,
    "status": "approved"
  },
  "status": "processing"
}
*/
```

---

## 🧠 Boas Práticas e Recomendações

Para tirar o máximo proveito do `RecordBase` e manter seu código limpo e consistente:

1.  **Sempre Estenda `RecordBase`:** Nunca use `RecordBase` diretamente. Crie suas classes de modelo (`Customer`, `Order`, etc.) estendendo-o.
2.  **Defina `defaultAttributes` Completamente:** Liste todos os atributos esperados em `static defaultAttributes`, mesmo que sejam `null` ou vazios. Isso garante a estrutura e o funcionamento dos getters automáticos.
3.  **Abrace a Imutabilidade:** Sempre use `set()`, `updateAttributes()`, `addNested()`, `updateNested()`, `updateManyNested()` para modificar instâncias. Nunca modifique as propriedades internas (`_attributes`, `_relations`) diretamente. Lembre-se de que esses métodos retornam **novas instâncias**.
4.  **Acesso a Relacionamentos:** Use os getters automáticos (`order.customer.name`) para acessar atributos de relacionamentos `belongsTo`. Para `hasMany`, acesse o `Map` (`order.items`) e use `Map.prototype.get()`, `Map.prototype.values()`, ou o método `array()` do `RecordBase` para converter para um array e iterar.
5.  **Validações Declarativas:** Mantenha suas funções de validação simples e focadas. O sistema de validação do `RecordBase` é poderoso e deve ser a principal forma de garantir a integridade dos dados no frontend.
6.  **`toParams()` para APIs:** Use `toParams()` para preparar os dados para envio ao backend. Ele lida com a serialização recursiva de relacionamentos, garantindo que o payload esteja no formato correto.
7.  **Testes Robustos:** Mantenha uma suíte de testes abrangente para seus modelos `RecordBase`. Isso é crucial para verificar a imutabilidade, o comportamento dos relacionamentos e as validações à medida que seu aplicativo evolui.

---

## 🧩 Extensibilidade

O `RecordBase` é projetado para ser extensível. Você pode sobrescrever métodos existentes ou adicionar novos para adaptar o comportamento às suas necessidades específicas. Por exemplo, você pode personalizar o método `toParams()` para um modelo específico:

```javascript
class CustomOrderRecord extends Order {
  toParams() {
    const baseParams = super.toParams(); // Obtém o payload padrão
    return {
      ...baseParams,
      customer_id: this.customer?.id, // Adiciona o ID do cliente diretamente
      item_ids: this.array('items').map(item => item.product.id) // Apenas IDs dos produtos
    };
  }
}
```

---

## 🧪 Testando seu `RecordBase`

O `RecordBase` é compatível com frameworks de teste como `Jest` ou `Vitest`. Os testes devem focar em:

*   **Imutabilidade:** Verificar se as operações de `set` e `updateAttributes` retornam novas instâncias e não modificam as originais.
*   **Integridade dos Relacionamentos:** Assegurar que `belongsTo` e `hasMany` instanciam corretamente os modelos relacionados e que as operações aninhadas funcionam.
*   **Validação:** Testar se as regras de validação são aplicadas corretamente e se a classe `Errors` coleta as mensagens esperadas.
*   **Serialização:** Verificar se `toObject()` e `toParams()` produzem a saída esperada.

---

## 📝 Notas Finais

O sistema `RecordBase` é uma solução elegante para gerenciar o estado de dados complexos em aplicações frontend. Ao padronizar a modelagem, impor a imutabilidade e fornecer ferramentas para validação e serialização, ele ajuda a construir aplicações mais robustas, previsíveis e fáceis de manter.

