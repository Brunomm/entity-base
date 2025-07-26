import RecordBase from './index';

class Carro extends RecordBase {
  static defaultAttributes = { name: '', ano: 0, preco: 0 };
}

class Company extends RecordBase {
  static defaultAttributes = { name: '' };
}

class UserRecord extends RecordBase {
  static defaultAttributes = {
    name: null,
    idade: 0,
    company: null,
    carros: []
  };

  static belongsTo = { company: Company };
  static hasMany = { carros: Carro };

  static validates = {
    name: [(val) => ({
      isValid: !!val,
      message: 'é obrigatório'
    })]
  };
}

// ==== Tests ====

describe('RecordBase', () => {
  it('deve instanciar corretamente', () => {
    const user = new UserRecord({ name: 'Ana' });
    expect(user.get('name')).toBe('Ana');
  });

  it('deve retornar novo objeto ao usar set()', () => {
    const user = new UserRecord({ name: 'Ana' });
    const updated = user.set('name', 'João');

    expect(user.get('name')).toBe('Ana');
    expect(updated.get('name')).toBe('João');
    expect(updated).not.toBe(user);
  });

  it('deve manter referência de hasMany ao alterar outro campo', () => {
    const user = new UserRecord({
      name: 'Ana',
      carros: [{ name: 'Celta', ano: 2009, preco: 20000 }]
    });

    const updated = user.set('name', 'Maria');

    expect(updated.get('carros')).toBe(user.get('carros'));
  });

  it('deve manter referência de belongsTo ao alterar outro campo', () => {
    const user = new UserRecord({
      name: 'Ana',
      company: { name: 'Google' }
    });

    const updated = user.set('name', 'Maria');

    expect(updated.get('company')).toBe(user.get('company'));
  });

  it('deve atualizar hasMany corretamente', () => {
    const user = new UserRecord({
      name: 'Ana',
      carros: []
    });

    const updated = user.set('carros', [{ name: 'Fiat', preco: 50000 }]);
    const carros = Array.from(updated.get('carros').values());

    expect(carros.length).toBe(1);
    expect(carros[0].get('name')).toBe('Fiat');
    expect(carros[0]).toBeInstanceOf(Carro);
  });

  it('deve validar campos obrigatórios', () => {
    const user = new UserRecord({});
    const validated = user.validate();

    expect(validated.get('errors').isEmpty()).toBe(false);
    expect(validated.get('errors').fullMessages()).toContain('Name é obrigatório');
  });

  it('deve retornar objeto plano com toObject()', () => {
    const user = new UserRecord({
      name: 'Carlos',
      company: { name: 'XPTO' }
    });

    const obj = user.toObject();
    expect(obj.name).toBe('Carlos');
    expect(obj.company).toBeInstanceOf(Company);
  });

  it('deve identificar registros novos e persistidos corretamente', () => {
    const user1 = new UserRecord({});
    const user2 = new UserRecord({ id: 123 });

    expect(user1.isNewRecord()).toBe(true);
    expect(user2.isPersisted()).toBe(true);
  });

  it('não deve criar nova instância se valor não mudar', () => {
    const user = new UserRecord({ name: 'Luisa' });
    const updated = user.set('name', 'Luisa');
    expect(updated).toBe(user);
  });
});
