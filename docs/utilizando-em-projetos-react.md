# Utilizando o `RecordBase` em Projetos React

O `RecordBase` é uma ferramenta poderosa para o gerenciamento de estado em aplicações React, especialmente em cenários complexos que envolvem formulários, dados aninhados e a necessidade de um controle de estado previsível. A imutabilidade inerente do `RecordBase` se alinha perfeitamente com a filosofia do React, onde as atualizações de estado devem ser feitas de forma imutável para garantir que o React detecte as mudanças e renderize os componentes de forma eficiente.

Este guia demonstra como integrar o `RecordBase` em seus componentes React, com foco no controle de estado de formulários e na manipulação de associações `hasMany`, como em um carrinho de compras.

## 1. Configuração Inicial

Primeiro, certifique-se de que suas entidades `RecordBase` (como `Customer`, `Order`, `Product`, etc.) estão definidas e exportadas de um arquivo, como `marketplace_entities.js`.

```javascript
// marketplace_entities.js
import RecordBase from './index';

// ... (definição das classes Address, Customer, Product, OrderItem, Payment, Order)

export { Address, Customer, Product, OrderItem, Payment, Order };
```

## 2. Gerenciamento de Estado com `useState` e `RecordBase`

Você pode gerenciar o estado de um componente React utilizando o hook `useState` com uma instância de `RecordBase`. Como o `RecordBase` é imutável, cada vez que você atualiza o estado, uma nova instância do objeto é criada, o que aciona a re-renderização do componente no React.

### Exemplo: Formulário de Cadastro de Cliente

Neste exemplo, criamos um formulário para cadastrar um cliente e seu endereço. O estado do formulário é gerenciado por uma instância de `Customer`.

```jsx
import React, { useState } from 'react';
import { Customer, Address } from './marketplace_entities';

const CustomerForm = () => {
  const [customer, setCustomer] = useState(new Customer());

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updatedCustomer = customer.set(name, value);
    setCustomer(updatedCustomer);
  };

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    const updatedAddress = (customer.address || new Address()).set(name, value);
    const updatedCustomer = customer.set('address', updatedAddress);
    setCustomer(updatedCustomer);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validatedCustomer = customer.validate();
    if (validatedCustomer.isValid()) {
      console.log('Enviando para a API:', validatedCustomer.toParams());
      // Lógica para enviar para a API...
    } else {
      setCustomer(validatedCustomer);
      alert('Erros de validação:\n' + validatedCustomer.errors.fullMessages().join('\n'));
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Cadastro de Cliente</h2>
      <input
        type="text"
        name="name"
        value={customer.name}
        onChange={handleChange}
        placeholder="Nome"
      />
      <input
        type="email"
        name="email"
        value={customer.email}
        onChange={handleChange}
        placeholder="Email"
      />

      <h3>Endereço</h3>
      <input
        type="text"
        name="street"
        value={customer.address?.street || ''}
        onChange={handleAddressChange}
        placeholder="Rua"
      />
      {/* Outros campos de endereço... */}

      <button type="submit">Salvar</button>
    </form>
  );
};

export default CustomerForm;
```

Neste exemplo:

*   O estado `customer` é inicializado com `new Customer()`.
*   `handleChange` e `handleAddressChange` usam `customer.set()` para atualizar os atributos. Isso retorna uma **nova instância** de `Customer`, que é passada para `setCustomer`, acionando a re-renderização.
*   No `handleSubmit`, `customer.validate()` também retorna uma nova instância com os erros, que é usada para atualizar o estado e exibir as mensagens de erro.

## 3. Manipulando Associações `hasMany` em React

O `RecordBase` simplifica o gerenciamento de associações `hasMany`, como os itens de um carrinho de compras. Os métodos `addNested`, `updateNested` e `removeNested` (que pode ser implementado) permitem manipular a coleção de forma imutável.

### A Função `array(relationName)`

Uma das funcionalidades mais úteis para trabalhar com `hasMany` em React é o método `array(relationName)`. Relacionamentos `hasMany` são armazenados como `Map` para acesso eficiente por chave. No entanto, para renderizar uma lista de componentes em React, um array é necessário. O método `array()` converte o `Map` em um array de instâncias `RecordBase`, facilitando o uso do método `.map()` do JavaScript para renderização.

### Exemplo: Componente de Carrinho de Compras

Vamos criar um componente de carrinho de compras que permite adicionar, atualizar a quantidade e remover itens.

```jsx
import React, { useState } from 'react';
import { Order, Product, OrderItem } from './marketplace_entities';

// Produtos de exemplo
const availableProducts = [
  new Product({ id: 1, name: 'Laptop', price: 5000 }),
  new Product({ id: 2, name: 'Mouse', price: 150 }),
  new Product({ id: 3, name: 'Teclado', price: 300 })
];

const ComponentItem = ({ onRemove, updateQuantity, item }) => {
  return (
    <div>
      <span>{item.product.name}</span>
      <input
        type="number"
        value={item.quantity}
        onChange={(e) => updateQuantity(item.idOrToken, parseInt(e.target.value, 10))}
      />
      <span>Subtotal: R$ {item.quantity * item.unitPrice}</span>
      <button onClick={() => onRemove(item.idOrToken)}>Remover</button>
    </div>
  )
}

const ShoppingCart = () => {
  const [order, setOrder] = useState(new Order());

  const addProductToCart = (product) => {
    // Verifica se o produto já está no carrinho
    const existingItem = order.array('items').get(product.idOrToken);

    if (existingItem) {
      // Se já existe, atualiza a quantidade
      const [updatedOrder] = order.updateNested('items', existingItem.idOrToken, {
        quantity: existingItem.quantity + 1
      });
      setOrder(updatedOrder);
    } else {
      // Se não existe, adiciona um novo item
      const [updatedOrder] = order.addNested('items', {
        product: product,
        quantity: 1,
        unitPrice: product.price
      });
      setOrder(updatedOrder);
    }
  };

  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity > 0) {
      const [updatedOrder] = order.updateNested('items', itemId, { quantity: newQuantity });
      setOrder(updatedOrder);
    } else {
      // Se a quantidade for 0 ou menos, remove o item
      removeItem(itemId);
    }
  };

  const removeItem = (itemId) => {
    const itemsMap = new Map(order.items);
    itemsMap.delete(itemId);
    const updatedOrder = order.set('items', itemsMap);
    setOrder(updatedOrder);
  };

  return (
    <div>
      <h2>Carrinho de Compras</h2>

      <div>
        <h3>Produtos Disponíveis</h3>
        {availableProducts.map(product => (
          <div key={product.id}>
            {product.name} - R$ {product.price}
            <button onClick={() => addProductToCart(product)}>Adicionar ao Carrinho</button>
          </div>
        ))}
      </div>

      <h3>Itens no Carrinho</h3>
      {order.get('items').size === 0 ? (
        <p>O carrinho está vazio.</p>
      ) : (
        // Usando order.array('items') para facilitar o loop
        order.array('items').map(item => (
          <ComponentItem
            key={item.idOrToken}
            item={item}
            onRemove={removeItem}
            updateQuantity={updateQuantity}
          />
        ))
      )}

      <h3>Total do Pedido: R$ {order.totalValue()}</h3>
    </div>
  );
};


export default ShoppingCart;
```

Neste exemplo de carrinho de compras:

*   `addProductToCart` usa `order.addNested()` para adicionar novos itens e `order.updateNested()` para atualizar a quantidade de itens existentes, garantindo a imutabilidade.
*   `updateQuantity` e `removeItem` também retornam novas instâncias de `Order`, que são usadas para atualizar o estado.
*   O cálculo do total do pedido é um método personalizado de Order.

## Conclusão

O `RecordBase` oferece uma abordagem estruturada e imutável para o gerenciamento de estado em aplicações React. Ao combinar o `RecordBase` com o hook `useState`, você pode criar componentes com estado complexo de forma previsível e fácil de manter. A função `array()` é particularmente útil para simplificar a renderização de listas a partir de associações `hasMany`, tornando o código mais limpo e legível.

